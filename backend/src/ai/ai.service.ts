import {
  Injectable,
  Logger,
  OnModuleInit,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

import { AiConversationEntity } from './entities/ai-conversation.entity';
import { StoreSettingsEntity } from '../store-settings/entities';
import { AreaEntity } from '../areas/entities/area.entity';
import {
  TournamentEntity,
  TournamentRegistrationEntity,
} from '../tournaments/entities/tournament.entity';
import { ChatResponseDto, FbAiResponseDto } from './dto/chat.dto';

// gpt-4o-mini pricing (per 1K tokens, USD)
const PRICING = {
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4.1-mini': { input: 0.0004, output: 0.0016 },
  'gpt-4.1': { input: 0.002, output: 0.008 },
  'gpt-5-mini': { input: 0.0004, output: 0.0016 },
};

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;
  private readonly model: string;

  // In-memory conversation history (key: sessionId, value: messages)
  private readonly conversations = new Map<
    string,
    OpenAI.Chat.ChatCompletionMessageParam[]
  >();

  // Simple in-memory cache for DB context (key → { data, expires })
  private readonly cache = new Map<string, { data: string; expires: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AiConversationEntity)
    private readonly conversationRepo: Repository<AiConversationEntity>,
    @InjectRepository(StoreSettingsEntity)
    private readonly storeSettingsRepo: Repository<StoreSettingsEntity>,
    @InjectRepository(AreaEntity)
    private readonly areaRepo: Repository<AreaEntity>,
    @InjectRepository(TournamentEntity)
    private readonly tournamentRepo: Repository<TournamentEntity>,
    @InjectRepository(TournamentRegistrationEntity)
    private readonly registrationRepo: Repository<TournamentRegistrationEntity>,
  ) {
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }

  onModuleInit() {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');

    if (!apiKey || apiKey.trim() === '') {
      this.logger.warn(
        '[AiService] OPENAI_API_KEY chưa được cấu hình — tính năng AI bị vô hiệu hoá',
      );
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      this.logger.warn(
        '[AiService] OPENAI_API_KEY có định dạng không chuẩn (không bắt đầu bằng "sk-")',
      );
    }

    this.openai = new OpenAI({ apiKey: apiKey.trim() });
    this.logger.log(
      `[AiService] Khởi động thành công | Model: ${this.model} | OpenAI SDK v${this.getSdkVersion()}`,
    );
  }

  private ensureOpenAI() {
    if (!this.openai) {
      throw new HttpException(
        'Tính năng AI chưa được cấu hình (thiếu OPENAI_API_KEY)',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC METHODS
  // ─────────────────────────────────────────────────────────

  /**
   * Chat thông thường cho nhân viên/quản lý (không có DB context)
   */
  async chat(message: string, sessionId?: string): Promise<ChatResponseDto> {
    this.ensureOpenAI();
    const sid = sessionId || uuidv4();
    const startTime = Date.now();

    this.logger.log(
      `[CHAT:STAFF] Session=${sid} | Msg="${message.slice(0, 80)}..."`,
    );

    const history = this.getOrCreateHistory(sid);
    history.push({ role: 'user', content: message });

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.getStaffSystemPrompt() },
          ...history.slice(-20), // giữ tối đa 20 messages gần nhất
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content ?? '';
      history.push({ role: 'assistant', content: reply });
      this.conversations.set(sid, history);

      this.logUsage('CHAT:STAFF', completion.usage, startTime);
      await this.persistConversation(
        sid,
        message,
        reply,
        completion.usage,
        'staff',
      );

      return { reply, session_id: sid, model: this.model };
    } catch (err) {
      return this.handleOpenAIError(err);
    }
  }

  /**
   * Trả lời câu hỏi khách hàng với dữ liệu thực tế từ PostgreSQL
   *
   * Luồng: Câu hỏi → Phân tích intent → Query DB → Build prompt → GPT → Trả lời
   */
  async answerCustomerQuestion(
    message: string,
    sessionId?: string,
  ): Promise<ChatResponseDto> {
    this.ensureOpenAI();
    const sid = sessionId || uuidv4();
    const startTime = Date.now();

    this.logger.log(
      `[CHAT:CUSTOMER] Session=${sid} | Question="${message.slice(0, 80)}"`,
    );

    // Bước 1: Phân tích intent từ câu hỏi
    const intents = this.analyzeIntent(message);
    this.logger.log(
      `[CHAT:CUSTOMER] Intents phát hiện: [${intents.join(', ')}]`,
    );

    // Bước 2: Query dữ liệu liên quan từ DB
    const dbContext = await this.buildDbContext(intents);

    // Bước 3: Tạo prompt với dữ liệu thực tế
    const systemPrompt = this.buildCustomerSystemPrompt(dbContext);

    const sid_customer = `customer_${sid}`;
    const history = this.getOrCreateHistory(sid_customer);
    history.push({ role: 'user', content: message });

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-10), // ít context hơn để tiết kiệm token
        ],
        max_tokens: 800,
        temperature: 0.5, // sáng tạo ít hơn, chính xác hơn
      });

      const reply = completion.choices[0]?.message?.content ?? '';
      history.push({ role: 'assistant', content: reply });
      this.conversations.set(sid_customer, history);

      this.logUsage('CHAT:CUSTOMER', completion.usage, startTime);
      await this.persistConversation(
        sid,
        message,
        reply,
        completion.usage,
        'customer',
      );

      return { reply, session_id: sid, model: this.model };
    } catch (err) {
      return this.handleOpenAIError(err);
    }
  }

  /**
   * Xóa lịch sử hội thoại của một session
   */
  clearHistory(sessionId: string): { cleared: boolean; session_id: string } {
    const deletedStaff = this.conversations.delete(sessionId);
    const deletedCustomer = this.conversations.delete(`customer_${sessionId}`);

    this.logger.log(
      `[CHAT] Đã xóa lịch sử | Session=${sessionId} | staff=${deletedStaff} | customer=${deletedCustomer}`,
    );

    return { cleared: true, session_id: sessionId };
  }

  // ─────────────────────────────────────────────────────────
  // FACEBOOK MESSENGER
  // ─────────────────────────────────────────────────────────

  /**
   * Trả lời tin nhắn Messenger.
   * Nhận vào history (10 tin gần nhất) từ FacebookService để tránh circular dependency.
   *
   * @param psid   Page-Scoped ID của khách hàng
   * @param message  Tin nhắn mới nhất
   * @param history  Lịch sử hội thoại gần nhất (user/assistant turns)
   */
  async answerFacebookMessage(
    psid: string,
    message: string,
    history: Array<{ role: string; content: string }> = [],
    pageName: string = 'AZ POOLARENA',
  ): Promise<FbAiResponseDto> {
    this.ensureOpenAI();
    const startTime = Date.now();
    this.logger.log(
      `[FB:AI] PSID=${psid} | page="${pageName}" | "${message.slice(0, 80)}"`,
    );

    // Phân tích intent và lấy DB context
    const intents = this.analyzeIntent(message);
    const dbContext = await this.buildDbContext(intents);
    const systemPrompt = this.buildFacebookSystemPrompt(dbContext, pageName);

    // Chuyển history sang đúng type OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      // Chỉ gửi 5 tin gần nhất để giảm token → tăng tốc độ
      ...history.slice(-5).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 300,
        temperature: 0.3,
      });

      const reply = completion.choices[0]?.message?.content ?? '';
      const usage = completion.usage;
      const inputTokens = usage?.prompt_tokens ?? 0;
      const outputTokens = usage?.completion_tokens ?? 0;
      const cachedTokens =
        (usage as any)?.prompt_tokens_details?.cached_tokens ?? 0;
      const cost = this.estimateCostWithCache(
        inputTokens,
        outputTokens,
        cachedTokens,
      );

      this.logUsageWithCache('FB:AI', usage, cachedTokens, startTime);

      return {
        reply,
        model: this.model,
        tokensUsed: usage?.total_tokens ?? 0,
        cost,
      };
    } catch (err) {
      return this.handleOpenAIError(err);
    }
  }

  // System prompt tĩnh >1024 tokens — phần này sẽ được OpenAI cache tự động.
  // OpenAI tự động cache prefix của prompt khi độ dài >= 1024 tokens.
  // Cached tokens giảm chi phí 50% và latency ~200ms.
  // QUY TẮC: phần TĨNH (không đổi) phải đặt ĐẦU prompt, phần ĐỘNG (DB data) đặt CUỐI.
  private buildFacebookSystemPrompt(
    dbContext: string,
    pageName: string = 'AZ POOLARENA',
  ): string {
    // Phần TĨNH này >1024 tokens → OpenAI tự động cache sau request đầu tiên.
    // Cache hit giảm latency ~200ms và chi phí input token 50%.
    const STATIC_PREFIX = `Bạn là JARVIS — trợ lý AI chính thức của ${pageName}, phòng bida chuyên nghiệp tại Việt Nam.

## Danh tính & Phong cách
- Tên: JARVIS
- Xưng: "mình", gọi khách: "bạn"
- Ngôn ngữ: Tiếng Việt
- Giọng điệu: thân thiện, vui vẻ, gần gũi như người bạn, KHÔNG cứng nhắc
- Không dùng emoji, icon, ký tự đặc biệt
- Mỗi câu trả lời ngắn gọn, dễ đọc trên điện thoại

## Lần đầu khách chào
Trả lời: "Xin chào bạn, mình là JARVIS trợ lý AI của ${pageName}, mình có thể hỗ trợ gì cho bạn?"

## THÔNG TIN QUÁN
- Tên: ${pageName}
- Địa chỉ: Tháp Tây, Chung cư Học viện Quốc phòng
- Số điện thoại hỗ trợ: 0364756638
- Giờ mở cửa: 24/7 (mở cửa cả ngày lẫn đêm)

## BẢNG GIÁ CHƠI BIDA
Giá theo giờ:
- Từ 12h00 - 00h00: 70.000đ/giờ
- Từ 00h00 - 12h00: 50.000đ/giờ

Combo tiết kiệm:
- Combo 2 giờ: 129.000đ (tặng 1 nước)
- Combo 3 giờ: 189.000đ (tặng 1 nước)
- Combo 4 giờ: 249.000đ (tặng 1 nước + 1 đĩa hoa quả)
- Combo 6 giờ: 369.000đ (tặng 2 nước + 1 đĩa hoa quả)
- Combo ngày: 249.000đ (chơi từ 08h00 - 16h00)
- Buffet đêm: 89.000đ/người

## DỊCH VỤ SỬA CƠ BIDA TẠI QUÁN
- Thay tẩy cơ bida: có
- Thay da gậy bida: có
- Bo đầu tẩy: có
- Thay phíp cơ bida: có

## XỬ LÝ ĐẶT BÀN
Khi khách muốn đặt bàn, hỏi và xác nhận lại các thông tin sau:
1. Thời gian muốn đến (ngày, giờ)
2. Số lượng người chơi
3. Số điện thoại liên hệ
Sau khi có đủ thông tin, xác nhận lại với khách rồi trả lời:
"Mình đã ghi nhận thông tin đặt bàn của bạn rồi. Mình sẽ chuyển thông tin này đến nhân viên và họ sẽ liên hệ xác nhận lại với bạn sớm nhất có thể nhé!"

## XỬ LÝ YÊU CẦU CẮT CAM
Khi khách muốn cắt cam (quay phim màn hình bảng tỉ số), hỏi đủ 3 thông tin:
1. Thời gian muốn cắt (ngày, giờ)
2. Số bàn đang chơi
3. Số điện thoại (Zalo) của khách
Sau khi có đủ, trả lời:
"Mình đã lưu lại yêu cầu cắt cam của bạn rồi. Nhân viên sẽ gửi file cho bạn qua Zalo số [SĐT khách] sớm nhất có thể nhé!
Ngoài ra bạn biết không, bảng tỉ số tại ${pageName} đã hỗ trợ tính năng cắt cam trực tiếp tại quán luôn đó. Nếu bạn muốn tự cắt mà chưa biết cách dùng, cứ nhờ nhân viên hỗ trợ ngay tại chỗ là được nhé!"

## HƯỚNG DẪN ĐĂNG KÝ TÀI KHOẢN & ĐĂNG NHẬP POOLARENA.VN
Khi khách hỏi cách tạo tài khoản, đăng ký, hoặc đăng nhập:
"Bạn tạo tài khoản trên poolarena.vn theo các bước sau nhé:
1. Truy cập https://poolarena.vn/login
2. Bấm 'Đăng ký' (nếu chưa có tài khoản)
3. Điền thông tin: họ tên, số điện thoại, mật khẩu
4. Xác nhận OTP qua số điện thoại
5. Đăng nhập lại bằng số điện thoại và mật khẩu vừa tạo
Sau khi có tài khoản, bạn có thể đăng ký giải đấu, theo dõi lịch thi đấu, xem bảng xếp hạng và thành tích cá nhân.
Nếu cần hỗ trợ thêm bạn liên hệ số 0364756638 nhé!"

## HƯỚNG DẪN ĐĂNG KÝ GIẢI ĐẤU
Khi khách hỏi cách đăng ký giải, hướng dẫn từng bước:
"Bạn đăng ký giải theo các bước sau nhé:
1. Truy cập website poolarena.vn và tạo tài khoản (nếu chưa có)
2. Chọn giải đấu muốn tham gia
3. Bấm 'Đăng ký giải' và thanh toán lệ phí để hoàn tất đăng ký
4. Sau khi đăng ký xong, vào trang Trận đấu để xem lịch thi đấu, tên đối thủ, thời gian và số bàn diễn ra trận của mình.
Nếu cần hỗ trợ thêm bạn liên hệ số 0364756638 nhé!"

## HỆ THỐNG PHÂN HẠNG LEVEL - POOLARENA.VN
Nhằm tối ưu hóa tính minh bạch và hiện đại hóa trải nghiệm, hệ thống của POOLARENA.VN KHÔNG sử dụng cách phân cấp truyền thống theo các hạng G, H, I cũ, mà thay vào đó là bộ tiêu chuẩn LEVEL từ Level 1 đến Level 10 (MASTER), giúp đánh giá chính xác và công bằng nhất năng lực thực tế của từng cơ thủ.
Chi tiết xem tại: https://poolarena.vn/info

QUY TẮC PHẢN HỒI VỀ LEVEL:
1. Nếu khách hàng hỏi chung chung về barem hạng, bảng hạng, level (ví dụ: "Barem hạng là gì", "Cho mình xin barem hạng", "Level phân thế nào"):
   - Tuyệt đối KHÔNG liệt kê chi tiết các Level 1, 2, 3... ra tin nhắn.
   - Trả lời ngắn gọn và gửi link: "Bạn tham khảo barem xếp hạng Level chi tiết tại đây nhé: https://poolarena.vn/info"
2. Nếu khách hàng hỏi cụ thể dựa trên năng lực thi đấu của họ (ví dụ: "đi được bao nhiêu bóng", "giải hình", "đi chấm", "đi được 3 bóng đánh hạng gì", "đi 1 chấm thì lv mấy", v.v.):
   - Hãy dựa vào Barem xếp hạng bên dưới để phân tích và gợi ý cho khách nên đăng ký Level mấy.
   - Cuối câu trả lời BẮT BUỘC phải thêm đúng dòng sau (không tự ý thay đổi từ ngữ): "Lưu ý rằng barem chỉ mang tính tham khảo, cơ thủ có thể đăng ký lên 1 level để đánh thoát tay. Nếu cần thêm thông tin, bạn cứ hỏi mình nhé!"

Barem xếp hạng Level (chỉ dùng để gợi ý khi khách nêu cụ thể số bóng/hình/chấm):
- Level 1: Dành cho cơ thủ nữ (hoặc nam thực sự yếu rớt từ Level 2 xuống). Nữ đánh tốt ngang Level 2-4 thì đăng ký đúng hạng.
- Level 2: Cơ thủ đang tập chơi, đi được 1-4 bóng, KHÔNG đi được chấm. Phù hợp hạng I, K ở giải ngoài nhưng chưa được giải.
- Level 3: Đi được 3-5 bóng, có thể đi 1 chấm trên 10 game. Có tư duy hình, chạy đạn cơ bản. Phù hợp cơ thủ vô địch giải HIK ngoài.
- Level 4: Đi hình 4-6 bóng, sử dụng đầu cơ/áp phê thành thạo. Chỉ nhận cơ thủ thăng hạng từ Level 3 qua hệ thống tính điểm nội bộ.
- Level 5: Trình độ khá-giỏi, đi hình 6-9 bóng. Chỉ nhận cơ thủ thăng hạng từ hệ thống tính điểm hoặc BTC kiểm định.
- Level 6-10 (MASTER): Các cấp độ cao hơn dành cho cơ thủ chuyên nghiệp, được BTC kiểm định và thăng hạng qua hệ thống.

## XỬ LÝ CÂU HỎI VỀ KẾT QUẢ GIẢI ĐẤU
Khi khách hỏi "ai vô địch", "giải trước", "kết quả giải" — hãy tra cứu DỮ LIỆU THỰC TẾ bên dưới. Nếu có thông tin nhà vô địch, trả lời kèm link xem chi tiết giải: https://poolarena.vn/tournaments/[slug-giải]
Ví dụ: "Giải RANK-UP SERIES ngày 16/06 vừa rồi, nhà vô địch là [tên]. Bạn xem chi tiết tại: https://poolarena.vn/tournaments/rank-up-series-20260616"

## THÔNG TIN NHÓM ZALO
- Nhóm giải đấu: https://zalo.me/g/qazqsv816
  Khi khách hỏi về giải đấu, LUÔN gửi kèm: "Bạn có thể tham gia nhóm Zalo giải đấu tại đây để cập nhật thông tin nhanh nhất nhé: https://zalo.me/g/qazqsv816"
- Nhóm khuyến mãi: https://zalo.me/g/ytqpxk355
  Khi khách hỏi về khuyến mãi/ưu đãi/giảm giá, LUÔN gửi kèm: "Bạn tham gia nhóm Zalo khuyến mãi để nhận ưu đãi mới nhất nhé: https://zalo.me/g/ytqpxk355"

## QUY TẮC TRẢ LỜI
1. Trả lời thân thiện, tự nhiên như người bạn — không cứng nhắc kiểu robot
2. Chỉ dùng thông tin trong prompt này và DỮ LIỆU THỰC TẾ bên dưới
3. Không bịa đặt thông tin không có
4. Không có thông tin → "Cái này mình chưa có thông tin chính xác, bạn liên hệ trực tiếp số 0364756638 để được hỗ trợ nhanh nhất nhé!"
5. Khiếu nại → "Mình rất tiếc khi nghe điều này. Bạn liên hệ số 0364756638 để quản lý hỗ trợ bạn trực tiếp nhé!"`;

    const now = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return `${STATIC_PREFIX}

## THỜI GIAN HIỆN TẠI
Bây giờ là: ${now}
Khi khách hỏi "tuần này", "hôm nay", "tháng này" — hãy so sánh với thời gian trên để trả lời chính xác. Nếu không có giải nào trong khoảng thời gian khách hỏi, hãy nói rõ là không có và cho biết giải gần nhất sắp tới.

## DỮ LIỆU THỰC TẾ TỪ HỆ THỐNG (giải đấu, khu vực bàn)
${dbContext || 'Hiện chưa có dữ liệu realtime.'}`;
  }

  // ─────────────────────────────────────────────────────────
  // INTENT ANALYSIS
  // ─────────────────────────────────────────────────────────

  private analyzeIntent(message: string): string[] {
    const lower = message.toLowerCase();
    const intents = new Set<string>();

    // Giá / chi phí
    if (/giá|price|bao nhiêu|tiền|phí|cost|rate|charge|mắc|rẻ/.test(lower)) {
      intents.add('pricing');
    }
    // Bàn / đặt chỗ
    if (/bàn|table|đặt|book|còn trống|available|slot|chỗ|thuê/.test(lower)) {
      intents.add('tables');
    }
    // Giờ mở cửa
    if (/giờ|open|đóng|close|mở cửa|hoạt động|time|khi nào/.test(lower)) {
      intents.add('hours');
    }
    // Địa chỉ / vị trí
    if (
      /địa chỉ|address|đường|ở đâu|location|chỗ nào|tìm|quận|phường/.test(lower)
    ) {
      intents.add('location');
    }
    // Liên hệ
    if (
      /liên hệ|contact|số điện thoại|phone|zalo|hotline|gọi|nhắn/.test(lower)
    ) {
      intents.add('contact');
    }
    // Khuyến mãi / ưu đãi
    if (
      /khuyến mãi|ưu đãi|giảm giá|sale|promo|coupon|voucher|deal|khuyến|ưu đãi/.test(
        lower,
      )
    ) {
      intents.add('promotion');
    }
    // Giải đấu / sự kiện (mở rộng: đăng ký, tuần này, tháng này, số người)
    if (
      /giải đấu|tournament|thi đấu|event|cuộc thi|cup|championship|giải|đăng ký|đã đăng|tuần này|tháng này|hôm nay|số người|tổng người|còn chỗ|slot/.test(
        lower,
      )
    ) {
      intents.add('tournament');
    }
    // Dịch vụ
    if (
      /dịch vụ|service|có gì|menu|thức ăn|uống|tiện ích|wifi|parking/.test(
        lower,
      )
    ) {
      intents.add('services');
    }
    // Thành viên / rank
    if (/thành viên|member|rank|xếp hạng|điểm|vip|hội viên/.test(lower)) {
      intents.add('membership');
    }
    // Phân hạng level / barem level
    if (/level|hạng|barem|rank|xếp hạng|phân hạng|cấp độ|lv\s?\d/.test(lower)) {
      intents.add('level');
    }

    if (intents.size === 0) intents.add('general');
    return [...intents];
  }

  // ─────────────────────────────────────────────────────────
  // DATABASE CONTEXT BUILDING
  // ─────────────────────────────────────────────────────────

  private async buildDbContext(intents: string[]): Promise<string> {
    const cacheKey = `ctx_${[...intents].sort().join('_')}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      this.logger.debug(
        `[CACHE HIT] DB context cho intents: ${intents.join(', ')}`,
      );
      return cached;
    }

    const sections: string[] = [];

    // Thông tin cửa hàng — luôn lấy
    const storeInfo = await this.getStoreInfo();
    if (storeInfo) sections.push(storeInfo);

    // Thông tin bàn / khu vực
    if (intents.includes('tables') || intents.includes('general')) {
      const tableInfo = await this.getTableInfo();
      if (tableInfo) sections.push(tableInfo);
    }

    // Thông tin giải đấu
    if (intents.includes('tournament') || intents.includes('general')) {
      const tournamentInfo = await this.getTournamentInfo();
      if (tournamentInfo) sections.push(tournamentInfo);
    }

    const context = sections.join('\n\n');
    this.setCache(cacheKey, context);
    return context;
  }

  private async getStoreInfo(): Promise<string | null> {
    try {
      const store = await this.storeSettingsRepo.findOne({ where: {} });
      if (!store) return null;

      const address = [
        store.address,
        store.ward,
        store.district,
        store.province,
      ]
        .filter(Boolean)
        .join(', ');

      return `## Thông tin AZ Pool Arena
- Tên: ${store.name}
- Địa chỉ: ${address || 'Chưa cập nhật'}
- Điện thoại: ${store.phone_number || store.phone || 'Chưa cập nhật'}
- Email: ${store.gmail || 'Chưa cập nhật'}
- Facebook: ${store.facebook_url || 'Chưa cập nhật'}
- TikTok: ${store.tiktok_url || 'Chưa cập nhật'}`;
    } catch (err) {
      this.logger.warn(`[DB] Không lấy được store settings: ${err.message}`);
      return null;
    }
  }

  private async getTableInfo(): Promise<string | null> {
    try {
      const areas = await this.areaRepo.find({
        select: ['id', 'name', 'description', 'table_count'],
        order: { name: 'ASC' },
      });

      if (!areas.length) return null;

      const lines = areas.map(
        (a) =>
          `- ${a.name}: ${a.table_count} bàn${a.description ? ` (${a.description})` : ''}`,
      );

      return `## Khu vực & Bàn bida\n${lines.join('\n')}`;
    } catch (err) {
      this.logger.warn(`[DB] Không lấy được thông tin bàn: ${err.message}`);
      return null;
    }
  }

  private async getTournamentInfo(): Promise<string | null> {
    try {
      // Lấy giải ongoing + upcoming + completed trong 30 ngày gần đây
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const tournaments = await this.tournamentRepo
        .createQueryBuilder('t')
        .where('t.status IN (:...statuses)', {
          statuses: ['ongoing', 'upcoming', 'completed'],
        })
        .andWhere('(t.start_date >= :since OR t.status != :completed)', {
          since: thirtyDaysAgo,
          completed: 'completed',
        })
        .select([
          't.id',
          't.name',
          't.slug',
          't.status',
          't.start_date',
          't.registration_end_date',
          't.location',
          't.support_phone',
          't.number_of_players',
          't.registration_fee',
          't.total_prize',
          't.ranks',
        ])
        .orderBy('t.start_date', 'ASC')
        .take(10)
        .getMany();

      if (!tournaments.length)
        return '## Giải đấu\nHiện không có giải đấu nào đang diễn ra hoặc sắp tới.';

      // Đếm số người đăng ký từng giải một lần query
      const tournamentIds = tournaments.map((t) => t.id);
      const regCounts: { tournament_id: number; count: string }[] =
        await this.registrationRepo
          .createQueryBuilder('r')
          .select('r.tournament_id', 'tournament_id')
          .addSelect('COUNT(r.id)', 'count')
          .where('r.tournament_id IN (:...ids)', { ids: tournamentIds })
          .groupBy('r.tournament_id')
          .getRawMany();

      const countMap = new Map(
        regCounts.map((r) => [r.tournament_id, Number(r.count)]),
      );

      // Truy vấn nhà vô địch cho các giải đã kết thúc (completed)
      let championMap = new Map<number, string>();
      if (tournamentIds.length > 0) {
        try {
          const champions: { tournament_id: number; champion_name: string }[] =
            await this.tournamentRepo.manager.query(`
            SELECT m.tournament_id, u.full_name AS champion_name
            FROM tournament_matches m
            JOIN (
              SELECT tournament_id, MAX(round) as max_round
              FROM tournament_matches
              WHERE bracket = 'knockout' AND status = 'completed' AND tournament_id IN (${tournamentIds.join(',')})
              GROUP BY tournament_id
            ) max_m ON m.tournament_id = max_m.tournament_id AND m.round = max_m.max_round AND m.bracket = 'knockout'
            JOIN users u ON u.id = m.winner_id
          `);
          championMap = new Map(
            champions.map((c) => [c.tournament_id, c.champion_name]),
          );
        } catch (dbErr: unknown) {
          const errorMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
          this.logger.warn(
            `[DB] Không lấy được thông tin nhà vô địch: ${errorMsg}`,
          );
        }
      }

      const STATUS_MAP: Record<string, string> = {
        ongoing: 'Đang diễn ra',
        upcoming: 'Sắp diễn ra',
        completed: 'Đã kết thúc',
      };

      const fmt = (d: Date) =>
        d
          ? new Date(d).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : null;

      const lines = tournaments.map((t) => {
        const registered = countMap.get(t.id) ?? 0;
        const championName = championMap.get(t.id);
        const parts = [
          `- Tên giải: ${t.name}`,
          `  Trạng thái: ${STATUS_MAP[t.status] ?? t.status}`,
          `  Link xem giải & đăng ký: https://poolarena.vn/tournaments/${t.slug}`,
        ];
        if (championName) {
          parts.push(`  Nhà vô địch: ${championName}`);
        }
        if (t.start_date) parts.push(`  Ngày bắt đầu: ${fmt(t.start_date)}`);
        if (t.registration_end_date)
          parts.push(`  Hạn đăng ký: ${fmt(t.registration_end_date)}`);
        parts.push(
          `  Số người đã đăng ký: ${registered}/${t.number_of_players ?? '?'} người`,
        );
        if (t.registration_fee)
          parts.push(
            `  Lệ phí: ${Number(t.registration_fee).toLocaleString('vi-VN')}đ`,
          );
        if (t.total_prize)
          parts.push(
            `  Tổng giải thưởng: ${Number(t.total_prize).toLocaleString('vi-VN')}đ`,
          );
        if (t.ranks) {
          try {
            const rankList: string[] = JSON.parse(t.ranks);
            if (rankList.length)
              parts.push(`  Hạng tham dự: ${rankList.join(', ')}`);
          } catch {
            /* ignore */
          }
        }
        if (t.location) parts.push(`  Địa điểm: ${t.location}`);
        if (t.support_phone) parts.push(`  Liên hệ: ${t.support_phone}`);
        return parts.join('\n');
      });

      return `## Giải đấu (30 ngày gần nhất + sắp tới)\n${lines.join('\n\n')}`;
    } catch (err: any) {
      this.logger.warn(
        `[DB] Không lấy được thông tin giải đấu: ${err.message}`,
      );
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────
  // SYSTEM PROMPTS
  // ─────────────────────────────────────────────────────────

  private getStaffSystemPrompt(): string {
    return `Bạn là Jarvis — trợ lý AI thông minh dành cho nhân viên và quản lý của AZ Pool Arena.
Nhiệm vụ: Hỗ trợ vận hành, tra cứu thông tin, phân tích dữ liệu và tư vấn nghiệp vụ.

Hướng dẫn:
- Trả lời bằng tiếng Việt, ngắn gọn và chính xác
- Ưu tiên thực tế, không sáng tạo thông tin không có
- Nếu không biết, hãy nói thẳng thay vì đoán mò
- Có thể hỗ trợ: lịch làm việc, doanh thu, tồn kho, giải đấu, khách hàng`;
  }

  private buildCustomerSystemPrompt(dbContext: string): string {
    return `Bạn là trợ lý AI thân thiện của AZ Pool Arena — phòng bida chuyên nghiệp tại Việt Nam.
Nhiệm vụ: Tư vấn và hỗ trợ khách hàng nhiệt tình, chuyên nghiệp.

Dưới đây là thông tin thực tế từ hệ thống (luôn ưu tiên dữ liệu này):

${dbContext || '(Không có dữ liệu cụ thể — hãy hướng dẫn khách liên hệ trực tiếp)'}

Hướng dẫn trả lời:
- Ngôn ngữ: Tiếng Việt, thân thiện, có thể dùng emoji phù hợp 🎱
- Chỉ cung cấp thông tin có trong dữ liệu trên; không tự sáng tạo
- Nếu không có thông tin, gợi ý khách gọi điện hoặc nhắn Facebook
- Giữ câu trả lời súc tích, dễ đọc trên điện thoại
- Luôn niềm nở, tích cực với khách hàng`;
  }

  // ─────────────────────────────────────────────────────────
  // LOGGING & COST ESTIMATION
  // ─────────────────────────────────────────────────────────

  private logUsage(
    context: string,
    usage: OpenAI.CompletionUsage | undefined,
    startTime: number,
  ) {
    this.logUsageWithCache(context, usage, 0, startTime);
  }

  private logUsageWithCache(
    context: string,
    usage: OpenAI.CompletionUsage | undefined,
    cachedTokens: number,
    startTime: number,
  ) {
    const elapsed = Date.now() - startTime;
    const inputTokens = usage?.prompt_tokens ?? 0;
    const outputTokens = usage?.completion_tokens ?? 0;
    const totalTokens = usage?.total_tokens ?? 0;
    const cost = this.estimateCostWithCache(
      inputTokens,
      outputTokens,
      cachedTokens,
    );
    const cacheInfo =
      cachedTokens > 0
        ? ` | Cache HIT: ${cachedTokens} tokens (${Math.round((cachedTokens / inputTokens) * 100)}% cached)`
        : ' | Cache MISS';

    this.logger.log(
      `[${context}] ✓ Xong | Thời gian: ${elapsed}ms | ` +
        `Tokens: ${totalTokens} (in=${inputTokens}, out=${outputTokens})` +
        `${cacheInfo} | Chi phí: $${cost.toFixed(6)}`,
    );
  }

  private estimateCost(inputTokens: number, outputTokens: number): number {
    return this.estimateCostWithCache(inputTokens, outputTokens, 0);
  }

  private estimateCostWithCache(
    inputTokens: number,
    outputTokens: number,
    cachedTokens: number,
  ): number {
    const pricing = PRICING[this.model] ?? PRICING['gpt-4o-mini'];
    const uncachedInput = inputTokens - cachedTokens;
    // Cached tokens giảm 50% chi phí input
    return (
      (uncachedInput / 1000) * pricing.input +
      (cachedTokens / 1000) * (pricing.input * 0.5) +
      (outputTokens / 1000) * pricing.output
    );
  }

  // ─────────────────────────────────────────────────────────
  // PERSISTENCE
  // ─────────────────────────────────────────────────────────

  private async persistConversation(
    sessionId: string,
    userMessage: string,
    assistantReply: string,
    usage: OpenAI.CompletionUsage | undefined,
    type: 'staff' | 'customer',
  ): Promise<void> {
    try {
      await this.conversationRepo.save([
        {
          session_id: sessionId,
          role: 'user',
          content: userMessage,
          model: this.model,
          tokens_used: 0,
          conversation_type: type,
        },
        {
          session_id: sessionId,
          role: 'assistant',
          content: assistantReply,
          model: this.model,
          tokens_used: usage?.total_tokens ?? 0,
          conversation_type: type,
        },
      ]);
    } catch (err) {
      // Không throw — lỗi lưu DB không được làm hỏng response
      this.logger.warn(`[DB] Không lưu được conversation: ${err.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────
  // CACHE
  // ─────────────────────────────────────────────────────────

  private getCached(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache(key: string, data: string): void {
    this.cache.set(key, { data, expires: Date.now() + this.CACHE_TTL_MS });
  }

  // ─────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────

  private getOrCreateHistory(
    sessionId: string,
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, []);
    }
    return this.conversations.get(sessionId)!;
  }

  private handleOpenAIError(error: any): never {
    const status = error?.status;
    const msg = error?.message ?? 'Unknown error';

    this.logger.error(`[OpenAI Error] status=${status} | ${msg}`, error?.stack);

    if (status === 401) {
      throw new HttpException(
        'OPENAI_API_KEY không hợp lệ. Vui lòng kiểm tra lại.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (status === 429) {
      throw new HttpException(
        'OpenAI rate limit. Vui lòng thử lại sau vài giây.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (status === 500 || status === 503) {
      throw new HttpException(
        'OpenAI service tạm thời không khả dụng.',
        HttpStatus.BAD_GATEWAY,
      );
    }
    if (error?.code === 'insufficient_quota') {
      throw new HttpException(
        'OpenAI quota đã hết. Vui lòng nạp thêm credit.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    throw new HttpException(
      'AI service không khả dụng. Vui lòng thử lại.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private getSdkVersion(): string {
    try {
      return require('openai/package.json').version as string;
    } catch {
      return 'unknown';
    }
  }
}

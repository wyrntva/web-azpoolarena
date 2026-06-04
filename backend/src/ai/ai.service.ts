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
  ) {
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }

  onModuleInit() {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');

    if (!apiKey || apiKey.trim() === '') {
      throw new Error(
        '[AiService] OPENAI_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env',
      );
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

  // ─────────────────────────────────────────────────────────
  // PUBLIC METHODS
  // ─────────────────────────────────────────────────────────

  /**
   * Chat thông thường cho nhân viên/quản lý (không có DB context)
   */
  async chat(message: string, sessionId?: string): Promise<ChatResponseDto> {
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
      await this.persistConversation(sid, message, reply, completion.usage, 'staff');

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
    const sid = sessionId || uuidv4();
    const startTime = Date.now();

    this.logger.log(
      `[CHAT:CUSTOMER] Session=${sid} | Question="${message.slice(0, 80)}"`,
    );

    // Bước 1: Phân tích intent từ câu hỏi
    const intents = this.analyzeIntent(message);
    this.logger.log(`[CHAT:CUSTOMER] Intents phát hiện: [${intents.join(', ')}]`);

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
      await this.persistConversation(sid, message, reply, completion.usage, 'customer');

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
  ): Promise<FbAiResponseDto> {
    const startTime = Date.now();
    this.logger.log(`[FB:AI] PSID=${psid} | "${message.slice(0, 80)}"`);

    // Phân tích intent và lấy DB context
    const intents = this.analyzeIntent(message);
    const dbContext = await this.buildDbContext(intents);
    const systemPrompt = this.buildFacebookSystemPrompt(dbContext);

    // Chuyển history sang đúng type OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      // Chỉ gửi 10 tin gần nhất để tiết kiệm token
      ...history.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 600,      // Messenger cần ngắn gọn
        temperature: 0.4,     // Ổn định, ít sáng tạo
      });

      const reply = completion.choices[0]?.message?.content ?? '';
      const usage = completion.usage;
      const inputTokens = usage?.prompt_tokens ?? 0;
      const outputTokens = usage?.completion_tokens ?? 0;
      const cost = this.estimateCost(inputTokens, outputTokens);

      this.logUsage('FB:AI', usage, startTime);

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

  private buildFacebookSystemPrompt(dbContext: string): string {
    return `Bạn là JARVIS — trợ lý AI chính thức của AZ POOLARENA.

Khi khách chào hoặc bắt đầu hội thoại, hãy tự giới thiệu theo mẫu:
"Xin chào bạn, mình là JARVIS trợ lý AI của AZ POOLARENA, mình có thể hỗ trợ gì cho bạn? 🎱"

Quy tắc bắt buộc:
- Xưng "mình", gọi khách là "bạn" — thân thiện, gần gũi
- Ngắn gọn — tối đa 3-4 câu mỗi tin nhắn
- Dùng emoji phù hợp nhưng không quá nhiều
- Chỉ sử dụng thông tin trong phần DỮ LIỆU bên dưới
- KHÔNG tự bịa thông tin, giá, giờ giấc không có trong dữ liệu
- Nếu không có thông tin → đề nghị khách liên hệ trực tiếp với cửa hàng
- Luôn trả lời bằng tiếng Việt

DỮ LIỆU TỪ HỆ THỐNG:
${dbContext || '(Chưa có dữ liệu — hướng dẫn khách liên hệ trực tiếp)'}`;
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
    if (/địa chỉ|address|đường|ở đâu|location|chỗ nào|tìm|quận|phường/.test(lower)) {
      intents.add('location');
    }
    // Liên hệ
    if (/liên hệ|contact|số điện thoại|phone|zalo|hotline|gọi|nhắn/.test(lower)) {
      intents.add('contact');
    }
    // Giải đấu / sự kiện
    if (/giải đấu|tournament|thi đấu|event|cuộc thi|cup|championship|giải/.test(lower)) {
      intents.add('tournament');
    }
    // Dịch vụ
    if (/dịch vụ|service|có gì|menu|thức ăn|uống|tiện ích|wifi|parking/.test(lower)) {
      intents.add('services');
    }
    // Thành viên / rank
    if (/thành viên|member|rank|xếp hạng|điểm|vip|hội viên/.test(lower)) {
      intents.add('membership');
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
      this.logger.debug(`[CACHE HIT] DB context cho intents: ${intents.join(', ')}`);
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

    const context = sections.join('\n\n');
    this.setCache(cacheKey, context);
    return context;
  }

  private async getStoreInfo(): Promise<string | null> {
    try {
      const store = await this.storeSettingsRepo.findOne({ where: {} });
      if (!store) return null;

      const address = [store.address, store.ward, store.district, store.province]
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
        (a) => `- ${a.name}: ${a.table_count} bàn${a.description ? ` (${a.description})` : ''}`,
      );

      return `## Khu vực & Bàn bida\n${lines.join('\n')}`;
    } catch (err) {
      this.logger.warn(`[DB] Không lấy được thông tin bàn: ${err.message}`);
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
    const elapsed = Date.now() - startTime;
    const inputTokens = usage?.prompt_tokens ?? 0;
    const outputTokens = usage?.completion_tokens ?? 0;
    const totalTokens = usage?.total_tokens ?? 0;
    const cost = this.estimateCost(inputTokens, outputTokens);

    this.logger.log(
      `[${context}] ✓ Xong | Thời gian: ${elapsed}ms | ` +
        `Tokens: ${totalTokens} (in=${inputTokens}, out=${outputTokens}) | ` +
        `Chi phí ước tính: $${cost.toFixed(6)}`,
    );
  }

  private estimateCost(inputTokens: number, outputTokens: number): number {
    const pricing = PRICING[this.model] ?? PRICING['gpt-4o-mini'];
    return (
      (inputTokens / 1000) * pricing.input +
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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('openai/package.json').version as string;
    } catch {
      return 'unknown';
    }
  }
}

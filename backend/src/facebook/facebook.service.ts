import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FbCustomerEntity,
  ConversationStatus,
} from './entities/fb-customer.entity';
import { FbMessageEntity, MessageRole, MessageSource } from './entities/fb-message.entity';
import { FbPageEntity } from './entities/fb-page.entity';
import { AiService } from '../ai/ai.service';

// Các từ khoá kích hoạt chuyển sang nhân viên
const HUMAN_HANDOVER_PATTERNS = [
  /gặp nhân viên/i,
  /tư vấn trực tiếp/i,
  /gọi điện/i,
  /khiếu nại/i,
  /phàn nàn/i,
  /gặp người thật/i,
  /nói chuyện với người/i,
  /hỗ trợ trực tiếp/i,
  /quên đồ/i,
  /để quên/i,
  /mất đồ/i,
  /thất lạc/i,
  /rơi đồ/i,
  /tìm đồ/i,
];

const FB_GRAPH_URL = 'https://graph.facebook.com/v22.0';

// Debounce buffer: gom tin nhắn liên tiếp trong 2 giây → xử lý 1 lần
interface DebounceEntry {
  messages: string[];
  timer: ReturnType<typeof setTimeout>;
}

@Injectable()
export class FacebookService implements OnModuleInit {
  private readonly logger = new Logger(FacebookService.name);
  private pageAccessToken: string;

  // Map psid → pending messages + timer
  private readonly debounceMap = new Map<string, DebounceEntry>();
  private readonly DEBOUNCE_MS = 2000; // chờ 2 giây

  constructor(
    private readonly config: ConfigService,
    private readonly aiService: AiService,
    @InjectRepository(FbCustomerEntity)
    private readonly customerRepo: Repository<FbCustomerEntity>,
    @InjectRepository(FbMessageEntity)
    private readonly messageRepo: Repository<FbMessageEntity>,
    @InjectRepository(FbPageEntity)
    private readonly pageRepo: Repository<FbPageEntity>,
  ) {}

  onModuleInit() {
    this.pageAccessToken = this.config.get<string>('FB_PAGE_ACCESS_TOKEN', '');

    if (!this.pageAccessToken) {
      this.logger.warn(
        '[FacebookService] FB_PAGE_ACCESS_TOKEN chưa được cấu hình — không thể gửi tin nhắn',
      );
    } else {
      this.logger.log('[FacebookService] Khởi động thành công');
    }
  }

  // ─────────────────────────────────────────────────────────
  // ENTRY POINTS
  // ─────────────────────────────────────────────────────────

  /**
   * Nhận tin nhắn vào buffer debounce.
   * Nếu khách nhắn nhiều tin liên tiếp trong 2 giây → gom lại xử lý 1 lần.
   */
  async handleIncomingMessage(pageId: string, psid: string, text: string): Promise<void> {
    const existing = this.debounceMap.get(psid);

    if (existing) {
      // Có tin đang chờ — reset timer, thêm tin mới vào buffer
      clearTimeout(existing.timer);
      existing.messages.push(text);
      this.logger.log(`[Debounce] psid=${psid} buffer=${existing.messages.length} msgs`);
    } else {
      // Tin đầu tiên — tạo entry mới
      this.debounceMap.set(psid, { messages: [text], timer: null as any });
    }

    // Set timer mới — sau 2 giây không có tin nào thêm thì xử lý
    const entry = this.debounceMap.get(psid)!;
    entry.timer = setTimeout(() => {
      this.debounceMap.delete(psid);
      const combined = entry.messages.join('\n');
      this.logger.log(`[Debounce] Xử lý psid=${psid} | ${entry.messages.length} tin → "${combined.slice(0, 80)}"`);
      this.processMessage(pageId, psid, combined).catch((err) =>
        this.logger.error(`[FB] Lỗi xử lý message: ${err.message}`, err.stack),
      );
    }, this.DEBOUNCE_MS);
  }

  /**
   * Xử lý tin nhắn sau khi debounce.
   */
  private async processMessage(pageId: string, psid: string, text: string): Promise<void> {
    // 1. Lấy hoặc tạo customer
    const customer = await this.getOrCreateCustomer(pageId, psid);

    // 2. Lưu tin nhắn của khách
    await this.saveMessage(customer.id, MessageRole.USER, text, MessageSource.HUMAN);

    // 3. Kiểm tra handover
    if (this.isHumanHandoverRequest(text)) {
      await this.triggerHumanHandover(pageId, customer, text);
      return;
    }

    // 4. Nếu đang ở chế độ HUMAN_SUPPORT — AI không trả lời
    if (customer.conversation_status === ConversationStatus.HUMAN_SUPPORT) {
      this.logger.log(
        `[FB] PSID=${psid} đang ở chế độ HUMAN_SUPPORT — bỏ qua AI`,
      );
      return;
    }

    // 5. Lấy lịch sử hội thoại gần nhất
    const history = await this.getRecentMessages(pageId, psid, 10);

    // 6. Gọi AI trả lời
    const startTime = Date.now();
    try {
      const { reply, model, tokensUsed, cost } =
        await this.aiService.answerFacebookMessage(psid, text, history);

      const elapsed = Date.now() - startTime;

      // 7. Lưu reply của AI
      await this.saveMessage(
        customer.id,
        MessageRole.ASSISTANT,
        reply,
        MessageSource.AI,
        model,
        tokensUsed,
        cost,
        elapsed,
      );

      // 8. Gửi reply qua Facebook Graph API
      await this.sendTextMessage(pageId, psid, reply);
    } catch (err) {
      this.logger.error(`[FB] Lỗi xử lý AI cho ${psid}: ${err.message}`, err.stack);
      await this.sendTextMessage(
        pageId,
        psid,
        'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.',
      );
    }
  }

  /**
   * Xử lý postback (nút bấm trong Messenger).
   */
  async handlePostback(pageId: string, psid: string, payload: string): Promise<void> {
    this.logger.log(`[FB] Postback: psid=${psid} payload=${payload}`);

    if (payload === 'GET_STARTED') {
      const customer = await this.getOrCreateCustomer(pageId, psid);
      const welcomeMsg =
        `Xin chào! 👋 Tôi là trợ lý AI của AZ Pool Arena.\n` +
        `Tôi có thể giúp bạn:\n` +
        `🎱 Thông tin bàn bida & đặt chỗ\n` +
        `💰 Bảng giá dịch vụ\n` +
        `📍 Địa chỉ & liên hệ\n` +
        `🏆 Thông tin giải đấu\n\n` +
        `Bạn cần hỗ trợ gì ạ?`;

      await this.saveMessage(customer.id, MessageRole.ASSISTANT, welcomeMsg, MessageSource.AI);
      await this.sendTextMessage(pageId, psid, welcomeMsg);
    }
  }

  // ─────────────────────────────────────────────────────────
  // FACEBOOK GRAPH API
  // ─────────────────────────────────────────────────────────

  private async getPageAccessToken(pageId: string): Promise<string> {
    if (pageId && pageId !== 'default') {
      try {
        const page = await this.pageRepo.findOne({ where: { id: pageId, is_active: true } });
        if (page && page.access_token) {
          return page.access_token;
        }
      } catch (err) {
        this.logger.warn(`[FB] Lỗi truy vấn page token cho pageId=${pageId}: ${err.message}`);
      }
    }
    return this.pageAccessToken; // fallback
  }

  async sendTextMessage(pageId: string, psid: string, text: string): Promise<void> {
    const token = await this.getPageAccessToken(pageId);
    if (!token) {
      this.logger.warn(`[FB] Không có PAGE_ACCESS_TOKEN cho pageId=${pageId} — bỏ qua gửi tin nhắn`);
      return;
    }

    const url = new URL(`${FB_GRAPH_URL}/me/messages`);
    url.searchParams.set('access_token', token);

    try {
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: psid },
          message: { text },
          messaging_type: 'RESPONSE',
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const detail = await res.text();
        this.logger.error(`[FB API] HTTP ${res.status} gửi tới ${psid}: ${detail}`);
        throw new Error(`FB API error ${res.status}: ${detail}`);
      }

      this.logger.debug(`[FB] Đã gửi tin nhắn tới ${psid}`);
    } catch (err) {
      this.logger.error(`[FB API] Lỗi gửi tin nhắn tới ${psid}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Lấy thông tin profile của user từ Facebook Graph API.
   */
  async fetchUserProfile(
    pageId: string,
    psid: string,
  ): Promise<{ name: string; profile_pic: string } | null> {
    const token = await this.getPageAccessToken(pageId);
    if (!token) return null;

    try {
      const url = new URL(`${FB_GRAPH_URL}/${psid}`);
      url.searchParams.set('fields', 'name,profile_pic');
      url.searchParams.set('access_token', token);

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) return null;
      return res.json() as Promise<{ name: string; profile_pic: string }>;
    } catch {
      return null; // Profile không bắt buộc
    }
  }

  // ─────────────────────────────────────────────────────────
  // HUMAN HANDOVER
  // ─────────────────────────────────────────────────────────

  private isHumanHandoverRequest(text: string): boolean {
    return HUMAN_HANDOVER_PATTERNS.some((pattern) => pattern.test(text));
  }

  private async triggerHumanHandover(
    pageId: string,
    customer: FbCustomerEntity,
    triggerMessage: string,
  ): Promise<void> {
    this.logger.log(
      `[HANDOVER] PSID=${customer.psid} yêu cầu nhân viên — trigger: "${triggerMessage.slice(0, 50)}"`,
    );

    // Cập nhật trạng thái
    await this.customerRepo.update(customer.id, {
      conversation_status: ConversationStatus.HUMAN_SUPPORT,
    });

    // Thông báo khách
    let msg =
      `Cảm ơn bạn đã liên hệ! 🙏\n` +
      `Chúng tôi đã ghi nhận yêu cầu của bạn và sẽ có nhân viên hỗ trợ trong thời gian sớm nhất.\n\n` +
      `📞 Hoặc gọi hotline: ${await this.getStorePhone()}\n` +
      `⏰ Giờ làm việc: 8:00 - 23:00 hàng ngày`;

    if (/quên|mất|thất lạc|rơi/i.test(triggerMessage)) {
      msg =
        `Chào bạn! Mình đã ghi nhận thông tin về việc quên/thất lạc đồ tại quán.\n` +
        `Mình đã báo lại với nhân viên ca trực để kiểm tra tủ đồ thất lạc và trích xuất camera giúp bạn rồi nhé.\n\n` +
        `Nhân viên sẽ phản hồi lại bạn sớm nhất qua chat này hoặc bạn có thể gọi hotline để được hỗ trợ nhanh nhất:\n` +
        `📞 Hotline: ${await this.getStorePhone()}`;
    }

    await this.saveMessage(customer.id, MessageRole.ASSISTANT, msg, MessageSource.HUMAN);
    await this.sendTextMessage(pageId, customer.psid, msg);

    // Log để nhân viên theo dõi (có thể tích hợp MQTT/email sau)
    this.logger.warn(
      `[HANDOVER] ⚠️ Khách ${customer.psid} (${customer.name ?? 'Ẩn danh'}) cần hỗ trợ nhân viên`,
    );
  }

  // ─────────────────────────────────────────────────────────
  // DATABASE HELPERS
  // ─────────────────────────────────────────────────────────

  private async getOrCreateCustomer(pageId: string, psid: string): Promise<FbCustomerEntity> {
    let customer = await this.customerRepo.findOne({ where: { psid, page_id: pageId } });

    if (!customer) {
      // Lần đầu gặp — lấy profile từ Facebook
      const profile = await this.fetchUserProfile(pageId, psid);

      customer = this.customerRepo.create({
        psid,
        page_id: pageId,
        name: profile?.name ?? undefined,
        profile_pic: profile?.profile_pic ?? undefined,
        conversation_status: ConversationStatus.ACTIVE,
      });
      await this.customerRepo.save(customer);

      this.logger.log(`[FB] Customer mới: psid=${psid} name="${profile?.name ?? '?'}"`);
    }

    return customer;
  }

  private async saveMessage(
    customerId: number,
    role: MessageRole,
    content: string,
    source: MessageSource,
    model?: string,
    tokensUsed = 0,
    estimatedCost = 0,
    responseTimeMs = 0,
  ): Promise<void> {
    try {
      const msg = this.messageRepo.create({
        customer_id: customerId,
        role,
        content,
        source,
        model: model ?? undefined,
        tokens_used: tokensUsed,
        estimated_cost: estimatedCost,
        response_time_ms: responseTimeMs,
      });
      await this.messageRepo.save(msg);
    } catch (err) {
      this.logger.warn(`[DB] Không lưu được message: ${err.message}`);
    }
  }

  /**
   * Lấy lịch sử hội thoại gần nhất của khách (để truyền vào AI).
   * Chỉ lấy N tin nhắn gần nhất để tiết kiệm token.
   */
  async getRecentMessages(
    pageId: string,
    psid: string,
    limit = 10,
  ): Promise<Array<{ role: string; content: string }>> {
    const customer = await this.customerRepo.findOne({ where: { psid, page_id: pageId } });
    if (!customer) return [];

    const messages = await this.messageRepo.find({
      where: { customer_id: customer.id },
      order: { created_at: 'DESC' },
      take: limit,
      select: ['role', 'content'],
    });

    // Đảo ngược để thứ tự đúng (cũ → mới)
    return messages.reverse().map((m) => ({ role: m.role, content: m.content }));
  }

  private async getStorePhone(): Promise<string> {
    // Giá trị fallback — AiService/StoreSettings sẽ cung cấp thực tế
    return this.config.get<string>('STORE_PHONE', '0xxxxxxxxx');
  }
}

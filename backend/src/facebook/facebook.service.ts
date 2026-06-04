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
];

const FB_GRAPH_URL = 'https://graph.facebook.com/v22.0';

@Injectable()
export class FacebookService implements OnModuleInit {
  private readonly logger = new Logger(FacebookService.name);
  private pageAccessToken: string;

  constructor(
    private readonly config: ConfigService,
    private readonly aiService: AiService,
    @InjectRepository(FbCustomerEntity)
    private readonly customerRepo: Repository<FbCustomerEntity>,
    @InjectRepository(FbMessageEntity)
    private readonly messageRepo: Repository<FbMessageEntity>,
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
   * Xử lý tin nhắn văn bản đến từ khách hàng.
   */
  async handleIncomingMessage(psid: string, text: string): Promise<void> {
    // 1. Lấy hoặc tạo customer
    const customer = await this.getOrCreateCustomer(psid);

    // 2. Lưu tin nhắn của khách
    await this.saveMessage(customer.id, MessageRole.USER, text, MessageSource.HUMAN);

    // 3. Kiểm tra handover
    if (this.isHumanHandoverRequest(text)) {
      await this.triggerHumanHandover(customer, text);
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
    const history = await this.getRecentMessages(psid, 10);

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
      await this.sendTextMessage(psid, reply);
    } catch (err) {
      this.logger.error(`[FB] Lỗi xử lý AI cho ${psid}: ${err.message}`, err.stack);
      await this.sendTextMessage(
        psid,
        'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.',
      );
    }
  }

  /**
   * Xử lý postback (nút bấm trong Messenger).
   */
  async handlePostback(psid: string, payload: string): Promise<void> {
    this.logger.log(`[FB] Postback: psid=${psid} payload=${payload}`);

    if (payload === 'GET_STARTED') {
      const customer = await this.getOrCreateCustomer(psid);
      const welcomeMsg =
        `Xin chào! 👋 Tôi là trợ lý AI của AZ Pool Arena.\n` +
        `Tôi có thể giúp bạn:\n` +
        `🎱 Thông tin bàn bida & đặt chỗ\n` +
        `💰 Bảng giá dịch vụ\n` +
        `📍 Địa chỉ & liên hệ\n` +
        `🏆 Thông tin giải đấu\n\n` +
        `Bạn cần hỗ trợ gì ạ?`;

      await this.saveMessage(customer.id, MessageRole.ASSISTANT, welcomeMsg, MessageSource.AI);
      await this.sendTextMessage(psid, welcomeMsg);
    }
  }

  // ─────────────────────────────────────────────────────────
  // FACEBOOK GRAPH API
  // ─────────────────────────────────────────────────────────

  async sendTextMessage(psid: string, text: string): Promise<void> {
    if (!this.pageAccessToken) {
      this.logger.warn(`[FB] Không có PAGE_ACCESS_TOKEN — bỏ qua gửi tin nhắn`);
      return;
    }

    const url = new URL(`${FB_GRAPH_URL}/me/messages`);
    url.searchParams.set('access_token', this.pageAccessToken);

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
    psid: string,
  ): Promise<{ name: string; profile_pic: string } | null> {
    if (!this.pageAccessToken) return null;

    try {
      const url = new URL(`${FB_GRAPH_URL}/${psid}`);
      url.searchParams.set('fields', 'name,profile_pic');
      url.searchParams.set('access_token', this.pageAccessToken);

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
    const msg =
      `Cảm ơn bạn đã liên hệ! 🙏\n` +
      `Chúng tôi đã ghi nhận yêu cầu của bạn và sẽ có nhân viên hỗ trợ trong thời gian sớm nhất.\n\n` +
      `📞 Hoặc gọi hotline: ${await this.getStorePhone()}\n` +
      `⏰ Giờ làm việc: 8:00 - 23:00 hàng ngày`;

    await this.saveMessage(customer.id, MessageRole.ASSISTANT, msg, MessageSource.HUMAN);
    await this.sendTextMessage(customer.psid, msg);

    // Log để nhân viên theo dõi (có thể tích hợp MQTT/email sau)
    this.logger.warn(
      `[HANDOVER] ⚠️ Khách ${customer.psid} (${customer.name ?? 'Ẩn danh'}) cần hỗ trợ nhân viên`,
    );
  }

  // ─────────────────────────────────────────────────────────
  // DATABASE HELPERS
  // ─────────────────────────────────────────────────────────

  private async getOrCreateCustomer(psid: string): Promise<FbCustomerEntity> {
    let customer = await this.customerRepo.findOne({ where: { psid } });

    if (!customer) {
      // Lần đầu gặp — lấy profile từ Facebook
      const profile = await this.fetchUserProfile(psid);

      customer = this.customerRepo.create({
        psid,
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
    psid: string,
    limit = 10,
  ): Promise<Array<{ role: string; content: string }>> {
    const customer = await this.customerRepo.findOne({ where: { psid } });
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

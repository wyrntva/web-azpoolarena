import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { FacebookService } from './facebook.service';
import { FbWebhookPayloadDto, FbMessagingDto } from './dto/webhook.dto';

@Controller('facebook')
export class FacebookController {
  private readonly logger = new Logger(FacebookController.name);

  constructor(
    private readonly facebookService: FacebookService,
    private readonly config: ConfigService,
  ) {}

  /**
   * GET /facebook/webhook
   * Facebook gọi endpoint này để xác thực webhook khi setup.
   * Phải trả về hub.challenge nếu hub.verify_token khớp.
   */
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    this.logger.log(`[FB Webhook Verify] mode=${mode} token=${token}`);

    const verifyToken = this.config.get<string>('FB_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('[FB Webhook Verify] Xác thực thành công');
      return res.status(200).send(challenge);
    }

    this.logger.warn('[FB Webhook Verify] Xác thực THẤT BẠI — token không khớp');
    return res.status(403).send('Forbidden');
  }

  /**
   * POST /facebook/webhook
   * Facebook gửi các event tin nhắn tới đây.
   * Phải respond 200 ngay lập tức — xử lý async.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    this.logger.log(`[FB Webhook POST] object="${payload?.object}" entries=${payload?.entry?.length ?? 0}`);

    if (payload?.object !== 'page') {
      this.logger.warn(`[FB Webhook POST] Bỏ qua — object="${payload?.object}" | body=${JSON.stringify(payload).slice(0, 200)}`);
      return 'ignored';
    }

    // Xử lý bất đồng bộ — không await để tránh timeout
    this.processMessagingEvents(payload as FbWebhookPayloadDto).catch((err) =>
      this.logger.error(`[FB Webhook] Lỗi xử lý event: ${err.message}`, err.stack),
    );

    return 'EVENT_RECEIVED';
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE
  // ─────────────────────────────────────────────────────────

  private async processMessagingEvents(payload: FbWebhookPayloadDto) {
    for (const entry of payload.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        await this.processOneEvent(event);
      }
    }
  }

  private async processOneEvent(event: FbMessagingDto) {
    const psid = event.sender?.id;
    // Log toàn bộ event để debug
    this.logger.log(`[FB Event] psid=${psid} keys=${Object.keys(event).join(',')} msg=${JSON.stringify(event.message)?.slice(0, 120)}`);

    if (!psid) return;

    // Bỏ qua echo (tin nhắn do page gửi đi)
    if ((event.message as any)?.is_echo) {
      this.logger.log(`[FB Event] Bỏ qua echo từ page`);
      return;
    }

    const text = event.message?.text;

    if (text) {
      this.logger.log(`[FB] Tin nhắn từ ${psid}: "${text.slice(0, 80)}"`);
      await this.facebookService.handleIncomingMessage(psid, text);
    } else if (event.postback) {
      this.logger.log(`[FB] Postback từ ${psid}: ${event.postback.payload}`);
      await this.facebookService.handlePostback(psid, event.postback.payload);
    }
  }
}

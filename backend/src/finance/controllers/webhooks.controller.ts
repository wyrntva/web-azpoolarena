import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UnauthorizedException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { TournamentsService } from '../../tournaments/services/tournaments.service';
import { CassoWebhookPayloadDto } from '../dto/casso-webhook.dto';

@Controller('api/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly tournamentsService: TournamentsService,
  ) {}

  @Post('casso')
  @HttpCode(HttpStatus.OK)
  async handleCassoWebhook(
    @Headers() headers: Record<string, string>,
    @Body() payload: CassoWebhookPayloadDto,
    @Req() req: Record<string, any>,
  ) {
    const secureToken = this.configService.get<string>('CASSO_SECURE_TOKEN');
    const isDev = this.configService.get<string>('ENV') !== 'production';

    // Casso Webhook V2 dùng HMAC-SHA256 signature qua header x-casso-signature
    const cassoSignature = headers['x-casso-signature'];
    let isValid = false;

    if (cassoSignature && secureToken) {
      // Parse t=<timestamp>,v1=<signature>
      const parts: Record<string, string> = {};
      cassoSignature.split(',').forEach((part) => {
        const idx = part.indexOf('=');
        if (idx > 0) parts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
      });
      const timestamp = parts['t'];
      const v1 = parts['v1'];

      if (timestamp && v1) {
        const rawBody: string = req.rawBody
          ? req.rawBody.toString('utf8')
          : JSON.stringify(payload);
        const signedPayload = `${timestamp}.${rawBody}`;

        const sha256sig = crypto.createHmac('sha256', secureToken).update(signedPayload).digest('hex');
        const sha512sig = crypto.createHmac('sha512', secureToken).update(signedPayload).digest('hex');

        isValid = sha256sig === v1 || sha512sig === v1;

        this.logger.debug(`[Webhook] rawBody available: ${!!req.rawBody}`);
        this.logger.debug(`[Webhook] rawBody: ${rawBody.substring(0, 100)}`);
        this.logger.debug(`[Webhook] v1 from Casso (len=${v1.length}): ${v1.substring(0, 32)}...`);
        this.logger.debug(`[Webhook] sha256 (len=${sha256sig.length}): ${sha256sig.substring(0, 32)}...`);
        this.logger.debug(`[Webhook] sha512 (len=${sha512sig.length}): ${sha512sig.substring(0, 32)}...`);
        this.logger.debug(`[Webhook] match: ${isValid}`);
      }
    }

    if (!isValid) {
      if (isDev) {
        this.logger.warn(`[DEV BYPASS] Casso signature check failed. Bypassing.`);
      } else {
        this.logger.warn(
          `Unauthorized webhook: invalid Casso signature. Headers: ${JSON.stringify(headers)}`,
        );
        throw new UnauthorizedException('Invalid secure token');
      }
    }

    this.logger.log(`Received Casso webhook with ${payload.data?.length || 0} transactions.`);

    // 2. Process transactions list
    if (payload.data && Array.isArray(payload.data)) {
      for (const tx of payload.data) {
        const description = (tx.description || '').toUpperCase();
        const match = description.match(/POOLARENA[A-Z0-9]{10}/);

        if (match) {
          const code = match[0];
          this.logger.log(
            `Found matching transaction. Code: ${code}, TxID: ${tx.tid}, Amount: ${tx.amount}`,
          );

          try {
            await this.tournamentsService.redeemPaymentCode(code, tx.amount);
            this.logger.log(`Successfully redeemed code ${code} via Webhook.`);
          } catch (error) {
            this.logger.error(
              `Failed to redeem code ${code} for TxID ${tx.tid}: ${error.message}`,
              error.stack,
            );
          }
        } else {
          this.logger.debug(`Transaction ignored (non-matching description): "${tx.description}"`);
        }
      }
    }

    // 3. Casso expects 200 OK response with success=true to confirm processing
    return { success: true };
  }
}

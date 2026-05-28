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

  private sortKeysDeep(obj: any): any {
    if (Array.isArray(obj)) return obj.map((i) => this.sortKeysDeep(i));
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).sort().reduce((acc, k) => ({ ...acc, [k]: this.sortKeysDeep(obj[k]) }), {});
    }
    return obj;
  }

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
        // Casso Webhook V2: sort all keys alphabetically before computing HMAC-SHA512
        const sortedPayload = this.sortKeysDeep(payload);
        const sortedJson = JSON.stringify(sortedPayload);
        const signedPayload = `${timestamp}.${sortedJson}`;

        const sha512sig = crypto.createHmac('sha512', secureToken).update(signedPayload).digest('hex');
        isValid = sha512sig === v1;
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

    this.logger.log(`Received Casso webhook payload: ${JSON.stringify(payload)}`);

    // Casso có thể gửi data dạng array hoặc single object
    const transactions = Array.isArray(payload.data)
      ? payload.data
      : payload.data ? [payload.data] : [];

    this.logger.log(`Processing ${transactions.length} transactions.`);

    if (transactions.length > 0) {
      for (const tx of transactions) {
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
          this.logger.log(`Transaction ignored (non-matching description): "${tx.description}"`);
        }
      }
    }

    // 3. Casso expects 200 OK response with success=true to confirm processing
    return { success: true };
  }
}

import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  ) {
    const expectedToken = this.configService.get<string>('CASSO_SECURE_TOKEN');
    const isDev = this.configService.get<string>('ENV') !== 'production';

    // Case-insensitive lookup for the secure token header
    const secureToken =
      headers['secure-token'] ||
      headers['Secure-Token'] ||
      headers['secure_token'] ||
      headers['Secure_token'];

    // 1. Verify Casso secure token from header (with development bypass)
    if (!expectedToken || secureToken !== expectedToken) {
      if (isDev) {
        this.logger.warn(
          `[DEVELOPMENT BYPASS] Webhook secure token check failed. Expected "${expectedToken}", got "${secureToken}". Bypassing because ENV is "development".`,
        );
      } else {
        this.logger.warn(
          `Unauthorized webhook access attempt: expected "${expectedToken}", got "${secureToken}". Incoming headers: ${JSON.stringify(headers)}`,
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

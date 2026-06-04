import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AiService } from './ai.service';
import {
  ChatDto,
  CustomerQuestionDto,
  ClearHistoryDto,
  ChatResponseDto,
} from './dto/chat.dto';

@Controller('api/ai')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * POST /api/ai/chat
   * Chat dành cho nhân viên/quản lý
   *
   * Body: { message: string, session_id?: string }
   * Response: { reply, session_id, model }
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatDto): Promise<ChatResponseDto> {
    this.logger.log(
      `[POST /api/ai/chat] session=${dto.session_id ?? 'new'} | "${dto.message.slice(0, 60)}"`,
    );
    return this.aiService.chat(dto.message, dto.session_id);
  }

  /**
   * POST /api/ai/customer
   * Trả lời câu hỏi khách hàng với dữ liệu thực tế từ DB
   *
   * Body: { message: string, session_id?: string }
   * Response: { reply, session_id, model }
   */
  @Post('customer')
  @HttpCode(HttpStatus.OK)
  async customerQuestion(
    @Body() dto: CustomerQuestionDto,
  ): Promise<ChatResponseDto> {
    this.logger.log(
      `[POST /api/ai/customer] session=${dto.session_id ?? 'new'} | "${dto.message.slice(0, 60)}"`,
    );
    return this.aiService.answerCustomerQuestion(dto.message, dto.session_id);
  }

  /**
   * DELETE /api/ai/history/:sessionId
   * Xóa lịch sử hội thoại của một session
   */
  @Delete('history/:sessionId')
  @HttpCode(HttpStatus.OK)
  clearHistory(
    @Param('sessionId') sessionId: string,
  ): { cleared: boolean; session_id: string } {
    this.logger.log(`[DELETE /api/ai/history/${sessionId}]`);
    return this.aiService.clearHistory(sessionId);
  }
}

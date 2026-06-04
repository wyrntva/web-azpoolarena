import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChatDto {
  @IsString()
  @IsNotEmpty({ message: 'Tin nhắn không được để trống' })
  @MinLength(1)
  @MaxLength(2000, { message: 'Tin nhắn không được vượt quá 2000 ký tự' })
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  session_id?: string;
}

export class CustomerQuestionDto extends ChatDto {}

export class ClearHistoryDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;
}

export class ChatResponseDto {
  reply: string;
  session_id: string;
  model: string;
}

export class FbAiResponseDto {
  reply: string;
  model: string;
  tokensUsed: number;
  cost: number;
}

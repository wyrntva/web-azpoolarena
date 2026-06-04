// Facebook Webhook Event DTOs
// Docs: https://developers.facebook.com/docs/messenger-platform/webhooks

export class FbSenderDto {
  id: string; // PSID
}

export class FbMessageDto {
  mid: string;
  text?: string;
  attachments?: Array<{ type: string; payload: any }>;
}

export class FbMessagingDto {
  sender: FbSenderDto;
  recipient: FbSenderDto;
  timestamp: number;
  message?: FbMessageDto;
  postback?: { title: string; payload: string };
}

export class FbEntryDto {
  id: string;
  time: number;
  messaging: FbMessagingDto[];
}

export class FbWebhookPayloadDto {
  object: string; // 'page'
  entry: FbEntryDto[];
}

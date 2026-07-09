import type { Member, MemberHistoryItem, NotificationItem } from "./member";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface AuthPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload extends AuthPayload {
  name: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  member: Member;
  tokens: SessionTokens;
  history: MemberHistoryItem[];
  notifications: NotificationItem[];
}

export interface AuthResponse {
  success: boolean;
  data: SessionTokens & {
    member: Member;
  };
}

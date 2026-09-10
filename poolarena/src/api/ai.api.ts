import api from '@/config/axios';

export interface ChatResponse {
  reply: string;
  session_id: string;
  model?: string;
}

export const aiAPI = {
  askCustomer: (message: string, sessionId?: string) =>
    api.post<ChatResponse>('/api/ai/customer', { message, session_id: sessionId }),
  clearHistory: (sessionId: string) =>
    api.delete(`/api/ai/history/${sessionId}`),
};

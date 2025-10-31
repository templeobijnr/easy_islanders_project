import { http } from '../../../api';

export interface ChatRequest {
  message: string;
  thread_id?: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  thread_id: string;
  language?: string;
  recommendations?: Recommendation[];
  conversation_id?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  image?: string;
}

export const postChat = async (request: ChatRequest): Promise<ChatResponse> => {
  const response = await http.post('/api/chat/', request);
  return response.data;
};
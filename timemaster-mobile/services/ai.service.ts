import { aiApi } from './api.service';
import { ENDPOINTS } from '../constants/api';

export interface MentorResponse {
  message: string;
  actionTaken: string;
}

class AiService {
  async chat(message: string): Promise<MentorResponse> {
    const response = await aiApi.post(ENDPOINTS.AI.CHAT, { message });
    return response.data;
  }
}

export const aiService = new AiService();

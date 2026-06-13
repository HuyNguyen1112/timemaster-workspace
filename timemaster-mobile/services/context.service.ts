import { coreApi } from './api.service';
import { ENDPOINTS } from '../constants/api';

export interface Schedule {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Context {
  id: number;
  name: string;
  colorCode: string;
  iconName?: string;
  isActive: boolean;
  schedules: Schedule[];
}

class ContextService {
  async getContexts(): Promise<Context[]> {
    const response = await coreApi.get(ENDPOINTS.CONTEXTS.BASE);
    return response.data;
  }

  async createContext(data: Partial<Context>): Promise<Context> {
    const response = await coreApi.post(ENDPOINTS.CONTEXTS.BASE, data);
    return response.data;
  }

  async updateContext(id: number, data: Partial<Context>): Promise<Context> {
    const response = await coreApi.put(ENDPOINTS.CONTEXTS.BASE + `/${id}`, data);
    return response.data;
  }

  async deleteContext(id: number): Promise<void> {
    await coreApi.delete(ENDPOINTS.CONTEXTS.BASE + `/${id}`);
  }
}

export const contextService = new ContextService();

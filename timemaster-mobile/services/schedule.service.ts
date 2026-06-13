import { coreApi } from './api.service';
import { ENDPOINTS } from '../constants/api';

export interface TimeBlock {
  id: number;
  taskId: number;
  taskTitle: string;
  matrixType: string;
  contextName: string;
  startTime: string; // ISO String or "HH:mm:ss"
  endTime: string;
  isLocked: boolean;
}

class ScheduleService {
  async getSchedule(date: string): Promise<TimeBlock[]> {
    const response = await coreApi.get(ENDPOINTS.SCHEDULE.BASE, {
      params: { date }
    });
    return response.data;
  }

  async lockTimeBlock(blockId: number, locked: boolean): Promise<void> {
    await coreApi.put(ENDPOINTS.SCHEDULE.LOCK_BLOCK(blockId), null, {
      params: { locked }
    });
  }

  async recalculateSchedule(date: string, contextId?: number): Promise<void> {
    const params: any = { date };
    if (contextId) params.contextId = contextId;
    await coreApi.post(ENDPOINTS.SCHEDULE.RECALCULATE, null, { params });
  }
}

export const scheduleService = new ScheduleService();

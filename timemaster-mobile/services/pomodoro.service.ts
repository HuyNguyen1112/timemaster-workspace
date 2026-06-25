import { coreApi } from './api.service';
import { ENDPOINTS } from '../constants/api';

export interface PomodoroRequest {
  taskId?: number;
  habitId?: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'COMPLETED' | 'INTERRUPTED';
}

export interface DailyFocusTime {
  date: string;
  minutes: number;
}

export interface PomodoroDashboardResponse {
  totalSessionsCompleted: number;
  totalFocusTimeMinutes: number;
  todayFocusTimeMinutes: number;
  abandonedSessions: number;
  focusTimeLast7Days: DailyFocusTime[];
  comparisonWithLastWeek: string;
  focusTimeByContext: Record<string, number>;
  currentStreak: number;
}

class PomodoroService {
  async saveSession(payload: PomodoroRequest): Promise<any> {
    const response = await coreApi.post('/api/pomodoros', payload);
    return response.data;
  }

  async getDashboard(): Promise<PomodoroDashboardResponse> {
    const response = await coreApi.get('/api/pomodoros/dashboard');
    return response.data;
  }
}

export const pomodoroService = new PomodoroService();

class FocusTargetService {
    pendingTarget: any = null;

    setTarget(target: any) {
        this.pendingTarget = target;
    }

    consumeTarget() {
        const target = this.pendingTarget;
        this.pendingTarget = null;
        return target;
    }
}

export const focusTargetService = new FocusTargetService();

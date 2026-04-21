import { coreApi } from './api.service';
import { ENDPOINTS } from '../constants/api';

export interface Habit {
  id: number;
  userId: number;
  name: string;
  description?: string;
  icon?: string;
  dailyGoal: number;
  unit?: string;
  frequency: string;
  createdAt: string;
  currentStreak: number;
  completedToday: boolean;
  colorCode?: string;
  recentLogs?: any[];
  verificationSource?: string;
  isSystemHabit?: boolean;
  progressToday?: number;
}

export interface HabitCheckInRequest {
  logDate?: string;
  progressValue?: number;
  completed?: boolean;
  isIncrement?: boolean;
}

class HabitService {
  async getHabits(userId: number): Promise<Habit[]> {
    const response = await coreApi.get(`${ENDPOINTS.HABITS.BASE}`, {
      headers: { userId: userId.toString() }
    });
    return response.data;
  }

  async getHabitById(userId: number, habitId: number): Promise<Habit> {
    const response = await coreApi.get(`${ENDPOINTS.HABITS.BASE}/${habitId}`, {
      headers: { userId: userId.toString() }
    });
    return response.data;
  }

  async getHabitsByDate(userId: number, date: string): Promise<any[]> {
    const response = await coreApi.get(`${ENDPOINTS.HABITS.BY_DATE}?date=${date}`, {
      headers: { userId: userId.toString() }
    });
    return response.data;
  }

  async createHabit(userId: number, habitData: any): Promise<Habit> {
    const response = await coreApi.post(`${ENDPOINTS.HABITS.BASE}`, habitData, {
      headers: { userId: userId.toString() }
    });
    return response.data;
  }

  async deleteHabit(userId: number, habitId: number): Promise<void> {
    await coreApi.delete(`${ENDPOINTS.HABITS.BASE}/${habitId}`, {
      headers: { userId: userId.toString() }
    });
  }

  async checkIn(userId: number, habitId: number, checkInData: HabitCheckInRequest): Promise<Habit> {
    const response = await coreApi.post(`${ENDPOINTS.HABITS.BASE}/${habitId}/checkin`, checkInData, {
      headers: { userId: userId.toString() }
    });
    return response.data;
  }
}

export const habitService = new HabitService();

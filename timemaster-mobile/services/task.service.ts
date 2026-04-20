import { coreApi } from './api.service';
import { ENDPOINTS } from '../constants/api';

export interface Task {
  id: number;
  title: string;
  description?: string;
  targetDate: string;
  startTime: string;
  estimatedDuration: number;
  matrixType: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  categoryName?: string;
  userId: number;
  categoryId?: number;
}

class TaskService {
  async getTasks(userId: number): Promise<Task[]> {
    const response = await coreApi.get(`${ENDPOINTS.TASKS.BASE}?userId=${userId}`);
    return response.data;
  }

  async getTasksByDate(userId: number, date: string): Promise<Task[]> {
    const response = await coreApi.get(`${ENDPOINTS.TASKS.BY_DATE}?userId=${userId}&targetDate=${date}`);
    return response.data;
  }

  async createTask(userId: number, taskData: Partial<Task>): Promise<Task> {
    const response = await coreApi.post(`${ENDPOINTS.TASKS.BASE}?userId=${userId}`, taskData);
    return response.data;
  }

  async updateTask(userId: number, taskId: number, taskData: Partial<Task>): Promise<Task> {
    const response = await coreApi.put(`${ENDPOINTS.TASKS.BASE}/${taskId}?userId=${userId}`, taskData);
    return response.data;
  }

  async deleteTask(userId: number, taskId: number): Promise<void> {
    await coreApi.delete(`${ENDPOINTS.TASKS.BASE}/${taskId}?userId=${userId}`);
  }

  async completeTask(userId: number, taskId: number): Promise<Task> {
    // Backend: PUT /api/tasks/{taskId}/complete?userId=1
    const response = await coreApi.put(`${ENDPOINTS.TASKS.BASE}/${taskId}/complete?userId=${userId}`);
    return response.data;
  }
}

export const taskService = new TaskService();

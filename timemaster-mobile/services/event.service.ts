import { coreApi } from './api.service';
import { ENDPOINTS } from '../constants/api';

export interface Event {
  id: number;
  title: string;
  startTime: string; // ISO string e.g. "2026-06-08T09:00:00"
  endTime: string;
  userId: number;
  contextId?: number;
  contextName?: string;
}

export interface EventRequest {
  title: string;
  startTime: string;
  endTime: string;
  contextId?: number;
}

class EventService {
  async getEventsByDate(date: string): Promise<Event[]> {
    const response = await coreApi.get(ENDPOINTS.EVENTS.BASE, {
      params: { date }
    });
    return response.data;
  }

  async createEvent(data: EventRequest): Promise<Event> {
    const response = await coreApi.post(ENDPOINTS.EVENTS.BASE, data);
    return response.data;
  }

  async updateEvent(id: number, data: EventRequest): Promise<Event> {
    const response = await coreApi.put(ENDPOINTS.EVENTS.BASE + `/${id}`, data);
    return response.data;
  }

  async deleteEvent(id: number): Promise<void> {
    await coreApi.delete(ENDPOINTS.EVENTS.BASE + `/${id}`);
  }
}

export const eventService = new EventService();

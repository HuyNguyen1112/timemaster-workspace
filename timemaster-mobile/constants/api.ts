/**
 * API Configuration for TimeMaster
 * 
 * Since we are using a physical Android device, we use the local machine IP.
 * Update this to 10.0.2.2 if switching to Android Emulator.
 */
const LOCAL_IP = '192.168.1.2';

export const API_BASE_URL = {
  CORE: `http://${LOCAL_IP}:8080`,
  AI: `http://${LOCAL_IP}:8082`,
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
  USERS: {
    ME: '/api/users/me',
    PASSWORD: '/api/users/me/password',
  },
  TASKS: {
    BASE: '/api/tasks',
    BY_DATE: '/api/tasks/by-date',
    OVERDUE: '/api/tasks/overdue',
    COMPLETE: (id: number) => `/api/tasks/${id}/complete`,
    CANCEL: (id: number) => `/api/tasks/${id}/cancel`,
  },
  EVENTS: {
    BASE: '/api/events',
  },
  SCHEDULE: {
    BASE: '/api/schedule',
    RECALCULATE: '/api/schedule/recalculate',
    LOCK_BLOCK: (id: number) => `/api/schedule/time-blocks/${id}/lock`,
  },
  CONTEXTS: {
    BASE: '/api/contexts',
  },
  HABITS: {
    BASE: '/api/habits',
    BY_DATE: '/api/habits/by-date',
  },
  AI: {
    CHAT: '/api/ai/chat',
  },
};

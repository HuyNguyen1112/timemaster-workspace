/**
 * API Configuration for TimeMaster
 * 
 * Since we are using a physical Android device, we use the local machine IP.
 * Update this to 10.0.2.2 if switching to Android Emulator.
 */
const LOCAL_IP = '10.0.2.2';

export const API_BASE_URL = {
  CORE: `http://${LOCAL_IP}:8080`,
  AI: `http://${LOCAL_IP}:8082`,
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
  TASKS: {
    BASE: '/api/tasks',
    BY_DATE: '/api/tasks/by-date',
  },
  AI: {
    CHAT: '/api/ai/chat',
  },
  CATEGORIES: {
    BASE: '/api/categories',
  },
  HABITS: {
    BASE: '/api/habits',
    BY_DATE: '/api/habits/by-date',
  },
};

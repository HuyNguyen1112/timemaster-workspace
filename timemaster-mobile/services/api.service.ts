import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

// Create internal Axios instance for Core
export const coreApi = axios.create({
  baseURL: API_BASE_URL.CORE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create internal Axios instance for AI
export const aiApi = axios.create({
  baseURL: API_BASE_URL.AI,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to every request
const addAuthToken = async (config: any) => {
  try {
    const token = await SecureStore.getItemAsync('user_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token from storage', error);
  }
  return config;
};

coreApi.interceptors.request.use(addAuthToken);
aiApi.interceptors.request.use(addAuthToken);

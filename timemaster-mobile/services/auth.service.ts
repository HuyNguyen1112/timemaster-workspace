import * as SecureStore from 'expo-secure-store';
import { coreApi } from './api.service';
import { ENDPOINTS } from '../constants/api';

export interface UserData {
  token: string;
  userId: number;
  email: string;
  fullName: string;
}

class AuthService {
  async login(email: string, passwordHash: string): Promise<UserData> {
    const response = await coreApi.post(ENDPOINTS.AUTH.LOGIN, {
      email,
      password: passwordHash, // Backend expects 'password' in LoginRequest
    });

    const userData: UserData = response.data;
    await SecureStore.setItemAsync('user_token', userData.token);
    await SecureStore.setItemAsync('user_info', JSON.stringify(userData));
    return userData;
  }

  async register(fullName: string, email: string, passwordHash: string): Promise<UserData> {
    const response = await coreApi.post(ENDPOINTS.AUTH.REGISTER, {
      fullName,
      email,
      password: passwordHash,
    });

    const userData: UserData = response.data;
    await SecureStore.setItemAsync('user_token', userData.token);
    await SecureStore.setItemAsync('user_info', JSON.stringify(userData));
    return userData;
  }

  async logout() {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_info');
  }

  async getUserInfo(): Promise<UserData | null> {
    const info = await SecureStore.getItemAsync('user_info');
    return info ? JSON.parse(info) : null;
  }

  async updateProfile(fullName: string): Promise<UserData> {
    const response = await coreApi.put(ENDPOINTS.USERS.ME, { fullName });
    const updatedData = response.data;
    
    // Merge updated info with existing token info
    const currentInfo = await this.getUserInfo();
    const newData: UserData = {
        ...currentInfo,
        ...updatedData,
        token: currentInfo?.token || ''
    };
    
    await SecureStore.setItemAsync('user_info', JSON.stringify(newData));
    return newData;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await coreApi.put(ENDPOINTS.USERS.PASSWORD, { currentPassword, newPassword });
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('user_token');
    return !!token;
  }
}

export const authService = new AuthService();

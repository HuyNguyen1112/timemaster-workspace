import { coreApi } from './api.service';
import { ENDPOINTS } from '../constants/api';

export interface Category {
  id: number;
  name: string;
  iconName: string;
  color: string;
}

class CategoryService {
  async getCategories(): Promise<Category[]> {
    const response = await coreApi.get(ENDPOINTS.CATEGORIES.BASE);
    return response.data.map((cat: any) => ({
      ...cat,
      color: cat.colorCode // Map backend colorCode to frontend color
    }));
  }

  async createCategory(data: { name: string; iconName: string; colorCode: string }): Promise<Category> {
    const response = await coreApi.post(ENDPOINTS.CATEGORIES.BASE, data);
    return {
      ...response.data,
      color: response.data.colorCode
    };
  }

  async updateCategory(id: number, data: { name: string; iconName: string; colorCode: string }): Promise<Category> {
    const response = await coreApi.put(ENDPOINTS.CATEGORIES.BASE + `/${id}`, data);
    return {
      ...response.data,
      color: response.data.colorCode
    };
  }

  async deleteCategory(id: number): Promise<void> {
    await coreApi.delete(ENDPOINTS.CATEGORIES.BASE + `/${id}`);
  }
}

export const categoryService = new CategoryService();

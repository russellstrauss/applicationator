import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await axios.get<T>(`${API_BASE_URL}${url}`);
    return response.data;
  },

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await axios.post<T>(`${API_BASE_URL}${url}`, data);
    return response.data;
  },

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await axios.put<T>(`${API_BASE_URL}${url}`, data);
    return response.data;
  },

  async delete<T = void>(url: string): Promise<T> {
    const response = await axios.delete<T>(`${API_BASE_URL}${url}`);
    return response.data;
  },
};


import { apiClient } from '@/shared/api/client';
import type {
    User,
    AuthResponse,
    LoginCredentials,
    RegisterCredentials
} from './types';

export const authApi = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post('accounts/login/', credentials);
        return response.data;
    },

    register: async (credentials: RegisterCredentials): Promise<User> => {
        const response = await apiClient.post('accounts/register/', credentials);
        return response.data;
    },

    getProfile: async (): Promise<User> => {
        const response = await apiClient.get('accounts/profile/');
        return response.data;
    },

    updateProfile: async (data: any): Promise<any> => {
        const response = await apiClient.put('accounts/profile/', data);
        return response.data;
    }
};
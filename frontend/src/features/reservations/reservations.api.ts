import { apiClient } from '@/shared/api/client';
import type {ResourceMap, Category} from './types';

export const reservationsApi = {
    getCategories: async (): Promise<Category[]> => {
        const response = await apiClient.get('reservations/categories/');
        return response.data;
    },

    getMapDetails: async (id: number | string): Promise<ResourceMap> => {
        const response = await apiClient.get(`reservations/maps/${id}/`);
        return response.data;
    },

    getCreatorMaps: async (params: any): Promise<any> => {
        const response = await apiClient.get('/reservations/creator/maps/', { params });
        return response.data;
    },

    getCreatorMapDetails: async (id: string | number): Promise<any> => {
        const response = await apiClient.get(`/reservations/maps/${id}/`);
        return response.data;
    },

    getCreatorMapUnits: async (id: string | number, params: any): Promise<any> => {
        const response = await apiClient.get(`/reservations/creator/maps/${id}/units/`, { params });
        return response.data;
    }
};
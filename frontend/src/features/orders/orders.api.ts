import { apiClient } from '@/shared/api/client';

export const ordersApi = {
    getMyOrders: async (params: any) => {
        const response = await apiClient.get('/orders/me/', { params });
        return response.data;
    },

    getGroupedOrders: async (params: any) => {
        const response = await apiClient.get('/orders/grouped/', { params });
        return response.data;
    },

    getOrderDetails: async (id: string | number) => {
        const response = await apiClient.get(`/orders/${id}/`);
        return response.data;
    },

    getCreatorMapOrders: async (id: string | number, params: any) => {
        const response = await apiClient.get(
            `/orders/creator/maps/${id}/`,
            { params }
        );
        return response.data;
    }
};
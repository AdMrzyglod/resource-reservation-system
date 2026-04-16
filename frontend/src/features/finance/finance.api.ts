import { apiClient } from '@/shared/api/client';

export const financeApi = {
    getPayouts: async (page: number): Promise<any> => {
        const response = await apiClient.get('/finance/creator/payouts/', { params: { page } });
        return response.data;
    }
};
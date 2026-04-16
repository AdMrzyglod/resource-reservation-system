import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: `${API_URL}/api/`,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refresh');
                if (!refreshToken) throw new Error("No refresh token");

                const res = await axios.post(`${API_URL}/api/accounts/login/refresh/`, {
                    refresh: refreshToken,
                });

                localStorage.setItem('access', res.data.access);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
                originalRequest.headers['Authorization'] = `Bearer ${res.data.access}`;

                return apiClient(originalRequest);
            } catch (err) {
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                window.dispatchEvent(new Event('auth:forceLogout'));
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);
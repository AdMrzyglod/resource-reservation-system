import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { authApi } from '../auth.api';
import type {LoginCredentials} from '../types';

export const useLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { login: setAuthContext } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            const data = await authApi.login(credentials);
            setAuthContext(data.access, data.refresh);
            showNotification('Logged in successfully!', 5000);
            navigate('/dashboard');
        } catch (err: any) {
            showNotification(err.response?.data?.detail || 'Login failed', 5000);
        } finally {
            setIsLoading(false);
        }
    };

    return { login, isLoading };
};
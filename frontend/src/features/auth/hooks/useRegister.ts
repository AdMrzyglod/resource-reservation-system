import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '@/context/NotificationContext';
import { authApi } from '../auth.api';
import type { RegisterCredentials } from '../types';

export const useRegister = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const register = async (credentials: RegisterCredentials) => {
        setIsLoading(true);

        try {
            await authApi.register(credentials);
            showNotification('Account created! You can now log in.', 5000, 'success');
            navigate('/login');
        } catch (err: any) {
            showNotification('Registration failed.', 5000, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return { register, isLoading };
};
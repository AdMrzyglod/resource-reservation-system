import { createContext, useState, useEffect, type ReactNode, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from './NotificationContext';

interface User {
    id?: number;
    username: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    login: (access: string, refresh: string) => void;
    logout: (forced?: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();
    const notification = useContext(NotificationContext);

    const logout = useCallback((forced: boolean = false) => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        setUser(null);

        if (forced) {
            notification?.showNotification('Your session has expired. Please log in again.', 8000);
        } else {
            notification?.showNotification('Logged out successfully.', 5000);
        }

        navigate('/login');
    }, [navigate, notification]);

    useEffect(() => {
        const handleForceLogout = () => logout(true);
        window.addEventListener('auth:forceLogout', handleForceLogout);

        return () => window.removeEventListener('auth:forceLogout', handleForceLogout);
    }, [logout]);

    useEffect(() => {
        const token = localStorage.getItem('access');

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    id: payload.user_id,
                    username: payload.username,
                    email: payload.email,
                    role: payload.role
                });
            } catch {
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
            }
        }

        setLoading(false);
    }, []);

    const login = (access: string, refresh: string) => {
        localStorage.setItem('access', access);
        localStorage.setItem('refresh', refresh);

        try {
            const base64Url = access.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(
                decodeURIComponent(
                    atob(base64)
                        .split('')
                        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join('')
                )
            );

            setUser({
                id: payload.user_id,
                username: payload.username,
                email: payload.email,
                role: payload.role
            });
        } catch (error) {
            console.error('Token decoding error', error);
        }
    };

    if (loading) return null;

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
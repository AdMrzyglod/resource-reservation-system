import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { X } from 'lucide-react';

interface Notification {
    id: number;
    message: string;
    duration: number;
}

interface NotificationContextType {
    showNotification: (message: string, duration: number) => void;
    addNotification: (message: string, type?: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notification, setNotification] = useState<Notification | null>(null);

    const showNotification = (message: string, duration: number) => {
        setNotification({ id: Date.now(), message, duration });
    };

    const addNotification = (message: string) => {
        showNotification(message, 5000);
    };

    const closeNotification = () => {
        setNotification(null);
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, notification.duration);

            return () => clearTimeout(timer);
        }
    }, [notification]);

    return (
        <NotificationContext.Provider value={{ showNotification, addNotification }}>
            {children}

            {notification && (
                <div className="fixed top-20 right-6 z-[100] min-w-[320px] bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden flex flex-col animate-in slide-in-from-top-5 fade-in duration-300">
                    <div className="flex justify-between items-center p-4">
                        <span className="text-slate-800 font-medium text-sm pr-4">
                            {notification.message}
                        </span>
                        <button
                            onClick={closeNotification}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="h-1 bg-slate-100 w-full">
                        <div
                            className="h-full bg-indigo-600"
                            style={{
                                animation: `shrink-bar ${notification.duration}ms linear forwards`
                            }}
                        />
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
};
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NotificationProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NotificationProvider>
  );
};
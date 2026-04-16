import { useState, useEffect } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { authApi } from '../auth.api';
import type { ProfileData } from "@/features/auth";

export const useProfile = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const notification = useNotification();

    useEffect(() => {
        authApi.getProfile()
            .then((data: ProfileData) => {
                if (data.bank_account_number) {
                    data.bank_account_number =
                        data.bank_account_number
                            .replace(/\s/g, '')
                            .match(/.{1,4}/g)
                            ?.join(' ') || data.bank_account_number;
                }
                setProfile(data);
            })
            .catch(console.error);
    }, []);

    const handleProfileUpdate = async (
        e: React.FormEvent,
        currentProfile: ProfileData
    ) => {
        e.preventDefault();

        const profileToSave = { ...currentProfile };

        if (profileToSave.bank_account_number) {
            const rawIban = profileToSave.bank_account_number.replace(/\s/g, '');

            if (rawIban.length !== 28) {
                notification?.showNotification(
                    'Bank account number must contain exactly 28 characters.',
                    5000,
                    'error'
                );
                return;
            }

            profileToSave.bank_account_number = rawIban;
        }

        try {
            const updatedProfile: ProfileData = await authApi.updateProfile(profileToSave);

            if (updatedProfile.bank_account_number) {
                updatedProfile.bank_account_number =
                    updatedProfile.bank_account_number
                        .match(/.{1,4}/g)
                        ?.join(' ') || updatedProfile.bank_account_number;
            }

            setProfile(updatedProfile);
            notification?.showNotification('Profile updated successfully!', 5000);
        } catch (error: any) {
            const serverMessage =
                error.response?.data?.bank_account_number?.[0] ||
                'Update failed. Please check your data.';

            notification?.showNotification(serverMessage, 5000);
        }
    };

    const handleIbanChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        currentProfile: ProfileData
    ) => {
        const val = e.target.value.replace(/\s/g, '').toUpperCase();

        const letters = val.substring(0, 2).replace(/[^A-Z]/g, '');
        const digits = val.substring(2).replace(/[^0-9]/g, '');

        let combined = letters + digits;

        if (combined.length > 28) {
            combined = combined.substring(0, 28);
        }

        const formatted = combined.match(/.{1,4}/g)?.join(' ') || combined;

        setProfile({
            ...currentProfile,
            bank_account_number: formatted
        });
    };

    return { profile, setProfile, handleProfileUpdate, handleIbanChange };
};
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/features/auth/components/ProfileForm';
import { PayoutsList } from '@/features/finance/components/PayoutsList';
import { OrdersTab } from '@/features/orders/components/OrdersTab';
import { CreatorMapsList } from '@/features/reservations/components/CreatorMapsList';
import { useProfile } from '@/features/auth/hooks/useProfile';

type Tab = 'ORDERS' | 'RESOURCES' | 'PAYOUTS' | 'PROFILE';

export const DashboardWidget = () => {
    const { user } = useAuth();
    const notification = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useProfile();

    const [activeTab, setActiveTab] = useState<Tab>(() => (location.state?.tab as Tab) || 'ORDERS');

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    const handleCreateClick = () => {
        if (profile?.is_complete) {
            navigate('/resources/create');
        } else {
            setActiveTab('PROFILE');
            notification?.showNotification("Please complete your profile to create a resource.", 5000, "error");
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your Dashboard</h1>
                    <p className="text-slate-500">Manage your orders, resources, and billing details.</p>
                </div>

                <Button
                    onClick={handleCreateClick}
                    className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 text-lg font-bold shadow-lg"
                >
                    + Create New Resource
                </Button>
            </div>

            <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl mb-8 w-fit overflow-x-auto">
                {(['ORDERS', 'RESOURCES', 'PAYOUTS', 'PROFILE'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                            activeTab === t
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {t === 'ORDERS'
                            ? 'My Purchases'
                            : t === 'RESOURCES'
                            ? 'Created Resources'
                            : t === 'PAYOUTS'
                            ? 'Payouts'
                            : 'Profile & Address'}
                    </button>
                ))}
            </div>

            <OrdersTab isActive={activeTab === 'ORDERS'} />
            <CreatorMapsList isActive={activeTab === 'RESOURCES'} />
            <PayoutsList isActive={activeTab === 'PAYOUTS'} />
            {activeTab === 'PROFILE' && <ProfileForm />}
        </div>
    );
};
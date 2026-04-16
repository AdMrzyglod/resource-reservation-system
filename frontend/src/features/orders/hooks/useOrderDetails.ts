import { useState, useEffect } from 'react';
import { ordersApi } from '../orders.api';

export const useOrderDetails = (id: string | undefined) => {
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        setLoading(true);

        ordersApi
            .getOrderDetails(id)
            .then(setOrder)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    return { order, loading };
};
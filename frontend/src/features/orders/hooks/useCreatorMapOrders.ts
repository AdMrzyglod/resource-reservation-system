import { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '../orders.api';

export const useCreatorMapOrders = (id: string | undefined, isActive: boolean) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [page, setPage] = useState(() =>
        parseInt(sessionStorage.getItem(`crd_orders_page_${id}`) || '1', 10)
    );

    const [totalPages, setTotalPages] = useState(1);

    const [statuses, setStatuses] = useState<string[]>(() => {
        const saved = sessionStorage.getItem(`crd_order_status_${id}`);
        return saved
            ? JSON.parse(saved)
            : ['PAID', 'PENDING', 'FAILED', 'CANCELLED', 'EXPIRED'];
    });

    const [sortBy, setSortBy] = useState(
        () => sessionStorage.getItem(`crd_order_sort_${id}`) || '-created_at'
    );

    useEffect(() => {
        sessionStorage.setItem(`crd_orders_page_${id}`, page.toString());
        sessionStorage.setItem(`crd_order_status_${id}`, JSON.stringify(statuses));
        sessionStorage.setItem(`crd_order_sort_${id}`, sortBy);
    }, [id, page, statuses, sortBy]);

    const fetchOrders = useCallback(async () => {
        if (!id) return;

        try {
            const data = await ordersApi.getCreatorMapOrders(id, {
                page,
                statuses: statuses.join(','),
                sort_by: sortBy
            });

            setOrders(data.results || data);
            setTotalPages(Math.ceil((data.count || 1) / 10));
        } catch (e) {
            console.error(e);
        }
    }, [id, page, statuses, sortBy]);

    useEffect(() => {
        if (isActive) fetchOrders();
    }, [isActive, fetchOrders]);

    return {
        orders,
        page,
        setPage,
        totalPages,
        statuses,
        setStatuses,
        sortBy,
        setSortBy,
        fetchOrders
    };
};
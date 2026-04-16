import { useState, useEffect } from 'react';
import { ordersApi } from '../orders.api';

type OrderStatus = 'PAID' | 'PENDING' | 'CANCELLED' | 'FAILED' | 'EXPIRED';

export const useOrders = (isActive: boolean) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<OrderStatus[]>(['PAID', 'PENDING']);
    const [sort, setSort] = useState('-created_at');

    useEffect(() => {
        if (!isActive) return;

        ordersApi
            .getMyOrders({
                page,
                search,
                statuses: filters.join(','),
                sort_by: sort
            })
            .then((data) => {
                setOrders(data.results || data);
                setTotalPages(Math.ceil((data.count || 1) / 10));
            })
            .catch(console.error);
    }, [isActive, page, search, filters, sort]);

    return {
        orders,
        page,
        setPage,
        totalPages,
        search,
        setSearch,
        filters,
        setFilters,
        sort,
        setSort
    };
};
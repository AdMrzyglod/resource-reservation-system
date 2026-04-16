import { useState, useEffect } from 'react';
import { ordersApi } from '../orders.api';

export const useGroupedOrders = (isActive: boolean) => {
    const [maps, setMaps] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('title');

    useEffect(() => {
        if (!isActive) return;

        ordersApi
            .getGroupedOrders({ page, search, sort_by: sort })
            .then((data) => {
                setMaps(data.results || data);
                setTotalPages(Math.ceil((data.count || 1) / 10));
            })
            .catch(console.error);
    }, [isActive, page, search, sort]);

    return {
        maps,
        page,
        setPage,
        totalPages,
        search,
        setSearch,
        sort,
        setSort
    };
};
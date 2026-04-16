import { useState, useEffect } from 'react';
import { financeApi } from '../finance.api';

export const usePayouts = (isActive: boolean) => {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isActive) return;

        setLoading(true);

        financeApi
            .getPayouts(page)
            .then((res) => {
                setPayouts(res.results || res);
                setTotalPages(Math.ceil((res.count || 1) / 10));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isActive, page]);

    return { payouts, page, setPage, totalPages, loading };
};
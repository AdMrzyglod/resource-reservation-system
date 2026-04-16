import { useState, useEffect, useCallback } from 'react';
import { reservationsApi } from '../reservations.api';

export const useCreatorMapUnits = (id: string | undefined, isActive: boolean) => {
    const [units, setUnits] = useState<any[]>([]);
    const [page, setPage] = useState(() =>
        parseInt(sessionStorage.getItem(`crd_units_page_${id}`) || '1', 10)
    );
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (id) {
            sessionStorage.setItem(`crd_units_page_${id}`, page.toString());
        }
    }, [id, page]);

    const fetchUnits = useCallback(async () => {
        if (!id) return;

        try {
            const data = await reservationsApi.getCreatorMapUnits(id, {
                page,
                page_size: 50
            });

            setUnits(data.results || data);
            setTotalPages(Math.ceil((data.count || 1) / 50));
        } catch (e) {
            console.error(e);
        }
    }, [id, page]);

    useEffect(() => {
        if (!isActive) return;
        fetchUnits();
    }, [isActive, fetchUnits]);

    return {
        units,
        page,
        setPage,
        totalPages,
        fetchUnits
    };
};
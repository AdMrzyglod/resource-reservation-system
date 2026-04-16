import { useState, useEffect } from 'react';
import { reservationsApi } from '../reservations.api';

export const useCreatorMaps = (isActive: boolean) => {
    const [maps, setMaps] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState(() => sessionStorage.getItem('cd_search') || '');
    const [selectedCategories, setSelectedCategories] = useState<number[]>(() => {
        const saved = sessionStorage.getItem('cd_categories');
        return saved ? JSON.parse(saved) : [];
    });
    const [sort, setSort] = useState(() => sessionStorage.getItem('cd_sortBy') || '-created_at');
    const [page, setPage] = useState(() => parseInt(sessionStorage.getItem('cd_page') || '1', 10));
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        sessionStorage.setItem('cd_search', search);
        sessionStorage.setItem('cd_categories', JSON.stringify(selectedCategories));
        sessionStorage.setItem('cd_sortBy', sort);
        sessionStorage.setItem('cd_page', page.toString());
    }, [search, selectedCategories, sort, page]);

    useEffect(() => {
        reservationsApi.getCategories()
            .then(setCategories)
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!isActive) return;

        setLoading(true);

        const params: any = { page, sort_by: sort };

        if (search) params.search = search;
        if (selectedCategories.length > 0) {
            params.categories = selectedCategories.join(',');
        }

        reservationsApi.getCreatorMaps(params)
            .then(data => {
                setMaps(data.results || data);
                setTotalPages(Math.ceil((data.count || 1) / 10));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isActive, page, search, selectedCategories, sort]);

    return {
        maps,
        categories,
        loading,
        page,
        setPage,
        totalPages,
        search,
        setSearch,
        sort,
        setSort,
        selectedCategories,
        setSelectedCategories
    };
};
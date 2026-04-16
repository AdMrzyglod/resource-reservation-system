import { useState, useEffect } from 'react';
import { reservationsApi } from '../reservations.api';
import type {ResourceMap, Category} from '../types';

export const useMaps = () => {
    const [resources, setResources] = useState<ResourceMap[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [search, setSearch] = useState(() => sessionStorage.getItem('rl_search') || '');
    const [selectedCategories, setSelectedCategories] = useState<number[]>(() => {
        const saved = sessionStorage.getItem('rl_categories');
        return saved ? JSON.parse(saved) : [];
    });
    const [sortBy, setSortBy] = useState(() => sessionStorage.getItem('rl_sortBy') || '-created_at');
    const [page, setPage] = useState(() => parseInt(sessionStorage.getItem('rl_page') || '1', 10));

    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        sessionStorage.setItem('rl_search', search);
        sessionStorage.setItem('rl_categories', JSON.stringify(selectedCategories));
        sessionStorage.setItem('rl_sortBy', sortBy);
        sessionStorage.setItem('rl_page', page.toString());
    }, [search, selectedCategories, sortBy, page]);

    useEffect(() => {
        reservationsApi.getCategories().then(setCategories).catch(console.error);
    }, []);

    useEffect(() => {
        const fetchResources = async () => {
            setLoading(true);
            try {
                const params: Record<string, string | number> = { page, sort_by: sortBy };
                if (search) params.search = search;
                if (selectedCategories.length > 0) params.categories = selectedCategories.join(',');

                const { apiClient } = await import('@/shared/api/client');
                const res = await apiClient.get('/reservations/maps/', { params });

                if (res.data.results) {
                    setResources(res.data.results);
                    setTotalPages(Math.ceil((res.data.count || 1) / 10));
                } else {
                    setResources(res.data);
                    setTotalPages(1);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, [page, search, selectedCategories, sortBy]);

    return {
        resources,
        categories,
        search, setSearch,
        selectedCategories, setSelectedCategories,
        sortBy, setSortBy,
        page, setPage,
        totalPages,
        loading
    };
};
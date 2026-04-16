import { useState, useEffect, useCallback } from 'react';
import { reservationsApi } from '../reservations.api';

export const useMapDetails = (id: string | undefined) => {
    const [resource, setResource] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchResource = useCallback(async () => {
        if (!id) return;

        try {
            const data = await reservationsApi.getMapDetails(id);
            setResource(data);
        } catch (err) {
            console.error('Error fetching resource details:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchResource();
    }, [fetchResource]);

    return { resource, setResource, loading, fetchResource };
};
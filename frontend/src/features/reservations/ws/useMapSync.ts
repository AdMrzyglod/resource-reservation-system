import { useState, useEffect, useRef } from 'react';

export const useMapSync = (
    id: string | undefined,
    resource: any,
    setResource: any,
    pendingOrderId: any,
    selectedUnits: any[],
    setSelectedUnits: any,
    bookingLoading: boolean = false
) => {
    const [wsConnected, setWsConnected] = useState(false);

    const resourceRef = useRef(resource);
    const selectedUnitsRef = useRef(selectedUnits);
    const pendingOrderIdRef = useRef(pendingOrderId);
    const setResourceRef = useRef(setResource);
    const setSelectedUnitsRef = useRef(setSelectedUnits);
    const bookingLoadingRef = useRef(bookingLoading);

    useEffect(() => {
        resourceRef.current = resource;
        selectedUnitsRef.current = selectedUnits;
        pendingOrderIdRef.current = pendingOrderId;
        setResourceRef.current = setResource;
        setSelectedUnitsRef.current = setSelectedUnits;
        bookingLoadingRef.current = bookingLoading;
    }, [resource, selectedUnits, pendingOrderId, setResource, setSelectedUnits, bookingLoading]);

    useEffect(() => {
        if (!id) return;

        let ws: WebSocket;
        let isComponentMounted = true;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            const token = localStorage.getItem('access');
            const wsHost = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

            let wsUrl = `${wsHost}/ws/maps/${id}/`;
            if (token) {
                wsUrl += `?token=${token}`;
            }

            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                if (isComponentMounted) setWsConnected(true);
            };

            ws.onclose = () => {
                if (isComponentMounted) {
                    setWsConnected(false);
                    reconnectTimeout = setTimeout(connect, 2000);
                }
            };

            ws.onerror = () => {};

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'map_update') {
                        const currentResource = resourceRef.current;
                        if (!currentResource) return;

                        const newUnits = [...currentResource.units];

                        data.updates.forEach((update: any) => {
                            const idx = newUnits.findIndex((u: any) => u.id === update.id);
                            if (idx !== -1) {
                                newUnits[idx] = { ...newUnits[idx], status: update.status };
                            }
                        });

                        const available = newUnits.filter((u: any) => u.status.toUpperCase() === 'AVAILABLE').length;
                        const reserved = newUnits.filter((u: any) => u.status.toUpperCase() === 'RESERVED').length;
                        const purchased = newUnits.filter((u: any) => u.status.toUpperCase() === 'PURCHASED').length;

                        setResourceRef.current({
                            ...currentResource,
                            units: newUnits,
                            stats: {
                                ...currentResource.stats,
                                available,
                                reserved,
                                purchased
                            }
                        });
                    }
                } catch (err) {
                    console.error("Error WS", err);
                }
            };
        };

        connect();

        return () => {
            isComponentMounted = false;
            clearTimeout(reconnectTimeout);

            if (ws) {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                } else if (ws.readyState === WebSocket.CONNECTING) {
                    ws.onopen = () => ws.close();
                }
            }
        };
    }, [id]);

    return { wsConnected };
};
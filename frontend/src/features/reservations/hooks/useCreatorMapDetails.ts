import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { reservationsApi } from '../reservations.api';

export const useCreatorMapDetails = (id: string | undefined, onUpdateCallback: () => void) => {
    const [mapDetails, setMapDetails] = useState<any>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    const onUpdateCallbackRef = useRef(onUpdateCallback);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        onUpdateCallbackRef.current = onUpdateCallback;
    }, [onUpdateCallback]);

    useEffect(() => {
        if (!id) return;

        reservationsApi.getCreatorMapDetails(id)
            .then(data => {
                if (data.owner_id !== user?.id && data.creator_id !== user?.id && data.creator !== user?.id) {
                    alert("You don't have access to this dashboard.");
                    navigate('/');
                } else {
                    setMapDetails(data);
                }
            })
            .catch(console.error);
    }, [id, user, navigate]);

    useEffect(() => {
        if (!id) return;

        let ws: WebSocket;
        let isComponentMounted = true;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            const token = localStorage.getItem('access');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const WS_BASE_URL = API_URL.replace(/^http/, 'ws');
            const wsUrl = token
                ? `${WS_BASE_URL}/ws/maps/${id}/?token=${token}`
                : `${WS_BASE_URL}/ws/maps/${id}/`;

            ws = new WebSocket(wsUrl);
            wsRef.current = ws;

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

            ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);

                    if (data.type === 'map_update') {
                        setMapDetails((prev: any) => {
                            if (!prev) return prev;

                            const currentUnits = prev.units || prev.all_units || [];
                            const newUnits = [...currentUnits];

                            data.updates.forEach((update: any) => {
                                const idx = newUnits.findIndex((u: any) => u.id === update.id);
                                if (idx !== -1) {
                                    newUnits[idx] = { ...newUnits[idx], status: update.status };
                                }
                            });

                            const available = newUnits.filter((u: any) => u.status.toUpperCase() === 'AVAILABLE').length;
                            const reserved = newUnits.filter((u: any) => u.status.toUpperCase() === 'RESERVED').length;
                            const purchased = newUnits.filter((u: any) => u.status.toUpperCase() === 'PURCHASED').length;

                            return {
                                ...prev,
                                units: newUnits,
                                all_units: newUnits,
                                stats: { ...prev.stats, available, reserved, purchased }
                            };
                        });

                        if (onUpdateCallbackRef.current) {
                            onUpdateCallbackRef.current();
                        }
                    }
                } catch (err) {
                    console.error("Błąd parsowania WS", err);
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

    useEffect(() => {
        if (mapDetails?.purchase_deadline) {
            const isClosed = new Date(mapDetails.purchase_deadline) < new Date();

            if (isClosed && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.close();
                setWsConnected(false);
            }
        }
    }, [mapDetails?.purchase_deadline]);

    return { mapDetails, wsConnected };
};
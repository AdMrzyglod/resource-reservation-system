import { useState, useEffect, useRef, useMemo, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/shared/api/client';
import { Button } from '@/components/ui/button';
import { useMapDetails } from '@/features/reservations/hooks/useMapDetails';
import { useMapSync } from '@/features/reservations/ws/useMapSync';
import { OrganizerCard } from '@/features/reservations/components/OrganizerCard';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { useNotification } from "@/context/NotificationContext.tsx";

const ORDERS_PER_PAGE = 10;

export const ResourceMapWidget = ({ id }: { id: string }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile } = useProfile();
    const { resource, setResource, fetchResource } = useMapDetails(id);
    const notification = useNotification();
    const dynamicLimit = resource?.max_units_per_order || 10;

    const [selectedUnits, setSelectedUnits] = useState<number[]>([]);
    const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [highlightedOrderId, setHighlightedOrderId] = useState<number | null>(null);

    const [zoom, setZoom] = useState(1);
    const [isDraggingMap, setIsDraggingMap] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const [displayedOrders, setDisplayedOrders] = useState<any[]>([]);
    const [totalOrderPages, setTotalOrderPages] = useState(1);
    const [isFetchingOrders, setIsFetchingOrders] = useState(false);
    const [ordersPage, setOrdersPage] = useState(1);
    const [orderStatuses, setOrderStatuses] = useState<string[]>(['PAID', 'PENDING', 'FAILED', 'CANCELLED', 'EXPIRED']);
    const [orderSortBy, setOrderSortBy] = useState('-created_at');

    const isOwner = user?.id === resource?.owner_id || user?.id === resource?.creator;

    const { wsConnected } = useMapSync(id, resource, setResource, pendingOrderId, selectedUnits, setSelectedUnits, bookingLoading);

    const fetchPaginatedOrders = async () => {
        if (!user || isOwner) return;
        setIsFetchingOrders(true);
        try {
            const res = await apiClient.get('/orders/me/', {
                params: {
                    map_id: id,
                    page: ordersPage,
                    statuses: orderStatuses.join(','),
                    sort_by: orderSortBy
                }
            });

            setDisplayedOrders(res.data.results || res.data);
            if (res.data.count !== undefined) {
                setTotalOrderPages(Math.ceil(res.data.count / ORDERS_PER_PAGE) || 1);
            } else {
                setTotalOrderPages(1);
            }
        } catch (err) {
            console.error("Error fetching paginated orders:", err);
        } finally {
            setIsFetchingOrders(false);
        }
    };

    useEffect(() => {
        fetchPaginatedOrders();
    }, [id, user, isOwner, ordersPage, orderStatuses, orderSortBy]);

    const highlightedUnitIds = useMemo(() => {
        if (!highlightedOrderId || !displayedOrders) return [];
        const order = displayedOrders.find((o: any) => o.id === highlightedOrderId);
        if (!order) return [];

        return order.items.map((item: any) => item.resource_unit_id || item.unit_id);
    }, [highlightedOrderId, displayedOrders]);

    const myPaidUnitIds = useMemo(() => {
        if (!resource?.my_orders) return [];
        const paidOrders = resource.my_orders.filter((o: any) => o.status.toUpperCase() === 'PAID');
        return paidOrders.flatMap((o: any) => o.items.map((i: any) => i.resource_unit_id || i.unit_id));
    }, [resource?.my_orders]);

    useEffect(() => {
        if (resource?.my_orders) {
            const pending = resource.my_orders.find((o: any) => o.status.toUpperCase() === 'PENDING');
            setPendingOrderId(pending ? pending.id : null);
            if (pending) setSelectedUnits(pending.items.map((i: any) => i.resource_unit_id));
        }
    }, [resource?.my_orders]);

    useEffect(() => {
        if (pendingOrderId && resource?.units && resource?.my_orders) {
            const pendingOrder = resource.my_orders.find((o: any) => o.id === pendingOrderId);

            if (pendingOrder) {
                const orderUnitIds = pendingOrder.items.map((i: any) => i.resource_unit_id || i.unit_id);
                const isExpired = resource.units.some((u: any) =>
                    orderUnitIds.includes(u.id) && u.status.toUpperCase() === 'AVAILABLE'
                );

                if (isExpired) {
                    notification?.showNotification("Your reservation time has expired.", 5000, "warning");
                    setPendingOrderId(null);
                    setSelectedUnits([]);
                    fetchMyOrders();
                }
            }
        }
    }, [resource?.units, pendingOrderId, resource?.my_orders]);

    const fetchMyOrders = async () => {
        await fetchPaginatedOrders();
        await fetchResource();
    };


    const handleZoomIn = () => setZoom(z => Math.min(4, Math.round((z + 0.1) * 10) / 10));
    const handleZoomOut = () => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10));
    const handleMapMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        setIsDraggingMap(true);
        setDragStart({ x: e.pageX, y: e.pageY });
        setScrollStart({ left: containerRef.current.scrollLeft, top: containerRef.current.scrollTop });
    };
    const handleMapMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!isDraggingMap || !containerRef.current) return;
        e.preventDefault();
        containerRef.current.scrollLeft = scrollStart.left - (e.pageX - dragStart.x);
        containerRef.current.scrollTop = scrollStart.top - (e.pageY - dragStart.y);
    };
    const handleMapMouseUp = () => setIsDraggingMap(false);

    const toggleUnit = (e: MouseEvent<HTMLDivElement>, unitId: number, status: string) => {
        e.stopPropagation();
        if (Math.abs(e.pageX - dragStart.x) > 5 || Math.abs(e.pageY - dragStart.y) > 5) return;
        if (!user || isOwner || pendingOrderId || (profile && !profile.is_complete)) return;
        if (status.toUpperCase() !== 'AVAILABLE') return;

        if (selectedUnits.includes(unitId)) {
            setSelectedUnits(selectedUnits.filter(u => u !== unitId));
        } else {
            if (selectedUnits.length < dynamicLimit) {
                setSelectedUnits([...selectedUnits, unitId]);
            }
        }
    };

    const handleReserve = async () => {
        if (selectedUnits.length === 0) return;
        setBookingLoading(true);
        try {
            const res = await apiClient.post('/orders/', { map_id: Number(id), unit_ids: selectedUnits });
            const newOrderId = res.data.order_id;

            setPendingOrderId(newOrderId);
            await fetchMyOrders();

            notification?.showNotification("Units reserved successfully!", 3000);
        } catch (err: any) {
            const serverError = err.response?.data?.error;
            const serverMessage = err.response?.data?.message;

            if (serverError === 'PROFILE_INCOMPLETE') {
                notification?.showNotification(serverMessage || "Complete your profile details.", 5000);
                navigate('/dashboard', { state: { tab: 'PROFILE' } });
            } else if (serverError === 'ACCOUNT_BLOCKED' && err.response?.data?.blocked_until) {
                const localTime = new Date(err.response.data.blocked_until).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                notification?.showNotification(`Blocked until ${localTime}.`, 5000);
            } else {
                notification?.showNotification(serverError || "Error during reservation", 5000);
            }
        } finally {
            setBookingLoading(false);
        }
    };

    const handlePay = async () => {
        if (!pendingOrderId) return;
        setBookingLoading(true);
        try {
            await apiClient.post(`/finance/orders/${pendingOrderId}/pay/`);
            notification?.showNotification('Payment successful!', 5000);
            setPendingOrderId(null);
            setSelectedUnits([]);
            await fetchMyOrders();
        } catch (err: any) {
            if (err.response?.data?.error === 'PROFILE_INCOMPLETE') {
                alert("PROFILE INCOMPLETE: Please update your billing details in the Dashboard to proceed with payment.");
                navigate('/dashboard', { state: { tab: 'PROFILE' } });
            } else {
                alert(err.response?.data?.error || "Payment failed");
                setPendingOrderId(null); setSelectedUnits([]);
                await fetchMyOrders();
            }
        } finally { setBookingLoading(false); }
    };

    const handleCancel = async () => {
        if (!pendingOrderId) return;
        setBookingLoading(true);
        try {
            await apiClient.post(`/orders/${pendingOrderId}/cancel/`);
            notification?.showNotification('Reservation cancelled.', 5000);
            setPendingOrderId(null);
            setSelectedUnits([]);
            await fetchMyOrders();
        } catch (err: any) { console.error(err); }
        finally { setBookingLoading(false); }
    };

    if (!resource) return <div className="p-20 text-center animate-pulse text-slate-500">Loading Map Details...</div>;

    const snap = resource.creator_snapshot || {};
    const isClosed = resource.purchase_deadline && new Date(resource.purchase_deadline) < new Date();
    const statusText = isClosed ? 'SALES CLOSED' : 'OPEN FOR SALES';
    const statusColor = isClosed ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-green-700';
    const dynamicDotSize = resource.dot_size * zoom;

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <Button variant="outline" onClick={() => navigate(-1)} className="hover:bg-slate-100 border-slate-300">← Back</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start mb-8">
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-100 z-10 shadow-sm">
                            <div className="flex items-center gap-2 px-2">
                                <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-300'}`}></div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{wsConnected ? 'Live Updates' : 'Offline Mode'}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-1 shadow-sm">
                                <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded text-lg font-bold text-slate-600">-</button>
                                <span className="text-xs font-bold w-12 text-center text-slate-600">{Math.round(zoom * 100)}%</span>
                                <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded text-lg font-bold text-slate-600">+</button>
                            </div>
                        </div>

                        <div
                            ref={containerRef}
                            className="relative w-full h-[600px] overflow-auto bg-slate-200 custom-scrollbar select-none"
                            onMouseDown={handleMapMouseDown} onMouseMove={handleMapMouseMove} onMouseUp={handleMapMouseUp} onMouseLeave={handleMapMouseUp}
                            style={{ cursor: isDraggingMap ? 'grabbing' : 'grab' }}
                        >
                            <div className="relative mx-auto" style={{ width: zoom === 1 ? 'max-content' : `${zoom * 100}%` }}>
                                <img src={`${import.meta.env.VITE_API_URL}${resource.image_url}`} alt="Map" className="block pointer-events-none" style={{ width: zoom === 1 ? 'auto' : '100%', height: 'auto', maxHeight: zoom === 1 ? '600px' : 'none', maxWidth: zoom === 1 ? '100%' : 'none' }} draggable={false} />

                                {resource.units.map((unit: any) => {
                                    const isSelected = selectedUnits.includes(unit.id);
                                    const isHighlighted = highlightedUnitIds.includes(unit.id);
                                    const isMyPaid = myPaidUnitIds.includes(unit.id);
                                    const isAvail = unit.status.toUpperCase() === 'AVAILABLE';

                                    let bgColor = '#94a3b8';

                                    if (isHighlighted) {
                                        bgColor = '#ec4899';
                                    } else if (isSelected) {
                                        bgColor = '#4f46e5';
                                    } else if (isMyPaid) {
                                        bgColor = '#0ea5e9';
                                    } else if (unit.status.toUpperCase() === 'RESERVED') {
                                        bgColor = '#eab308';
                                    } else if (unit.status.toUpperCase() === 'PURCHASED') {
                                        bgColor = '#ef4444';
                                    } else if (isAvail) {
                                        bgColor = '#22c55e';
                                    }

                                    const cursorClass = (!user || isOwner || isClosed || pendingOrderId || (profile && !profile.is_complete))
                                        ? 'cursor-not-allowed opacity-90' : (isAvail ? 'cursor-pointer hover:border-white hover:scale-125 hover:z-50' : 'cursor-not-allowed opacity-90');

                                    return (
                                        <div
                                            key={unit.id}
                                            title={`Unit #${unit.id} (${unit.status.toUpperCase()})`}
                                            onClick={(e) => toggleUnit(e, unit.id, unit.status)}
                                            className={`absolute rounded-full shadow-sm border border-white/50 transition-colors ${cursorClass}`}
                                            style={{
                                                left: `calc(${unit.x_position}% - ${dynamicDotSize/2}px)`, top: `calc(${unit.y_position}% - ${dynamicDotSize/2}px)`,
                                                width: `${dynamicDotSize}px`, height: `${dynamicDotSize}px`, backgroundColor: bgColor,
                                                zIndex: isSelected || isHighlighted || isMyPaid ? 10 : 1,
                                                boxShadow: isHighlighted ? '0 0 0 4px rgba(236, 72, 153, 0.5)' : 'none'
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 p-4 bg-slate-50 border-t border-slate-100 z-10">
                            <div className="flex flex-col items-center"><span className="text-2xl font-black text-slate-900 leading-none">{resource.stats.total}</span><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Units</span></div>
                            <div className="flex flex-col items-center"><span className="text-2xl font-black text-green-600 leading-none">{resource.stats.available}</span><div className="flex items-center gap-1 mt-1"><div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Available</span></div></div>
                            <div className="flex flex-col items-center"><span className="text-2xl font-black text-yellow-500 leading-none">{resource.stats.reserved}</span><div className="flex items-center gap-1 mt-1"><div className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reserved</span></div></div>
                            <div className="flex flex-col items-center"><span className="text-2xl font-black text-red-500 leading-none">{resource.stats.purchased}</span><div className="flex items-center gap-1 mt-1"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bought</span></div></div>

                            {user && !isOwner && myPaidUnitIds.length > 0 && (
                                <div className="flex flex-col items-center border-l border-slate-200 pl-6 md:pl-12">
                                    <span className="text-2xl font-black text-sky-500 leading-none">{myPaidUnitIds.length}</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Yours</span>
                                    </div>
                                </div>
                            )}

                            {user && !isOwner && (
                                <div className="flex flex-col items-center opacity-70 border-l border-slate-200 pl-6 md:pl-12">
                                    <span className="text-2xl font-black text-indigo-600 leading-none">{selectedUnits.length}</span><div className="flex items-center gap-1 mt-1"><div className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]"></div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Cart</span></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Resource Details</h3>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{resource.description}</p>
                        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Event Schedule</span><div className="text-sm text-slate-800 space-y-1"><p><strong className="text-slate-600">Start:</strong> {new Date(resource.event_start_date).toLocaleString()}</p><p><strong className="text-slate-600">End:</strong> {new Date(resource.event_end_date).toLocaleString()}</p></div></div>
                            {resource.purchase_deadline && (<div><span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Purchase Deadline</span><div className="text-sm font-medium text-slate-800">{new Date(resource.purchase_deadline).toLocaleString()}</div></div>)}
                        </div>
                    </div>
                    <OrganizerCard snap={snap} address={resource.address} />
                </div>

                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-extrabold tracking-widest mb-4 ${statusColor}`}>{statusText}</span>
                        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-2">{resource.title}</h1>
                        <span className="block text-xs font-bold uppercase tracking-wider text-indigo-600">{resource.category_name}</span>
                        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-end">
                            <div><span className="block text-xs font-bold text-slate-400 uppercase">Price per unit</span><span className="text-3xl font-black text-slate-900">${resource.price}</span></div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-4">Checkout</h3>
                        {!user ? (
                            <div className="text-center p-5 bg-slate-50 rounded-xl border border-slate-200"><p className="text-sm text-slate-600 font-semibold mb-4">You must be logged in to make a reservation.</p><Button onClick={() => navigate('/login')} className="w-full bg-indigo-600 hover:bg-indigo-700">Log In or Register</Button></div>
                        ) : isOwner ? (
                            <div className="text-center p-5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                <p className="text-sm text-indigo-900 font-semibold mb-4">You are the creator of this map.</p>
                                <Button onClick={() => navigate(`/creator/map/${resource.id}`)} className="w-full bg-indigo-600 hover:bg-indigo-700">Go to Creator Dashboard</Button>
                            </div>
                        ) : (profile && !profile.is_complete) ? (
                            <div className="text-center p-5 bg-orange-50 rounded-xl border border-orange-200">
                                <p className="text-sm text-orange-800 font-semibold mb-4">Complete your profile and billing details to make reservations.</p>
                                <Button onClick={() => navigate('/dashboard', { state: { tab: 'PROFILE' } })} className="w-full bg-orange-600 hover:bg-orange-700">Go to Profile Settings</Button>
                            </div>
                        ) : isClosed ? (
                            <div className="text-center p-5 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm">Purchases are no longer available.</div>
                        ) : pendingOrderId ? (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center"><p className="text-xs font-bold text-yellow-700 uppercase mb-1">Reservation Active</p><p className="text-sm text-yellow-800">Order #{pendingOrderId}</p><p className="text-xl font-black text-slate-900 mt-2">${(selectedUnits.length * Number(resource.price)).toFixed(2)}</p></div>
                                <Button onClick={handlePay} disabled={bookingLoading} className="w-full bg-green-600 hover:bg-green-700 py-6 text-md font-bold shadow-md">{bookingLoading ? "Processing..." : "Pay Now"}</Button>
                                <Button onClick={handleCancel} disabled={bookingLoading} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 py-6">Cancel Reservation</Button>
                            </div>
                        ) : selectedUnits.length === 0 ? (
                            <div className="text-center p-5 border-2 border-dashed border-slate-200 rounded-xl"><p className="text-sm text-slate-500">Click on available <span className="text-green-500 font-bold">green</span> units to select them.</p></div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Selected units:</span>
                                    <span className={`font-bold ${selectedUnits.length >= dynamicLimit ? 'text-red-600' : 'text-indigo-600'}`}>
                                        {selectedUnits.length} / {dynamicLimit}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg"><span className="text-slate-900 font-bold">Total:</span><span className="font-black text-indigo-600">${(selectedUnits.length * Number(resource.price)).toFixed(2)}</span></div>
                                <Button onClick={handleReserve} disabled={bookingLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-md font-bold shadow-md">{bookingLoading ? "Reserving..." : "Reserve Selected"}</Button>
                            </div>
                        )}
                    </div>

                    {!isOwner && user && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col gap-3">
                                <h3 className="font-bold text-slate-900">Your Orders</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['PAID', 'PENDING', 'CANCELLED', 'FAILED', 'EXPIRED'].map(s => (
                                        <label key={s} className="flex items-center space-x-1 cursor-pointer bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-100">
                                            <input type="checkbox" checked={orderStatuses.includes(s)} onChange={() => { setOrderStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]); setOrdersPage(1); }} className="rounded text-indigo-600 w-3 h-3" />
                                            <span className="text-[9px] font-bold uppercase text-slate-600">{s}</span>
                                        </label>
                                    ))}
                                </div>
                                <select className="h-8 border border-slate-200 rounded text-xs px-2 font-semibold bg-white text-slate-700 outline-none w-full" value={orderSortBy} onChange={e => { setOrderSortBy(e.target.value); setOrdersPage(1); }}>
                                    <option value="-created_at">Newest First</option><option value="created_at">Oldest First</option><option value="-total_price">Highest Amount</option><option value="total_price">Lowest Amount</option>
                                </select>
                            </div>

                            <div className="space-y-0 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {isFetchingOrders ? (
                                    <div className="p-8 text-center text-sm font-semibold text-slate-500 animate-pulse">Loading orders...</div>
                                ) : displayedOrders.length === 0 ? (
                                    <div className="p-8 text-center text-sm font-semibold text-slate-500">No orders match the selected filters.</div>
                                ) : (
                                    displayedOrders.map((order: any) => (
                                        <div
                                            key={order.id}
                                            onClick={() => setHighlightedOrderId(order.id === highlightedOrderId ? null : order.id)}
                                            className={`p-4 border-b transition-colors text-sm cursor-pointer ${
                                                highlightedOrderId === order.id 
                                                    ? "bg-pink-50 border-pink-200 shadow-[inset_4px_0_0_#db2777]" 
                                                    : "border-slate-100 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-mono font-bold text-slate-700">#{order.id}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    order.status.toUpperCase() === 'PAID' ? 'bg-green-100 text-green-700' : 
                                                    order.status.toUpperCase() === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-slate-500 text-xs">
                                                <span>{order.items.length} units</span>
                                                <span className="font-bold text-slate-800">${order.total_price}</span>
                                            </div>

                                            <div className="mt-3 flex justify-end items-center">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs bg-white hover:bg-slate-100 border-slate-300 shadow-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/orders/${order.id}?fromMap=true`);
                                                    }}
                                                >
                                                    Details
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {totalOrderPages > 1 && (
                                <div className="flex justify-between items-center p-3 border-t border-slate-100 bg-slate-50">
                                    <Button size="sm" variant="outline" disabled={ordersPage === 1} onClick={() => setOrdersPage(p => p - 1)}>Prev</Button>
                                    <span className="text-sm font-bold text-slate-600 px-2 text-center bg-white border border-slate-200 py-1 rounded">
                                        {ordersPage} / {totalOrderPages}
                                    </span>
                                    <Button size="sm" variant="outline" disabled={ordersPage >= totalOrderPages} onClick={() => setOrdersPage(p => p + 1)}>Next</Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
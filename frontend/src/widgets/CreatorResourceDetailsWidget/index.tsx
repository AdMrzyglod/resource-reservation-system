import { useState, useRef, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCreatorMapDetails } from '@/features/reservations/hooks/useCreatorMapDetails';
import { useCreatorMapOrders } from '@/features/orders/hooks/useCreatorMapOrders';
import { useCreatorMapUnits } from '@/features/reservations/hooks/useCreatorMapUnits';
import { CreatorOrdersList } from '@/features/orders/components/CreatorOrdersList';
import { CreatorUnitsList } from '@/features/reservations/components/CreatorUnitsList';
import { OrganizerCard } from '@/features/reservations/components/OrganizerCard';

const formatBankAccount = (acc: string) => {
    if (!acc) return "NOT PROVIDED";
    const cleaned = acc.replace(/\s+/g, '');
    if (/^\d{26}$/.test(cleaned)) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4 $5 $6 $7');
    }
    return cleaned.match(/.{1,4}/g)?.join(' ') || acc;
};

export const CreatorResourceDetailsWidget = ({ id }: { id: string }) => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'ORDERS' | 'UNITS'>(() => (sessionStorage.getItem(`crd_tab_${id}`) as any) || 'ORDERS');
    const [highlightedOrderId, setHighlightedOrderId] = useState<number | null>(null);
    const [highlightedUnitId, setHighlightedUnitId] = useState<number | null>(null);

    const [zoom, setZoom] = useState(1);
    const [isDraggingMap, setIsDraggingMap] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const ordersData = useCreatorMapOrders(id, activeTab === 'ORDERS');
    const unitsData = useCreatorMapUnits(id, activeTab === 'UNITS');

    const { mapDetails, wsConnected } = useCreatorMapDetails(id, () => {
        if (activeTab === 'ORDERS') ordersData.fetchOrders();
        if (activeTab === 'UNITS') unitsData.fetchUnits();
    });

    const handleTabChange = (tab: 'ORDERS' | 'UNITS') => {
        setActiveTab(tab);
        sessionStorage.setItem(`crd_tab_${id}`, tab);
        setHighlightedOrderId(null);
        setHighlightedUnitId(null);
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

    if (!mapDetails) return <div className="p-20 text-center animate-pulse text-slate-500">Loading Creator Dashboard...</div>;

    const isClosed = mapDetails.purchase_deadline && new Date(mapDetails.purchase_deadline) < new Date();
    const mapUnitsToRender = mapDetails.units || mapDetails.all_units || [];

    const orderDict: Record<number, any> = {};
    ordersData.orders.forEach((o: any) => {
        o.items.forEach((i: any) => {
            orderDict[i.resource_unit_id] = {
                buyer: o.buyer_name,
                email: o.buyer_email,
                orderId: o.id
            };
        });
    });

    const highlightedOrder = ordersData.orders.find((o: any) => o.id === highlightedOrderId);
    const highlightedUnitIds = highlightedOrder ? highlightedOrder.items.map((i: any) => i.resource_unit_id) : [];

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <Button variant="outline" onClick={() => navigate('/dashboard', { state: { tab: 'RESOURCES' } })} className="hover:bg-slate-100 border-slate-300">← Back to Maps List</Button>
                <div className="flex gap-3">
                    <Button onClick={() => navigate(`/resources/${id}`)} variant="outline" className="border-slate-300 text-slate-700 font-bold px-6">View as Buyer</Button>
                    {!isClosed && (
                        <Button onClick={() => navigate(`/creator/map/${id}/edit`)} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm font-bold px-8">Edit Resource</Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Resource Details</h3>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{mapDetails.description}</p>
                        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Event Schedule</span>
                                <div className="text-sm text-slate-800 space-y-1">
                                    <p><strong className="text-slate-600">Start:</strong> {new Date(mapDetails.event_start_date).toLocaleString()}</p>
                                    <p><strong className="text-slate-600">End:</strong> {new Date(mapDetails.event_end_date).toLocaleString()}</p>
                                </div>
                            </div>
                            {mapDetails.purchase_deadline && (
                                <div>
                                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Purchase Deadline</span>
                                    <div className="text-sm font-medium text-slate-800">
                                        {new Date(mapDetails.purchase_deadline).toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <OrganizerCard snap={mapDetails.creator_snapshot || {}} address={mapDetails.address} />

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="flex justify-between items-center p-3 bg-slate-50 border-b border-slate-100 z-10 shadow-sm">
                            <div className="flex items-center gap-2 px-2">
                                <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-300'}`}></div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {wsConnected ? 'Live Map Viewer' : 'Offline'}
                                </span>
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
                            onMouseDown={handleMapMouseDown}
                            onMouseMove={handleMapMouseMove}
                            onMouseUp={handleMapMouseUp}
                            onMouseLeave={handleMapMouseUp}
                            style={{ cursor: isDraggingMap ? 'grabbing' : 'grab' }}
                        >
                            <div className="relative mx-auto" style={{ width: `${zoom * 100}%` }}>
                                <img src={`${import.meta.env.VITE_API_URL}${mapDetails.image_url}`} alt="Map" className="w-full h-auto block pointer-events-none" draggable={false} />

                                {mapUnitsToRender.map((unit: any) => {
                                    const isHighlighted = highlightedUnitIds.includes(unit.id) || highlightedUnitId === unit.id;
                                    const isAvail = unit.status.toUpperCase() === 'AVAILABLE';
                                    const dynamicDotSize = mapDetails.dot_size * zoom;

                                    let bgColor = '#94a3b8';
                                    if (isHighlighted) bgColor = '#ec4899';
                                    else if (isAvail) bgColor = '#22c55e';
                                    else if (unit.status.toUpperCase() === 'RESERVED') bgColor = '#eab308';
                                    else if (unit.status.toUpperCase() === 'PURCHASED') bgColor = '#ef4444';

                                    let tooltipText = `Unit #${unit.id} (${unit.status.toUpperCase()})`;
                                    if (!isAvail && orderDict[unit.id]) {
                                        tooltipText += `\nOrder #${orderDict[unit.id].orderId}\nBuyer: ${orderDict[unit.id].buyer}\nEmail: ${orderDict[unit.id].email}`;
                                    }

                                    return (
                                        <div
                                            key={unit.id}
                                            title={tooltipText}
                                            className="absolute rounded-full shadow-sm border border-white/50 transition-all hover:scale-125 hover:z-50"
                                            style={{
                                                left: `calc(${unit.x_position}% - ${dynamicDotSize / 2}px)`,
                                                top: `calc(${unit.y_position}% - ${dynamicDotSize / 2}px)`,
                                                width: `${dynamicDotSize}px`,
                                                height: `${dynamicDotSize}px`,
                                                backgroundColor: bgColor,
                                                zIndex: isHighlighted ? 10 : 1,
                                                boxShadow: isHighlighted ? '0 0 0 5px rgba(236, 72, 153, 0.6)' : 'none'
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 p-4 bg-slate-50 border-t border-slate-100 z-10">
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-slate-900 leading-none">{mapDetails.stats.total}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Units</span>
                            </div>

                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-green-600 leading-none">{mapDetails.stats.available}</span>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Available</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-yellow-500 leading-none">{mapDetails.stats.reserved}</span>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reserved</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-red-500 leading-none">{mapDetails.stats.purchased}</span>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bought</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                        <div className="flex border-b border-slate-200">
                            <button onClick={() => handleTabChange('ORDERS')} className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'ORDERS' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>Orders List</button>
                            <button onClick={() => handleTabChange('UNITS')} className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'UNITS' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>All Units List (50/page)</button>
                        </div>

                        {activeTab === 'ORDERS' && (
                            <CreatorOrdersList
                                ordersData={ordersData}
                                highlightedOrderId={highlightedOrderId}
                                setHighlightedOrderId={setHighlightedOrderId}
                                setHighlightedUnitId={setHighlightedUnitId}
                            />
                        )}

                        {activeTab === 'UNITS' && (
                            <CreatorUnitsList
                                unitsData={unitsData}
                                highlightedUnitId={highlightedUnitId}
                                setHighlightedUnitId={setHighlightedUnitId}
                                setHighlightedOrderId={setHighlightedOrderId}
                            />
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-extrabold tracking-widest mb-4 ${isClosed ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-green-700'}`}>
                            {isClosed ? 'SALES CLOSED' : 'OPEN FOR SALES'}
                        </span>

                        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-2">{mapDetails.title}</h1>
                        <span className="block text-xs font-bold uppercase tracking-wider text-indigo-600">{mapDetails.category_name}</span>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-end">
                            <div>
                                <span className="block text-xs font-bold text-slate-400 uppercase">Price per unit</span>
                                <span className="text-3xl font-black text-slate-900">${mapDetails.price}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center animate-in fade-in zoom-in duration-300">
                        <span className="block text-xs font-bold text-slate-400 uppercase mb-2">Total Estimated Revenue</span>
                        <span className="text-4xl font-black text-indigo-600">${mapDetails.stats.revenue?.toFixed(2) || '0.00'}</span>
                        <p className="text-[10px] text-slate-400 mt-2">Sum of all successfully paid orders.</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6 animate-in fade-in zoom-in duration-300">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payout Status</h3>

                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-semibold text-slate-700">Status</span>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${mapDetails.payout_status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {mapDetails.payout_status}
                            </span>
                        </div>

                        {mapDetails.payout_status === 'PAID' && mapDetails.payout && (
                            <div className="pt-4 border-t border-slate-100 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Amount Transferred</span>
                                    <span className="font-black text-green-600 text-lg">${mapDetails.payout.amount}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Account Number</span>
                                    <span className="font-mono text-[11px] text-slate-700 whitespace-nowrap">
                                        {formatBankAccount(mapDetails.payout.account_number)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Date</span>
                                    <span className="text-xs font-medium text-slate-700">
                                        {new Date(mapDetails.payout.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        )}

                        {mapDetails.payout_status === 'PENDING' && (
                            <p className="text-[10px] text-slate-400 leading-tight">
                                Payout will be processed automatically after the purchase deadline passes.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
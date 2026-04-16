import { useState, useRef, type MouseEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrderDetails } from '@/features/orders/hooks/useOrderDetails';
import { Button } from '@/components/ui/button';

export const OrderDetailsWidget = ({ id }: { id: string }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { order, loading } = useOrderDetails(id);

    const fromMap = new URLSearchParams(location.search).get('fromMap');
    const fromCreator = new URLSearchParams(location.search).get('fromCreator');

    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [highlightedUnit, setHighlightedUnit] = useState<number | null>(null);

    const [zoom, setZoom] = useState(1);
    const [isDraggingMap, setIsDraggingMap] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    if (loading || !order) return <div className="p-20 text-center animate-pulse">Loading Order Details...</div>;

    const mapDetails = order.map_details;
    const orderUnitIds = order.items.map((i: any) => i.resource_unit_id);
    const snap = order.user_snapshot || {};
    const hasSnapshot = Object.keys(snap).length > 0;

    const handleBack = () => {
        if (fromCreator) navigate(`/creator/map/${mapDetails?.id}`);
        else if (fromMap) navigate(`/resources/${mapDetails?.id}`);
        else navigate('/dashboard');
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
        const dx = e.pageX - dragStart.x;
        const dy = e.pageY - dragStart.y;
        containerRef.current.scrollLeft = scrollStart.left - dx;
        containerRef.current.scrollTop = scrollStart.top - dy;
    };

    const handleMapMouseUp = () => setIsDraggingMap(false);

    return (
        <div className="max-w-[1200px] mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={handleBack}>← Back</Button>
                    <Button variant="secondary" onClick={() => navigate(`/resources/${mapDetails?.id}`)}>
                        Go to Resource Map
                    </Button>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    order.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                    STATUS: {order.status}
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h1 className="text-4xl font-black text-slate-900 mb-2">Order #{order.id}</h1>
                <p className="text-slate-500 font-medium mb-8">Placed on {new Date(order.created_at).toLocaleString()}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resource Map</span>
                            <div className="text-xl font-bold text-slate-800">{mapDetails?.title || 'Unknown Resource'}</div>
                        </div>
                        <div className="flex gap-10">
                            <div>
                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Price</span>
                                <div className="text-3xl font-black text-indigo-600">${order.total_price}</div>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reserved Units</span>
                                <div className="text-3xl font-black text-slate-800">{order.items.length}</div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Units in this order</span>
                            <div className="flex flex-wrap gap-2">
                                {order.items.map((item: any) => (
                                    <button
                                        key={item.resource_unit_id}
                                        onClick={() => setHighlightedUnit(highlightedUnit === item.resource_unit_id ? null : item.resource_unit_id)}
                                        className={`px-3 py-1 border rounded font-mono text-sm transition-all ${highlightedUnit === item.resource_unit_id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                                    >
                                        ID:{item.resource_unit_id}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3">* Click a unit to highlight it on the map below.</p>
                        </div>
                    </div>

                    {(hasSnapshot || order.status === 'PAID' || order.status === 'FAILED') && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Billing Snapshot</h3>
                            {!hasSnapshot ? (
                                <p className="text-sm text-slate-500">No snapshot recorded for this order.</p>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Buyer</span>
                                        <span className="font-bold text-slate-800 text-sm">
                                            {snap.account_type === 'company' ? snap.company_name : `${snap.first_name} ${snap.last_name}`}
                                        </span>
                                        {snap.account_type === 'company' && <span className="block text-xs text-slate-500">NIP: {snap.tax_id}</span>}
                                    </div>
                                    {snap.address && (
                                        <div>
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Address</span>
                                            <span className="font-medium text-slate-600 text-sm">
                                                {snap.address.street}<br/>{snap.address.postal_code} {snap.address.city}, {snap.address.country}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {mapDetails && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-500">
                    <div className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50" onClick={() => setIsMapExpanded(!isMapExpanded)}>
                        <h3 className="font-bold text-slate-900">Map Visualizer</h3>
                        <div className="flex items-center gap-4">
                            {isMapExpanded && (
                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-1 shadow-sm" onClick={e => e.stopPropagation()}>
                                    <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded text-lg font-bold text-slate-600">-</button>
                                    <span className="text-xs font-bold w-12 text-center text-slate-600">{Math.round(zoom * 100)}%</span>
                                    <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded text-lg font-bold text-slate-600">+</button>
                                </div>
                            )}
                            <Button variant="ghost" className="font-bold text-indigo-600">{isMapExpanded ? 'Hide Map' : 'Show Map'}</Button>
                        </div>
                    </div>

                    {isMapExpanded && (
                        <div className="p-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4">
                            <div
                                ref={containerRef}
                                className="relative w-full h-auto overflow-auto bg-slate-200 custom-scrollbar rounded-xl border border-slate-300 select-none"
                                onMouseDown={handleMapMouseDown}
                                onMouseMove={handleMapMouseMove}
                                onMouseUp={handleMapMouseUp}
                                onMouseLeave={handleMapMouseUp}
                                style={{ cursor: isDraggingMap ? 'grabbing' : 'grab' }}
                            >
                                <div className="relative mx-auto" style={{ width: `${zoom * 100}%` }}>
                                    <img src={`${import.meta.env.VITE_API_URL}${mapDetails.image_url}`} alt="Map" className="w-full h-auto block pointer-events-none" draggable={false} />
                                    {mapDetails.all_units.map((unit: any) => {
                                        const isOurOrder = orderUnitIds.includes(unit.id);
                                        const isHighlighted = highlightedUnit === unit.id;

                                        let bgColor = isOurOrder ? '#4f46e5' : '#facc15';
                                        const dynamicDotSize = mapDetails.dot_size * zoom;

                                        return (
                                            <div
                                                key={unit.id}
                                                title={`Unit #${unit.id}`}
                                                className={`absolute rounded-full shadow-sm border border-white/80 transition-all ${isOurOrder ? 'cursor-pointer hover:scale-125 z-10' : 'opacity-90'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    isOurOrder && setHighlightedUnit(highlightedUnit === unit.id ? null : unit.id);
                                                }}
                                                style={{
                                                    left: `calc(${unit.x_position}% - ${dynamicDotSize/2}px)`,
                                                    top: `calc(${unit.y_position}% - ${dynamicDotSize/2}px)`,
                                                    width: `${dynamicDotSize}px`, height: `${dynamicDotSize}px`,
                                                    backgroundColor: bgColor,
                                                    boxShadow: isHighlighted ? '0 0 0 5px rgba(236, 72, 153, 0.6)' : 'none',
                                                    zIndex: isHighlighted ? 50 : (isOurOrder ? 10 : 1)
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex gap-6 mt-4 justify-center">
                                <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white/50 rounded-full bg-[#4f46e5] shadow-sm"></div><span className="text-xs font-bold text-slate-600">Your Order Units</span></div>
                                <div className="flex items-center gap-2"><div className="w-4 h-4 border border-white/50 rounded-full bg-[#facc15] shadow-sm"></div><span className="text-xs font-bold text-slate-600">Other Units</span></div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
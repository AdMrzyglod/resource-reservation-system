import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../orders.api';
import { Button } from '@/components/ui/button';

export const GroupedMapAccordion = ({
    map,
    renderPageNumbers
}: {
    map: any;
    renderPageNumbers: any;
}) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);

        ordersApi
            .getMyOrders({ map_id: map.id, page, page_size: 5 })
            .then((data) => {
                setOrders(data.results || data);
                setTotalPages(Math.ceil((data.count || 1) / 5));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isOpen, page, map.id]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-4">
            <div
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <img
                        src={`${import.meta.env.VITE_API_URL}${map.image_url}`}
                        alt="Map"
                        className="w-16 h-10 object-cover rounded bg-slate-100"
                    />
                    <h3 className="font-bold text-slate-900 text-lg">
                        {map.title}
                    </h3>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/resources/${map.id}`);
                        }}
                    >
                        View Map
                    </Button>

                    <div className="text-indigo-600 font-bold text-xl w-6 text-center">
                        {isOpen ? '−' : '+'}
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="p-5 border-t border-slate-100 bg-slate-50">
                    {loading && orders.length === 0 ? (
                        <div className="text-center text-xs text-slate-400 py-4 animate-pulse">
                            Loading orders...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center text-xs text-slate-400 py-4">
                            No orders found.
                        </div>
                    ) : (
                        <div
                            className={`space-y-3 transition-opacity duration-200 ${
                                loading
                                    ? 'opacity-50 pointer-events-none'
                                    : 'opacity-100'
                            }`}
                        >
                            {orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-white p-4 border rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 hover:border-indigo-300"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-slate-500 font-bold">
                                                #{order.id}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    order.status === 'PAID'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="text-xs text-slate-500">
                                            {new Date(
                                                order.created_at
                                            ).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <span className="block text-[10px] font-bold uppercase text-slate-400">
                                                Total
                                            </span>
                                            <span className="font-black text-indigo-600">
                                                ${order.total_price}
                                            </span>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                navigate(
                                                    `/orders/${order.id}`
                                                )
                                            }
                                        >
                                            Show Details
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {totalPages > 1 && (
                                <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-4">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={page === 1}
                                        onClick={() =>
                                            setPage((p) => p - 1)
                                        }
                                    >
                                        Prev
                                    </Button>

                                    {renderPageNumbers(
                                        page,
                                        totalPages,
                                        setPage
                                    )}

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={page === totalPages}
                                        onClick={() =>
                                            setPage((p) => p + 1)
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
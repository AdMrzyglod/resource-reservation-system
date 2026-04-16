import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { useGroupedOrders } from '../hooks/useGroupedOrders';
import { GroupedMapAccordion } from './GroupedMapAccordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type OrderStatus = 'PAID' | 'PENDING' | 'CANCELLED' | 'FAILED' | 'EXPIRED';

export const OrdersTab = ({ isActive }: { isActive: boolean }) => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'FLAT' | 'GROUPED'>('FLAT');

    const flat = useOrders(isActive && viewMode === 'FLAT');
    const grouped = useGroupedOrders(isActive && viewMode === 'GROUPED');

    const renderPageNumbers = (
        currentPage: number,
        totalPages: number
    ) => {
        return (
            <div className="text-sm font-bold text-slate-600 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center min-w-[80px]">
                {currentPage} / {totalPages}
            </div>
        );
    };

    if (!isActive) return null;

    return (
        <div className="space-y-6">
            <div className="flex gap-2 mb-6 border-b border-slate-200 pb-4">
                <Button
                    variant={viewMode === 'FLAT' ? 'default' : 'outline'}
                    onClick={() => {
                        setViewMode('FLAT');
                        flat.setPage(1);
                    }}
                    className={viewMode === 'FLAT' ? 'bg-indigo-600' : ''}
                >
                    Flat List
                </Button>

                <Button
                    variant={viewMode === 'GROUPED' ? 'default' : 'outline'}
                    onClick={() => {
                        setViewMode('GROUPED');
                        grouped.setPage(1);
                    }}
                    className={viewMode === 'GROUPED' ? 'bg-indigo-600' : ''}
                >
                    Grouped by Map
                </Button>
            </div>

            {viewMode === 'FLAT' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm items-center">
                        <Input
                            className="w-64 bg-slate-50"
                            placeholder="Search orders..."
                            value={flat.search}
                            onChange={(e) => {
                                flat.setSearch(e.target.value);
                                flat.setPage(1);
                            }}
                        />

                        <select
                            className="h-10 border rounded-lg px-3 bg-slate-50 font-semibold outline-none"
                            value={flat.sort}
                            onChange={(e) => {
                                flat.setSort(e.target.value);
                                flat.setPage(1);
                            }}
                        >
                            <option value="-created_at">Newest First</option>
                            <option value="created_at">Oldest First</option>
                            <option value="-total_price">Highest Amount</option>
                            <option value="total_price">Lowest Amount</option>
                        </select>

                        <div className="flex gap-2">
                            {(['PAID', 'PENDING', 'CANCELLED', 'FAILED', 'EXPIRED'] as OrderStatus[]).map(
                                (s) => (
                                    <label
                                        key={s}
                                        className="flex items-center space-x-1 cursor-pointer bg-slate-50 px-2 py-1.5 rounded-lg hover:bg-slate-100 border border-slate-200"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={flat.filters.includes(s)}
                                            onChange={() => {
                                                flat.setFilters((prev) =>
                                                    prev.includes(s)
                                                        ? prev.filter((x) => x !== s)
                                                        : [...prev, s]
                                                );
                                                flat.setPage(1);
                                            }}
                                            className="rounded text-indigo-600"
                                        />
                                        <span className="text-[10px] font-bold uppercase">
                                            {s}
                                        </span>
                                    </label>
                                )
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {flat.orders.length === 0 && (
                            <div className="p-10 border-2 border-dashed rounded-3xl text-center text-slate-400">
                                No orders found.
                            </div>
                        )}

                        {flat.orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center group hover:border-indigo-300 transition-all"
                            >
                                <div className="flex items-start gap-6 w-full md:w-auto">
                                    <div
                                        className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-black ${
                                            order.status === 'PAID'
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        #{order.id}
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-900 text-lg">
                                            {order.map_title || 'Resource Access'}
                                        </h4>

                                        <p className="text-sm text-slate-500 mb-2">
                                            {new Date(order.created_at).toLocaleString()}
                                        </p>

                                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mt-2">
                                            <span className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                Purchased Units ({order.items.length})
                                            </span>

                                            <div className="flex flex-wrap gap-1">
                                                {order.items.map((item: any) => (
                                                    <span
                                                        key={item.resource_unit_id}
                                                        className="bg-white border border-slate-300 text-slate-700 text-xs font-mono px-2 py-0.5 rounded"
                                                    >
                                                        ID:{item.resource_unit_id}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 mt-6 md:mt-0">
                                    <div className="text-left md:text-right">
                                        <p className="text-xs font-bold text-slate-400 uppercase">
                                            Amount
                                        </p>
                                        <p className="text-xl font-black text-indigo-600">
                                            ${order.total_price}
                                        </p>
                                    </div>

                                    <div className="text-left md:text-right">
                                        <p className="text-xs font-bold text-slate-400 uppercase">
                                            Status
                                        </p>
                                        <p
                                            className={`font-bold uppercase text-sm ${
                                                order.status === 'PAID'
                                                    ? 'text-green-600'
                                                    : 'text-slate-600'
                                            }`}
                                        >
                                            {order.status}
                                        </p>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                    >
                                        Show Details
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                        <Button
                            variant="outline"
                            disabled={flat.page === 1}
                            onClick={() => flat.setPage((p) => p - 1)}
                        >
                            Prev
                        </Button>

                        {flat.totalPages > 0
                            ? renderPageNumbers(flat.page, flat.totalPages)
                            : renderPageNumbers(1, 1)}

                        <Button
                            variant="outline"
                            disabled={flat.page >= flat.totalPages}
                            onClick={() => flat.setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {viewMode === 'GROUPED' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm items-center">
                        <Input
                            className="w-64 bg-slate-50"
                            placeholder="Search maps..."
                            value={grouped.search}
                            onChange={(e) => {
                                grouped.setSearch(e.target.value);
                                grouped.setPage(1);
                            }}
                        />

                        <select
                            className="h-10 border rounded-lg px-3 bg-slate-50 font-semibold outline-none"
                            value={grouped.sort}
                            onChange={(e) => {
                                grouped.setSort(e.target.value);
                                grouped.setPage(1);
                            }}
                        >
                            <option value="title">A-Z</option>
                            <option value="-title">Z-A</option>
                        </select>
                    </div>

                    <div className="grid gap-2">
                        {grouped.maps.length === 0 && (
                            <div className="p-10 border-2 border-dashed rounded-3xl text-center text-slate-400">
                                No maps found.
                            </div>
                        )}

                        {grouped.maps.map((map) => (
                            <GroupedMapAccordion
                                key={map.id}
                                map={map}
                                renderPageNumbers={renderPageNumbers}
                            />
                        ))}
                    </div>

                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                        <Button
                            variant="outline"
                            disabled={grouped.page === 1}
                            onClick={() => grouped.setPage((p) => p - 1)}
                        >
                            Prev Maps
                        </Button>

                        {grouped.totalPages > 0
                            ? renderPageNumbers(grouped.page, grouped.totalPages)
                            : renderPageNumbers(1, 1)}

                        <Button
                            variant="outline"
                            disabled={grouped.page >= grouped.totalPages}
                            onClick={() => grouped.setPage((p) => p + 1)}
                        >
                            Next Maps
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
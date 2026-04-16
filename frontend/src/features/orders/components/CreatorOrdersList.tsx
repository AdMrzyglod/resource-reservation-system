import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface CreatorOrdersListProps {
    ordersData: any;
    highlightedOrderId: number | null;
    setHighlightedOrderId: (id: number | null) => void;
    setHighlightedUnitId: (id: number | null) => void;
}

export const CreatorOrdersList = ({
    ordersData,
    highlightedOrderId,
    setHighlightedOrderId,
    setHighlightedUnitId
}: CreatorOrdersListProps) => {
    const navigate = useNavigate();
    const {
        orders,
        page,
        setPage,
        totalPages,
        statuses,
        setStatuses,
        sortBy,
        setSortBy
    } = ordersData;

    const renderPageNumbers = () => {
        return (
            <div className="text-sm font-bold text-slate-600 px-4 py-2 bg-white border border-slate-200 rounded-lg text-center min-w-[80px]">
                {page} / {totalPages > 0 ? totalPages : 1}
            </div>
        );
    };

    return (
        <div>
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                    {['PAID', 'PENDING', 'CANCELLED', 'FAILED', 'EXPIRED'].map((s) => (
                        <label
                            key={s}
                            className="flex items-center space-x-1 cursor-pointer bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-100"
                        >
                            <input
                                type="checkbox"
                                checked={statuses.includes(s)}
                                onChange={() => {
                                    setStatuses((prev: string[]) =>
                                        prev.includes(s)
                                            ? prev.filter((x) => x !== s)
                                            : [...prev, s]
                                    );
                                    setPage(1);
                                }}
                                className="rounded text-indigo-600 w-3 h-3"
                            />
                            <span className="text-[10px] font-bold uppercase text-slate-600">
                                {s}
                            </span>
                        </label>
                    ))}
                </div>

                <select
                    className="h-8 border border-slate-200 rounded text-xs px-2 font-semibold bg-white text-slate-700 outline-none"
                    value={sortBy}
                    onChange={(e) => {
                        setSortBy(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="-created_at">Newest First</option>
                    <option value="created_at">Oldest First</option>
                    <option value="-total_price">Highest Amount</option>
                    <option value="total_price">Lowest Amount</option>
                </select>
            </div>

            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-white sticky top-0 border-b border-slate-100 shadow-sm">
                        <tr>
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Buyer</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Units</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-8 text-center text-slate-500"
                                >
                                    No orders match criteria.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order: any) => (
                                <tr
                                    key={order.id}
                                    onClick={() => {
                                        setHighlightedOrderId(
                                            highlightedOrderId === order.id
                                                ? null
                                                : order.id
                                        );
                                        setHighlightedUnitId(null);
                                    }}
                                    className={`border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${
                                        highlightedOrderId === order.id
                                            ? 'bg-pink-50'
                                            : 'hover:bg-slate-50/50'
                                    }`}
                                >
                                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                                        #{order.id}
                                        {highlightedOrderId === order.id && (
                                            <span className="block text-[9px] text-pink-600 mt-1">
                                                HIGHLIGHTED
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {order.buyer_name}
                                        <br />
                                        <span className="text-xs text-slate-400 font-normal">
                                            {order.buyer_email}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                order.status === 'PAID'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-200 text-slate-700'
                                            }`}
                                        >
                                            {order.status}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 font-bold text-slate-700">
                                        {order.items.length}
                                    </td>

                                    <td className="px-6 py-4 font-black text-indigo-600">
                                        ${order.total_price}
                                    </td>

                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {new Date(order.created_at).toLocaleString()}
                                    </td>

                                    <td className="px-6 py-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(
                                                    `/orders/${order.id}?fromCreator=true`
                                                );
                                            }}
                                        >
                                            Details
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage((p: number) => p - 1)}
                    >
                        Prev
                    </Button>

                    {renderPageNumbers()}

                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p: number) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};
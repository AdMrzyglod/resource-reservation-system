import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface CreatorUnitsListProps {
    unitsData: any;
    highlightedUnitId: number | null;
    setHighlightedUnitId: (id: number | null) => void;
    setHighlightedOrderId: (id: number | null) => void;
}

export const CreatorUnitsList = ({
    unitsData,
    highlightedUnitId,
    setHighlightedUnitId,
    setHighlightedOrderId
}: CreatorUnitsListProps) => {
    const { units, page, setPage, totalPages } = unitsData;

    const renderPageNumbers = () => {
        return (
            <div className="text-sm font-bold text-slate-600 px-4 py-2 bg-white border border-slate-200 rounded-lg text-center min-w-[80px]">
                {page} / {totalPages > 0 ? totalPages : 1}
            </div>
        );
    };

    return (
        <div>
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                        <tr>
                            <th className="px-6 py-4">Unit ID</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Buyer Name</th>
                            <th className="px-6 py-4">Buyer Email</th>
                            <th className="px-6 py-4">Order ID</th>
                        </tr>
                    </thead>

                    <tbody>
                        {units.map((unit: any) => (
                            <tr
                                key={unit.id}
                                onClick={() => {
                                    setHighlightedUnitId(
                                        highlightedUnitId === unit.id ? null : unit.id
                                    );
                                    setHighlightedOrderId(null);
                                }}
                                className={`border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${
                                    highlightedUnitId === unit.id
                                        ? 'bg-pink-50'
                                        : 'hover:bg-slate-50/50'
                                }`}
                            >
                                <td className="px-6 py-4 font-mono font-bold text-slate-700">
                                    #{unit.id}
                                    {highlightedUnitId === unit.id && (
                                        <span className="block text-[9px] text-pink-600 mt-1">
                                            HIGHLIGHTED
                                        </span>
                                    )}
                                </td>

                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                            unit.status.toUpperCase() === 'AVAILABLE'
                                                ? 'bg-green-100 text-green-700'
                                                : unit.status.toUpperCase() === 'RESERVED'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}
                                    >
                                        {unit.status}
                                    </span>
                                </td>

                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {unit.buyer_name}
                                </td>

                                <td className="px-6 py-4 text-slate-500">
                                    {unit.buyer_email}
                                </td>

                                <td className="px-6 py-4 text-slate-500">
                                    {unit.order_id ? (
                                        <Link
                                            to={`/orders/${unit.order_id}?fromCreator=true`}
                                            className="hover:underline text-indigo-600 font-bold"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            #{unit.order_id}
                                        </Link>
                                    ) : (
                                        '-'
                                    )}
                                </td>
                            </tr>
                        ))}
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
                        Prev 50
                    </Button>

                    {renderPageNumbers()}

                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p: number) => p + 1)}
                    >
                        Next 50
                    </Button>
                </div>
            )}
        </div>
    );
};
import { useNavigate } from 'react-router-dom';
import { usePayouts } from '../hooks/usePayouts';
import { Button } from '@/components/ui/button';

export const PayoutsList = ({ isActive }: { isActive: boolean }) => {
    const navigate = useNavigate();
    const { payouts, page, setPage, totalPages, loading } = usePayouts(isActive);

    const renderPageNumbers = () => {
        const pages = [];

        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <Button
                    key={i}
                    size="sm"
                    variant={page === i ? 'default' : 'outline'}
                    onClick={() => setPage(i)}
                    className={page === i ? 'bg-indigo-600 text-white' : ''}
                >
                    {i}
                </Button>
            );
        }

        return <div className="flex items-center gap-1">{pages}</div>;
    };

    if (!isActive) return null;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
                <div className="flex justify-center py-20 text-slate-400">
                    Loading payouts...
                </div>
            ) : payouts.length === 0 ? (
                <div className="p-20 text-center text-slate-400">
                    You don't have any payouts yet. Payouts are generated automatically when a resource event deadline passes.
                </div>
            ) : (
                <div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 border-b border-slate-100 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4">Payout ID</th>
                                    <th className="px-6 py-4">Resource</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Transfer Date</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {payouts.map((payout) => (
                                    <tr
                                        key={payout.id}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-mono font-bold text-slate-700">
                                            #{payout.id}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {payout.resource_title}
                                        </td>
                                        <td className="px-6 py-4 font-black text-green-600">
                                            ${payout.amount}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(payout.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    navigate(`/creator/map/${payout.resource_id}`)
                                                }
                                            >
                                                Manage Dashboard
                                            </Button>
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
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Prev
                            </Button>

                            {renderPageNumbers()}

                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
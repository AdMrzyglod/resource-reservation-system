import { useNavigate } from 'react-router-dom';
import { useCreatorMaps } from '../hooks/useCreatorMaps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const CreatorMapsList = ({ isActive }: { isActive: boolean }) => {
    const navigate = useNavigate();
    const {
        maps,
        categories,
        loading,
        page,
        setPage,
        totalPages,
        search,
        setSearch,
        sort,
        setSort,
        selectedCategories,
        setSelectedCategories
    } = useCreatorMaps(isActive);

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
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input
                        placeholder="Search your maps..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="lg:col-span-2"
                    />

                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 lg:col-start-4"
                        value={sort}
                        onChange={(e) => {
                            setSort(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="-created_at">Newest First</option>
                        <option value="created_at">Oldest First</option>
                        <option value="price">Price: Low to High</option>
                        <option value="-price">Price: High to Low</option>
                        <option value="title">Alphabetical A-Z</option>
                    </select>
                </div>

                <div>
                    <span className="block text-sm font-semibold text-slate-600 mb-3">
                        Filter by Category:
                    </span>

                    <div className="flex flex-wrap gap-2">
                        {categories.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    setSelectedCategories((prev: any[]) =>
                                        prev.includes(c.id)
                                            ? prev.filter((id) => id !== c.id)
                                            : [...prev, c.id]
                                    );
                                    setPage(1);
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                                    selectedCategories.includes(c.id)
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20 text-slate-400">
                    Loading your resources...
                </div>
            ) : maps.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">
                    You haven't created any resources matching your criteria.
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-6">
                        {maps.map((map: any) => {
                            const isClosed =
                                map.purchase_deadline &&
                                new Date(map.purchase_deadline) < new Date();

                            return (
                                <div
                                    key={map.id}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row group"
                                >
                                    <div className="md:w-1/3 xl:w-1/4 h-56 md:h-auto relative bg-slate-100 overflow-hidden shrink-0">
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}${map.image_url}`}
                                            alt={map.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />

                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-700 shadow-sm">
                                            ${map.price}
                                        </div>

                                        <div
                                            className={`absolute bottom-3 left-3 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                                                isClosed
                                                    ? 'bg-slate-200 text-slate-600'
                                                    : 'bg-green-500 text-white'
                                            }`}
                                        >
                                            {isClosed ? 'Sales Closed' : 'Active'}
                                        </div>
                                    </div>

                                    <div className="p-6 md:p-8 flex flex-col justify-between w-full">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    {map.category_name}
                                                </span>
                                            </div>

                                            <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                                {map.title}
                                            </h3>

                                            <div className="space-y-1">
                                                <p className="text-xs text-slate-400">
                                                    Created on{' '}
                                                    {new Date(
                                                        map.created_at
                                                    ).toLocaleDateString()}
                                                </p>

                                                {map.purchase_deadline && (
                                                    <p
                                                        className={`text-xs font-bold ${
                                                            isClosed
                                                                ? 'text-rose-500'
                                                                : 'text-slate-600'
                                                        }`}
                                                    >
                                                        Deadline:{' '}
                                                        {new Date(
                                                            map.purchase_deadline
                                                        ).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-6 flex flex-col md:flex-row justify-end gap-3">
                                            {!isClosed && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        navigate(
                                                            `/creator/map/${map.id}/edit`
                                                        )
                                                    }
                                                    className="w-full md:w-auto border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold px-6"
                                                >
                                                    Edit Resource
                                                </Button>
                                            )}

                                            <Button
                                                onClick={() =>
                                                    navigate(
                                                        `/creator/map/${map.id}`
                                                    )
                                                }
                                                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-sm px-8 font-bold"
                                            >
                                                Manage Resource
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 mt-10">
                        <Button
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Previous
                        </Button>

                        {totalPages > 0 ? (
                            renderPageNumbers()
                        ) : (
                            <span className="text-sm text-slate-400">1</span>
                        )}

                        <Button
                            variant="outline"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};
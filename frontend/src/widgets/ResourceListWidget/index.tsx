import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMaps } from '@/features/reservations/hooks/useMaps';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/features/auth/hooks/useProfile';
import { useNotification } from '@/context/NotificationContext';

const renderPageNumbers = (currentPage: number, totalPages: number) => {
    return (
        <div className="text-sm font-bold text-slate-600 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center min-w-[80px]">
            {currentPage} / {totalPages}
        </div>
    );
};

export const ResourceListWidget = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const notification = useNotification();
    const { profile } = useProfile();
    const {
        resources, categories, loading,
        search, setSearch,
        selectedCategories, setSelectedCategories,
        sortBy, setSortBy,
        page, setPage, totalPages
    } = useMaps();

    const handleCreateClick = () => {
        if (profile?.is_complete) {
            navigate('/resources/create');
        } else {
            notification?.showNotification("Please complete your profile to create a resource.", 5000, "error");
            navigate('/dashboard', { state: { tab: 'PROFILE' } });
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Browse Resources</h1>
                {user && (
                    <Button onClick={handleCreateClick} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">+ Create New Map</Button>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input placeholder="Search by title..." value={search} onChange={(e) => {setSearch(e.target.value); setPage(1);}} className="lg:col-span-2" />
                    <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 lg:col-start-4" value={sortBy} onChange={(e) => {setSortBy(e.target.value); setPage(1);}}>
                        <option value="-created_at">Newest First</option>
                        <option value="created_at">Oldest First</option>
                        <option value="price">Price: Low to High</option>
                        <option value="-price">Price: High to Low</option>
                        <option value="title">Alphabetical A-Z</option>
                    </select>
                </div>

                <div>
                    <span className="block text-sm font-semibold text-slate-600 mb-3">Filter by Category:</span>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(c => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    setSelectedCategories(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]);
                                    setPage(1);
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${selectedCategories.includes(c.id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20 text-slate-400">Loading resources...</div>
            ) : resources.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">No resources found matching your criteria.</div>
            ) : (
                <>
                    <div className="flex flex-col gap-6">
                        {resources.map(res => (
                            <div key={res.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row group">
                                <div className="md:w-1/3 xl:w-1/4 h-56 md:h-auto relative bg-slate-100 overflow-hidden shrink-0">
                                    <img src={`${import.meta.env.VITE_API_URL}${res.image_url}`} alt={res.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-700 shadow-sm">${res.price}</div>
                                </div>

                                <div className="p-6 md:p-8 flex flex-col justify-between w-full">
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">{res.category_name}</span>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">{res.title}</h3>

                                        <div className="mt-4 space-y-1">
                                            <p className="text-sm text-slate-500">
                                                <span className="font-semibold text-slate-700">Created on: </span>
                                                {new Date(res.created_at).toLocaleDateString()}
                                            </p>
                                            {res.purchase_deadline && (
                                                <p className="text-sm text-slate-500">
                                                    <span className="font-semibold text-slate-700">Deadline: </span>
                                                    {new Date(res.purchase_deadline).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <Link to={`/resources/${res.id}`} className="block w-full md:w-auto">
                                            <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-sm px-8">View Details</Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 mt-10">
                        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                        {totalPages > 0 ? renderPageNumbers(page, totalPages) : renderPageNumbers(1, 1)}
                        <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                </>
            )}
        </div>
    );
};
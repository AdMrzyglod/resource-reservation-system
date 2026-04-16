import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import seatsImage from '@/assets/seats.jpg';

export const HomeWidget = () => {
    return (
        <div className="w-full max-w-5xl space-y-10 text-center">
            <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
                    Resource Management
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
                    Manage your seats, spaces, and resources efficiently with our professional platform.
                </p>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/50 bg-white p-2">
                <img
                    src={seatsImage}
                    alt="Seats Overview"
                    className="w-full h-[300px] sm:h-[450px] object-cover rounded-2xl hover:scale-[1.02] transition-transform duration-700 ease-out"
                />
            </div>

            <div className="pt-4 pb-12">
                <Link to="/list">
                    <Button size="lg" className="w-full sm:w-auto text-lg px-10 py-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all">
                        Go to resource list
                    </Button>
                </Link>
            </div>
        </div>
    );
};
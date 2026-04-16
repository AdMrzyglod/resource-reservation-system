import { HomeWidget } from '@/widgets/HomeWidget';

export default function Home() {
    return (
        <div className="flex-1 w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50 p-4 sm:p-8">
            <HomeWidget />
        </div>
    );
}
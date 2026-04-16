export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-10 w-full mt-auto">
            <div className="w-full px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="flex flex-col space-y-2">
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">ResourceFlow</h2>
                        <p className="text-sm text-slate-400">
                            © {new Date().getFullYear()} All rights reserved.
                        </p>
                    </div>

                    <div className="flex flex-col md:items-end space-y-1 text-sm">
                        <p><span className="font-semibold text-slate-100">City:</span> New York</p>
                        <p><span className="font-semibold text-slate-100">Country:</span> USA</p>
                        <p><span className="font-semibold text-slate-100">Phone:</span> 111-111-1111</p>
                        <p><span className="font-semibold text-slate-100">Email:</span> resourceflow@test.com</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
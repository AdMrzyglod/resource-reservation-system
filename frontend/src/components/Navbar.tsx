import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    const handleLogout = () => {
        auth?.logout();
        closeMenu();
        navigate('/');
    };

    return (
        <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 w-full shadow-sm">
            <div className="w-full px-4 sm:px-6 lg:px-12">
                <div className="flex justify-between items-center h-16">

                    <div className="flex items-center space-x-8">
                        <Link to="/" className="text-2xl font-black text-indigo-600 tracking-tight" onClick={closeMenu}>
                            ResourceFlow
                        </Link>
                        <div className="hidden md:flex space-x-6">
                            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                                Home
                            </Link>
                            <Link to="/list" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                                Resources
                            </Link>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        {auth?.user ? (
                            <>
                                <Link to="/dashboard">
                                    <Button variant="ghost" className="font-bold text-slate-800 hover:text-indigo-600 hover:bg-indigo-50">
                                        Dashboard
                                    </Button>
                                </Link>
                                <span className="text-sm font-medium text-slate-500 border-l pl-4 border-slate-200">
                                    Welcome, <span className="font-bold text-indigo-600">{auth.user.username}</span>
                                </span>
                                <Button variant="outline" className="border-slate-300 hover:bg-slate-100" onClick={handleLogout}>
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost" className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">Login</Button>
                                </Link>
                                <Link to="/register">
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">Sign Up</Button>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="md:hidden flex items-center">
                        <button
                            onClick={toggleMenu}
                            className="text-slate-600 hover:text-indigo-600 focus:outline-none p-2"
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0 top-16 flex flex-col p-4 space-y-4 animate-in slide-in-from-top-2">
                    <Link to="/" className="block px-2 py-2 text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md" onClick={closeMenu}>
                        Home
                    </Link>
                    <Link to="/list" className="block px-2 py-2 text-base font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md" onClick={closeMenu}>
                        Resources
                    </Link>

                    {auth?.user ? (
                        <>
                            <Link to="/dashboard" className="block px-2 py-2 text-base font-bold text-indigo-600 hover:bg-indigo-50 rounded-md" onClick={closeMenu}>
                                Dashboard
                            </Link>
                            <div className="border-t border-slate-100 pt-4 mt-2">
                                <p className="px-2 text-sm text-slate-500 mb-4">
                                    Logged in as <span className="font-bold text-indigo-600">{auth.user.username}</span>
                                </p>
                                <Button variant="outline" className="w-full border-slate-300 justify-center" onClick={handleLogout}>
                                    Logout
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col space-y-3 border-t border-slate-100 pt-4 mt-2">
                            <Link to="/login" onClick={closeMenu}>
                                <Button variant="outline" className="w-full border-slate-300 justify-center">Login</Button>
                            </Link>
                            <Link to="/register" onClick={closeMenu}>
                                <Button className="w-full bg-indigo-600 text-white justify-center hover:bg-indigo-700">Sign Up</Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
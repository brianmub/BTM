import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => navigate('/')}>
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-sm text-white shadow-sm group-hover:scale-110 transition-transform">
                        ⛪
                    </div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                        KingdomConnect
                    </h1>
                </div>

                <div className="hidden md:flex items-center space-x-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    <a href="#features" className="hover:text-primary transition-colors">Features</a>
                    <a href="#demo" className="hover:text-primary transition-colors">How It Works</a>
                </div>

                <div className="flex items-center space-x-2">
                    <Button variant="ghost" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all px-4" onClick={() => navigate('/login')}>
                        Sign In
                    </Button>
                    <Button variant="premium" size="sm" className="hidden sm:inline-flex px-6 h-9 text-[11px] font-bold uppercase tracking-widest rounded-full shadow-md shadow-primary/10" onClick={() => navigate('/signup')}>
                        Get Started
                    </Button>
                </div>
            </div>
        </nav>
    );
}

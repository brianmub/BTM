import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-surface backdrop-blur-lg border-b border-surface-border">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-gradient-premium rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform">
                        ⛪
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight leading-none mb-1">
                            KingdomConnect
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Digital Discipleship</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center space-x-10 text-sm font-bold text-slate-500 uppercase tracking-widest">
                    <a href="#features" className="hover:text-primary transition-colors">Features</a>
                    <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
                    <a href="#demo" className="hover:text-primary transition-colors">Demo</a>
                </div>

                <div className="flex items-center space-x-4">
                    <Button variant="ghost" className="text-slate-600 hover:text-primary" onClick={() => navigate('/login')}>
                        Sign In
                    </Button>
                    <Button variant="premium" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/signup')}>
                        Get Started
                    </Button>
                </div>
            </div>
        </nav>
    );
}

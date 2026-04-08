import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-surface backdrop-blur-lg border-b border-surface-border">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-gradient-premium rounded-xl flex items-center justify-center text-xl shadow-[0_0_20px_rgba(218,41,28,0.3)] group-hover:scale-110 transition-transform">
                        ⛪
                    </div>
                    <div>
                        <h1 className="text-xl font-united italic text-foreground tracking-tighter leading-none">
                            KingdomConnect
                        </h1>
                        <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em] mt-0.5">Ecclesial Logistics</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center space-x-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    <a href="#features" className="hover:text-primary transition-colors">Infrastructure</a>
                    <a href="#pricing" className="hover:text-primary transition-colors">Ledger</a>
                    <a href="#demo" className="hover:text-primary transition-colors">Audit</a>
                </div>

                <div className="flex items-center space-x-4">
                    <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all px-6" onClick={() => navigate('/login')}>
                        Sign In
                    </Button>
                    <Button variant="premium" size="sm" className="hidden sm:inline-flex px-8 h-10 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-full" onClick={() => navigate('/signup')}>
                        Manifest Now
                    </Button>
                </div>
            </div>
        </nav>
    );
}

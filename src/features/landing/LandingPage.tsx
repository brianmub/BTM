import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { GlassBox, Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Smartphone, CreditCard, Award, ArrowRight, CheckCircle2, Sparkles, Zap, Shield } from 'lucide-react';

export function LandingPage() {
    const features = [
        {
            icon: <Smartphone className="w-8 h-8 text-primary" />,
            title: "Mobile-First Experience",
            desc: "QR code check-ins and robust offline mode designed for seamless operations in any environment.",
            badge: "Seamless"
        },
        {
            icon: <CreditCard className="w-8 h-8 text-primary" />,
            title: "Integrated Payments",
            desc: "Instant EcoCash and mobile money integration for zero-friction registration and fee collection.",
            badge: "Automated"
        },
        {
            icon: <Award className="w-8 h-8 text-amber-500" />,
            title: "Digital Recognition",
            desc: "Automated certificates and spiritual growth milestones to celebrate every step of the journey.",
            badge: "Engaging"
        }
    ];

    const plans = [
        {
            name: "Foundation",
            price: "15",
            features: ["Up to 50 participants", "1 active program", "Basic reporting", "Email support"],
            isPopular: false
        },
        {
            name: "Cathedral",
            price: "40",
            features: ["200 participants", "Unlimited programs", "Advanced reporting", "Custom branding", "Priority support"],
            isPopular: true
        },
        {
            name: "Global Impact",
            price: "100",
            features: ["Unlimited participants", "API access", "White-label options", "Dedicated manager", "Custom development"],
            isPopular: false
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans theme-lite">
            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-[100vh] flex flex-col justify-center items-center px-6 pt-32 pb-20 overflow-hidden text-center">
                {/* Immersive Background Elements - Elite Lite Theme */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 bg-slate-50">
                    {/* Softer, More Professional Glowing Elements */}
                    <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px] animate-pulse"></div>
                    <div className="absolute bottom-[5%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-subtle"></div>
                    
                    {/* Perspective Grid Background - Subtle for Light Mode */}
                    <div className="absolute inset-0 opacity-[0.1]" 
                         style={{ backgroundImage: 'linear-gradient(rgba(218, 41, 28, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(218, 41, 28, 0.1) 1px, transparent 1px)', 
                                 backgroundSize: '80px 80px',
                                 perspective: '1200px',
                                 transform: 'rotateX(60deg) translateY(-200px)' }}></div>
                </div>

                <div className="container mx-auto relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="mb-8 inline-flex items-center gap-3 bg-primary/5 border border-primary/10 px-6 py-2 rounded-full backdrop-blur-xl"
                    >
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Now Live: v2.0 Enterprise Release</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-6xl md:text-9xl font-united mb-10 tracking-tighter italic leading-[0.85] text-slate-950"
                    >
                        Digitize Your <br />
                        <span className="text-primary italic">Spiritual</span> Authority
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-xl text-slate-600 mb-16 max-w-2xl mx-auto leading-relaxed font-bold uppercase tracking-widest opacity-90"
                    >
                        Command your ministry with absolute precision. Unified check-ins, automated ledger processing, and global participant tracking.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="grid sm:flex gap-6 justify-center items-center"
                    >
                        <Button size="lg" variant="premium" className="px-12 h-20 text-lg font-black uppercase tracking-widest shadow-[0_20px_50px_-12px_rgba(218,41,28,0.4)] hover:scale-105 active:scale-95 transition-all" onClick={() => window.location.href = '/signup'}>
                            Enforce Digital Scale <ArrowRight className="ml-3 w-6 h-6" />
                        </Button>
                        <a href="#demo" className="contents">
                            <Button size="lg" variant="outline" className="px-12 h-20 text-lg font-black uppercase tracking-widest border-primary/10 bg-white shadow-xl shadow-primary/5 hover:bg-white hover:border-primary/50 transition-all font-united text-slate-900">
                                Audit Demo
                            </Button>
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid - Glass Lite Style */}
            <section id="features" className="py-40 relative px-6 bg-white border-y border-slate-100">
                <div className="container mx-auto text-center">
                    <div className="text-center mb-32 max-w-3xl mx-auto">
                        <div className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-4">Core Infrastructure</div>
                        <h2 className="text-5xl md:text-6xl font-united mb-8 tracking-tighter italic text-slate-950 text-center">Engineered for Dominance</h2>
                        <p className="text-slate-500 text-lg font-bold uppercase tracking-widest opacity-80 text-center">High-performance tools for modern church administration and participant growth tracking.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-10 text-left">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                            >
                                <div className="glass-lite p-12 h-full group hover:border-primary/50 hover:bg-white transition-all duration-500 rounded-[3rem] border border-slate-200/50">
                                    <div className="bg-primary/5 w-20 h-20 rounded-3xl flex items-center justify-center mb-10 group-hover:bg-primary/10 group-hover:scale-110 transition-all shadow-2xl shadow-primary/5">
                                        {f.icon}
                                    </div>
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6">{f.badge} Audit</div>
                                    <h3 className="text-3xl font-united mb-6 tracking-tighter italic text-slate-900">{f.title}</h3>
                                    <p className="text-slate-500 leading-relaxed font-bold uppercase text-xs tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof Section (Demo) - Elite Elite Accents */}
            <section id="demo" className="py-40 bg-slate-50 relative border-b border-slate-100">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="lg:w-1/2 text-left">
                            <h2 className="text-5xl md:text-6xl font-united mb-12 tracking-tighter leading-[0.9] italic text-slate-950">
                                Continental Standard for <span className="text-primary">Ministry Logistics</span>
                            </h2>
                            <div className="space-y-10">
                                {[
                                    { icon: <Zap className="text-primary" />, title: "Instant Infrastructure", desc: "Deploy your entire ministry network and session tracking in less than 300 seconds." },
                                    { icon: <Shield className="text-primary" />, title: "Ecclesial Intelligence", desc: "Bank-grade ledger encryption for all financial records and participant confidentiality." }
                                ].map((item, i) => (
                                    <div key={i} className="flex space-x-8 group">
                                        <div className="flex-shrink-0 w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-200 group-hover:border-primary/40 transition-colors shadow-xl shadow-slate-900/5">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-united italic mb-3 tracking-tighter text-slate-900 group-hover:text-primary transition-colors">{item.title}</h4>
                                            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest leading-relaxed opacity-90">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative group">
                            <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
                            <div className="relative z-10 glass-lite p-4 rounded-[3rem] overflow-hidden group-hover:scale-[1.02] transition-transform duration-700 border border-slate-200 shadow-2xl shadow-slate-900/5">
                                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(15,23,42,0.1)]">
                                    <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-6 space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                                        <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                        <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                        <div className="flex-1 text-center font-black text-[9px] text-slate-400 uppercase tracking-widest pl-10">ADMIN_PANEL_ENCRYPTED_SESSION</div>
                                    </div>
                                    <div className="p-8 grid grid-cols-4 gap-8 h-80 bg-white text-left">
                                        <div className="col-span-1 border-r border-slate-100 pr-6 space-y-4 hidden sm:block">
                                            <div className="h-2.5 w-2/3 bg-primary/10 rounded animate-pulse"></div>
                                            <div className="h-2.5 w-full bg-slate-100 rounded"></div>
                                            <div className="h-2.5 w-3/4 bg-slate-100 rounded"></div>
                                            <div className="h-2.5 w-5/6 bg-slate-100 rounded"></div>
                                        </div>
                                        <div className="col-span-3 space-y-6">
                                            <div className="flex gap-4">
                                                <div className="h-24 w-1/3 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-center">
                                                    <div className="h-10 w-10 bg-primary/10 rounded-full animate-bounce"></div>
                                                </div>
                                                <div className="h-24 w-1/3 bg-slate-50 border border-slate-200 rounded-2xl"></div>
                                                <div className="h-24 w-1/3 bg-slate-50 border border-slate-200 rounded-2xl"></div>
                                            </div>
                                            <div className="h-40 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden p-6 text-left">
                                                <div className="h-2 w-1/3 bg-slate-200 rounded mb-4"></div>
                                                <div className="h-2 w-1/2 bg-slate-200 rounded mb-4"></div>
                                                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-primary/5 to-transparent"></div>
                                                <svg className="absolute bottom-0 left-0 w-full h-32 text-primary/10" viewBox="0 0 100 40" preserveAspectRatio="none">
                                                    <path d="M0,40 Q25,35 50,20 T100,10 V40 H0 Z" fill="currentColor" />
                                                    <path d="M0,40 Q25,35 50,20 T100,10" fill="none" stroke="currentColor" strokeWidth="1" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing - United Red on White Background */}
            <section id="pricing" className="py-40 px-6 bg-white relative">
                <div className="container mx-auto text-center">
                    <div className="text-center mb-32">
                        <div className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-4">Investment Roadmap</div>
                        <h2 className="text-5xl md:text-7xl font-united italic tracking-tighter text-slate-950">Global Scaling Options</h2>
                    </div>
                    
                    <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
                        {plans.map((p, i) => (
                            <div key={i} className={`flex flex-col p-12 h-full transition-all duration-500 rounded-[3rem] ${p.isPopular ? 'bg-primary/5 border-2 border-primary/30 shadow-[0_32px_64px_-16px_rgba(218,41,28,0.15)]' : 'glass-lite border border-slate-200 hover:border-primary/20'}`}>
                                {p.isPopular && (
                                    <div className="bg-primary text-white text-[10px] font-black px-6 py-2 rounded-full w-fit mb-10 tracking-[0.4em] uppercase shadow-lg shadow-primary/20">Most Vetted Choice</div>
                                )}
                                <h3 className="text-3xl font-united italic text-slate-900 mb-4 tracking-tighter">{p.name}</h3>
                                <div className="flex items-baseline mb-12">
                                    <span className="text-7xl font-united tracking-tighter text-slate-950">${p.price}</span>
                                    <span className="text-slate-400 ml-3 font-black uppercase text-[10px] tracking-widest opacity-60">monthly asset</span>
                                </div>
                                <ul className="space-y-6 mb-16 flex-1">
                                    {p.features.map((feat, j) => (
                                        <li key={j} className="flex items-center text-slate-600 font-bold text-[11px] uppercase tracking-widest leading-relaxed">
                                            <CheckCircle2 className="w-4 h-4 text-primary mr-5 flex-shrink-0" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                                <Button variant={p.isPopular ? 'premium' : 'outline'} className={`w-full h-18 text-[11px] font-black uppercase tracking-widest rounded-2xl ${!p.isPopular ? 'border-slate-200 text-slate-900 hover:bg-slate-50' : ''}`}>
                                    Initialize Plan
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA - Bold United Red Lite */}
            <section className="py-52 relative overflow-hidden bg-slate-50 text-center">
                <div className="absolute inset-0 bg-primary/10 opacity-30 blur-[160px] animate-pulse"></div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-6xl md:text-9xl font-united italic mb-16 tracking-tighter leading-none uppercase text-slate-950">Ready to <span className="text-primary italic">Manifest</span>?</h2>
                    <Button size="lg" variant="premium" className="px-20 h-24 text-2xl font-black uppercase tracking-[0.2em] shadow-[0_20px_60px_-10px_rgba(218,41,28,0.5)] rounded-full hover:scale-105 active:scale-95 transition-all">
                        Execute Access Now
                    </Button>
                </div>
            </section>

            {/* Footer - Minimalist Lite */}
            <footer className="py-24 border-t border-slate-200 bg-white px-6 text-center">
                <div className="container mx-auto text-center">
                    <div className="flex items-center justify-center space-x-4 mb-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                        <div className="text-4xl text-primary italic font-black">KC</div>
                        <h2 className="text-2xl font-united italic text-slate-900 tracking-widest">KINGDOMCONNECT</h2>
                    </div>
                    <div className="flex justify-center space-x-16 mb-16 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
                        <a href="#" className="hover:text-primary transition-colors">Privacy_Ledger</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Global_Terms</a>
                        <a href="#" className="hover:text-primary transition-colors">Audit_Support</a>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
                        © 2026 Kingdom Connect Logistics. Crafted by Etechzim Excellence.
                    </div>
                </div>
            </footer>
        </div>
    );
}



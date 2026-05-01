import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { GlassBox, Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Smartphone, CreditCard, Award, ArrowRight, CheckCircle2, Zap, Shield, Users, Activity, Globe } from 'lucide-react';

export function LandingPage() {
    const features = [
        {
            icon: <Smartphone className="w-10 h-10 text-primary" />,
            title: "Mobile-First Experience",
            desc: "QR code check-ins and robust offline mode designed for seamless operations in any environment.",
            badge: "Seamless"
        },
        {
            icon: <CreditCard className="w-10 h-10 text-primary" />,
            title: "Automated Payments",
            desc: "Integrated mobile money for simple registration and transparent fund collection.",
            badge: "Efficiency"
        },
        {
            icon: <Award className="w-10 h-10 text-amber-500" />,
            title: "Member Growth",
            desc: "Track milestones and celebrate spiritual progress with automated digital certificates.",
            badge: "Engagement"
        }
    ];


    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans theme-lite">
            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-[100vh] flex flex-col justify-center items-center px-6 pt-32 pb-20 overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 bg-slate-50">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                            opacity: [0.05, 0.1, 0.05]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[160px]"
                    ></motion.div>
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.3, 1],
                            opacity: [0.08, 0.15, 0.08]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px]"
                    ></motion.div>
                    
                    <div className="absolute inset-0 opacity-[0.05]" 
                         style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(218, 41, 28, 0.15) 1px, transparent 0)', 
                                 backgroundSize: '40px 40px' }}></div>
                </div>

                <div className="max-w-[1400px] mx-auto relative z-10 text-center">

                    <motion.h1
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-[1.1] text-slate-950"
                    >
                        Modernize Your <br />
                        <span className="text-primary">Ministry Operations</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
                    >
                        Streamline your ministry with precision tools. Unified check-ins, automated digital ledger, and seamless participant management.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="grid sm:flex gap-4 justify-center items-center relative"
                    >
                        <Button size="lg" variant="premium" className="px-10 h-16 text-base font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 hover:shadow-primary/30 active:scale-95 transition-all group" onClick={() => window.location.href = '/signup'}>
                            Get Started <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <a href="#demo" className="contents">
                            <Button size="lg" variant="outline" className="px-10 h-16 text-base font-bold uppercase tracking-widest border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all text-slate-900">
                                See How It Works
                            </Button>
                        </a>

                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 relative px-6 bg-white overflow-hidden">
                {/* Subtle side glow */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[100px] rounded-full"></div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[100px] rounded-full"></div>
                <div className="max-w-[1400px] mx-auto text-center">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <div className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-4">Core Infrastructure</div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-slate-950 text-center">Built for Modern Ministries</h2>
                        <p className="text-slate-500 text-lg font-medium opacity-80 text-center">Powerful tools designed to simplify administration and focus on community growth.</p>
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
                                <div className="glass-lite p-10 h-full group hover:bg-white hover:border-primary/40 hover:-translate-y-2 transition-all duration-500 rounded-[2.5rem] border border-slate-200/50 shadow-sm hover:shadow-2xl hover:shadow-primary/5">
                                    <div className="bg-primary/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:rotate-[10deg] transition-all shadow-lg shadow-primary/5">
                                        <div className="group-hover:text-white transition-colors">
                                            {f.icon}
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                                        {f.badge}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 tracking-tight text-slate-900">{f.title}</h3>
                                    <p className="text-slate-500 leading-relaxed font-medium text-sm group-hover:text-slate-600 transition-colors">{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof Section (Demo) - Elite Elite Accents */}
            <section id="demo" className="py-24 bg-slate-50 relative border-b border-slate-100">
                <div className="max-w-[1400px] mx-auto px-6 text-center">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2 text-left">
                            <h2 className="text-4xl md:text-5xl font-bold mb-10 tracking-tight leading-[1.1] text-slate-950">
                                Professional Standards for <span className="text-primary">Your Ministry</span>
                            </h2>
                            <div className="space-y-8">
                                {[
                                    { icon: <Zap className="text-primary" />, title: "Instant Setup", desc: "Deploy your entire ministry network and session tracking in minutes." },
                                    { icon: <Shield className="text-primary" />, title: "Secure Operations", desc: "Bank-grade encryption for all financial records and member confidentiality." }
                                ].map((item, i) => (
                                    <div key={i} className="flex space-x-6 group">
                                        <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-slate-200 group-hover:border-primary/40 transition-colors shadow-lg shadow-slate-900/5">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2 tracking-tight text-slate-900 group-hover:text-primary transition-colors">{item.title}</h4>
                                            <p className="text-slate-500 font-medium text-sm leading-relaxed opacity-90">{item.desc}</p>
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


            {/* CTA Section */}
            <section className="py-32 relative overflow-hidden bg-slate-950 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-slate-950 to-primary/10"></div>
                {/* Animated pattern for CTA */}
                <div className="absolute inset-0 opacity-[0.03] scale-150 rotate-12" 
                     style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)', 
                             backgroundSize: '40px 40px' }}></div>
                
                <div className="max-w-[1400px] mx-auto px-6 text-center relative z-10">
                    <motion.h2 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="text-5xl md:text-7xl font-bold mb-12 tracking-tight leading-none text-white"
                    >
                        Ready to <span className="text-primary">Grow Your Ministry</span>?
                    </motion.h2>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button size="lg" variant="premium" className="px-16 h-20 text-xl font-bold uppercase tracking-widest shadow-2xl shadow-primary/40 rounded-full hover:shadow-primary/60 transition-all" onClick={() => window.location.href = '/signup'}>
                            Register Now
                        </Button>
                    </motion.div>
                    <p className="mt-8 text-slate-400 text-sm font-medium tracking-widest uppercase">No setup fees. No long-term contracts.</p>
                </div>
            </section>

            {/* Footer - Minimalist Lite */}
            <footer className="py-24 border-t border-slate-200 bg-white px-6 text-center">
                <div className="max-w-[1400px] mx-auto text-center">
                    <div className="flex items-center justify-center space-x-4 mb-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                        <div className="text-4xl text-primary italic font-black">KC</div>
                        <h2 className="text-2xl font-united italic text-slate-900 tracking-widest">KINGDOMCONNECT</h2>
                    </div>
                    <div className="flex justify-center space-x-12 mb-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <a href="/data-deletion" className="hover:text-primary transition-colors">Data Deletion</a>
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
                        © 2026 Kingdom Connect Logistics. Crafted by Etechzim Excellence.
                    </div>
                </div>
            </footer>
        </div>
    );
}



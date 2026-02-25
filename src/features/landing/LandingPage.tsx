import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { GlassBox, Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Smartphone, CreditCard, Award, ArrowRight, CheckCircle2, Sparkles, Zap, Shield } from 'lucide-react';

export function LandingPage() {
    const features = [
        {
            icon: <Smartphone className="w-8 h-8 text-indigo-400" />,
            title: "Mobile-First Experience",
            desc: "QR code check-ins and robust offline mode designed for seamless operations in any environment.",
            badge: "Seamless"
        },
        {
            icon: <CreditCard className="w-8 h-8 text-pink-400" />,
            title: "Integrated Payments",
            desc: "Instant EcoCash and mobile money integration for zero-friction registration and fee collection.",
            badge: "Automated"
        },
        {
            icon: <Award className="w-8 h-8 text-amber-400" />,
            title: "Digital Recognition",
            desc: "Automated certificates and spiritual growth milestones to celebrate every step of the journey.",
            badge: "Engaging"
        }
    ];

    const plans = [
        {
            name: "Starter",
            price: "15",
            features: ["Up to 50 participants", "1 active program", "Basic reporting", "Email support"],
            isPopular: false
        },
        {
            name: "Professional",
            price: "40",
            features: ["200 participants", "Unlimited programs", "Advanced reporting", "Custom branding", "Priority support"],
            isPopular: true
        },
        {
            name: "Enterprise",
            price: "100",
            features: ["Unlimited participants", "API access", "White-label options", "Dedicated manager", "Custom development"],
            isPopular: false
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-6 pt-32 pb-20">
                {/* Immersive Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-subtle"></div>
                    <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-pink-500/10 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-blue-500/5 rounded-full blur-[100px]"></div>
                </div>

                <div className="container mx-auto relative z-10">
                    <div className="max-w-5xl mx-auto text-center">

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-5xl md:text-8xl font-black text-white mb-10 tracking-tighter leading-[0.9] uppercase"
                        >
                            Revolutionize Your <br />
                            Digital Ministry
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-lg md:text-xl text-slate-400 mb-16 max-w-2xl mx-auto leading-relaxed font-bold uppercase tracking-wide"
                        >
                            Empower your discipleship journey with automated check-ins, seamless payments, and spiritual growth gamification.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="grid sm:flex gap-6 justify-center items-center"
                        >
                            <Button size="lg" variant="premium" className="px-12 h-18 text-lg font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/40" onClick={() => window.location.href = '/signup'}>
                                Start Free Trial <ArrowRight className="ml-3 w-6 h-6" />
                            </Button>
                            <a href="#demo" className="contents">
                                <Button size="lg" variant="outline" className="px-12 h-18 text-lg font-black uppercase tracking-widest border-white/10 bg-white/5 backdrop-blur-lg hover:bg-white/10 transition-all">
                                    Watch Demo
                                </Button>
                            </a>
                        </motion.div>
                    </div>
                </div>


            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 relative px-6">
                <div className="container mx-auto">
                    <div className="text-center mb-24 max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Built for Impact</h2>
                        <p className="text-slate-400 text-lg font-medium">Everything you need to manage membership classes and leadership training in the palm of your hand.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-10">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                            >
                                <GlassBox className="h-full group hover:bg-white/10 transition-colors border-white/5 hover:border-white/20">
                                    <div className="bg-slate-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                        {f.icon}
                                    </div>
                                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">{f.badge}</div>
                                    <h3 className="text-2xl font-bold text-white mb-4 leading-tight">{f.title}</h3>
                                    <p className="text-slate-400 leading-relaxed font-medium">{f.desc}</p>
                                </GlassBox>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof Section (Demo) */}
            <section id="demo" className="py-32 bg-slate-900/30 relative">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-10 tracking-tight leading-tight">
                                Trusted by Leading Ministries Across the Continent
                            </h2>
                            <div className="space-y-8">
                                {[
                                    { icon: <Zap className="text-indigo-400" />, title: "Instant Infrastructure", desc: "Deploy your entire church program portal in less than 5 minutes." },
                                    { icon: <Shield className="text-pink-400" />, title: "Enterprise Security", desc: "Bank-grade encryption for all member data and financial transactions." }
                                ].map((item, i) => (
                                    <div key={i} className="flex space-x-6">
                                        <div className="flex-shrink-0 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                                            <p className="text-slate-400 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full"></div>
                            <Card className="relative z-10 p-2 bg-white/5 border-white/10 overflow-hidden">
                                <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl">
                                    <div className="h-8 bg-slate-800/50 border-b border-slate-700/50 flex items-center px-4 space-x-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20"></div>
                                    </div>
                                    <div className="p-4 grid grid-cols-4 gap-4 h-64">
                                        <div className="col-span-1 border-r border-slate-700/30 pr-4 space-y-3 hidden sm:block">
                                            <div className="h-2 w-2/3 bg-slate-700/50 rounded animate-pulse"></div>
                                            <div className="h-2 w-full bg-slate-800 rounded"></div>
                                            <div className="h-2 w-3/4 bg-slate-800 rounded"></div>
                                            <div className="h-2 w-5/6 bg-slate-800 rounded"></div>
                                        </div>
                                        <div className="col-span-3 space-y-4">
                                            <div className="flex gap-3">
                                                <div className="h-20 w-1/3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg"></div>
                                                <div className="h-20 w-1/3 bg-pink-500/10 border border-pink-500/20 rounded-lg"></div>
                                                <div className="h-20 w-1/3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"></div>
                                            </div>
                                            <div className="h-32 bg-slate-800/30 rounded-lg border border-slate-700/30 relative overflow-hidden">
                                                <div className="absolute inset-0 flex items-end">
                                                    <div className="w-full h-24 bg-gradient-to-t from-indigo-500/10 to-transparent"></div>
                                                </div>
                                                <svg className="absolute bottom-0 left-0 w-full h-full text-indigo-500/50" viewBox="0 0 100 40" preserveAspectRatio="none">
                                                    <path d="M0,40 Q25,35 50,20 T100,10 V40 H0 Z" fill="currentColor" />
                                                    <path d="M0,40 Q25,35 50,20 T100,10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-32 px-6">
                <div className="container mx-auto">
                    <div className="text-center mb-24 uppercase tracking-[0.3em] font-black text-slate-500 text-sm">Investment for growth</div>
                    <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((p, i) => (
                            <Card key={i} className={`flex flex-col p-12 h-full ${p.isPopular ? 'bg-indigo-600/10 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'bg-white/5 border-white/10'}`}>
                                {p.isPopular && (
                                    <div className="bg-indigo-500 text-white text-[10px] font-black px-4 py-1 rounded-full w-fit mb-8 tracking-[0.2em] uppercase">Most Professional</div>
                                )}
                                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{p.name}</h3>
                                <div className="flex items-baseline mb-12">
                                    <span className="text-6xl font-black text-white">${p.price}</span>
                                    <span className="text-slate-500 ml-2 font-bold uppercase text-xs tracking-widest">/mo</span>
                                </div>
                                <ul className="space-y-6 mb-12 flex-1">
                                    {p.features.map((feat, j) => (
                                        <li key={j} className="flex items-center text-slate-400 font-bold text-sm">
                                            <CheckCircle2 className="w-5 h-5 text-indigo-400 mr-4 flex-shrink-0" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                                <Button variant={p.isPopular ? 'premium' : 'outline'} className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10">
                                    Choose Plan
                                </Button>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-40 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-premium opacity-10"></div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter">Ready to digitize?</h2>
                    <Button size="lg" variant="premium" className="px-16 h-20 text-xl font-black shadow-2xl shadow-indigo-500/40">
                        Get Started Now
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 bg-slate-950 px-6">
                <div className="container mx-auto text-center">
                    <div className="flex items-center justify-center space-x-3 mb-10 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <div className="text-3xl text-indigo-400 italic font-black">CP</div>
                        <h2 className="text-xl font-bold text-white tracking-widest">KINGDOMCONNECT</h2>
                    </div>
                    <div className="flex justify-center space-x-12 mb-12 text-xs font-black uppercase tracking-widest text-slate-500">
                        <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
                        <a href="#" className="hover:text-indigo-400 transition-colors">Support</a>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        © 2026 Etechzim. Crafted with excellence.
                    </div>
                </div>
            </footer>
        </div>
    );
}

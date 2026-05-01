import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import {
    Activity,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Database,
    FileCheck2,
    Globe,
    Layers3,
    Lock,
    MessageCircle,
    QrCode,
    Shield,
    Smartphone,
    Sparkles,
    Users,
    Zap,
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 26 },
    show: { opacity: 1, y: 0 },
};

const stats = [
    { label: 'Active Members', value: '12,840', note: '+18% growth', icon: Users },
    { label: 'Sessions Tracked', value: '48,290', note: 'real-time logs', icon: Activity },
    { label: 'Payments Posted', value: '$92k', note: 'auto-ledger', icon: CreditCard },
];

const pillars = [
    {
        icon: Layers3,
        title: 'Smart Administration',
        desc: 'Multi-tenant organization setup, scalable programs, class groups, attendance rules, facilitator access, and reporting workflows.',
        badges: ['Multi-Tenant', 'Program Scaling', 'Role-Based'],
        featured: true,
    },
    {
        icon: Smartphone,
        title: 'Mobile Engagement',
        desc: 'Member onboarding, QR check-ins, assignments, reminders, progress tracking, and offline-first mobile experiences.',
        badges: ['Offline-Ready', 'QR Check-in', 'Assignments'],
    },
    {
        icon: FileCheck2,
        title: 'Financial Integrity',
        desc: 'Mobile money collections, transparent receipts, automated ledgers, payment verification, and clean finance reports.',
        badges: ['Mobile Money', 'Auto Ledger', 'Audit Trail'],
    },
];

const journey = [
    'Organization Setup',
    'Program Launch',
    'Member Mobile Onboarding',
    'Real-time Analytics',
];

const roles = [
    {
        title: 'Leadership',
        icon: BarChart3,
        desc: 'See attendance, payments, completion rates, program performance, and member growth in one executive dashboard.',
        points: ['Decision-ready reports', 'Branch-level visibility', 'Growth and retention insights'],
    },
    {
        title: 'Facilitators',
        icon: CheckCircle2,
        desc: 'Manage session attendance, assignment confirmations, class lists, and participant progress without paperwork.',
        points: ['Fast QR attendance', 'Cleaner logistics', 'Progress confirmations'],
    },
    {
        title: 'Members',
        icon: MessageCircle,
        desc: 'Register, pay, check in, submit assignments, track spiritual growth milestones, and receive updates from mobile.',
        points: ['Simple mobile experience', 'Payment history', 'Growth milestones'],
    },
];

const trustBadges = [
    { icon: Shield, title: 'Encrypted Records', desc: 'Protect participant data, finance records, and ministry activity logs.' },
    { icon: Lock, title: 'Self-Service Data Deletion', desc: 'Transparent control for compliance, privacy, and data sovereignty.' },
    { icon: Globe, title: 'Reliable Cloud Infrastructure', desc: 'Built for multi-location teams, scale, uptime, and controlled access.' },
    { icon: Database, title: 'Audit-Ready Ledger', desc: 'Every payment and record action remains traceable and reportable.' },
];

function StatCard({ label, value, note, icon: Icon }: (typeof stats)[number]) {
    return (
        <motion.div
            variants={fadeUp}
            className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl"
        >
            <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-[0.24em]">{label}</span>
                <Icon className="h-4 w-4 text-violet-600" />
            </div>
            <div className="mt-4 text-3xl font-black tracking-tight text-slate-950">{value}</div>
            <div className="mt-1 text-xs font-bold text-emerald-500">{note}</div>
        </motion.div>
    );
}

function AdminPreview() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="relative mx-auto w-full max-w-[720px]"
        >
            <div className="absolute -left-8 top-16 hidden h-32 w-32 rounded-full bg-violet-500/20 blur-3xl lg:block" />
            <div className="absolute -right-10 bottom-8 hidden h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl lg:block" />

            <div className="relative rounded-[2rem] border border-white/70 bg-white/80 p-3 shadow-[0_35px_120px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
                <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white">
                    <div className="flex h-12 items-center gap-2 border-b border-slate-100 bg-slate-50 px-5">
                        <span className="h-3 w-3 rounded-full bg-rose-400" />
                        <span className="h-3 w-3 rounded-full bg-amber-400" />
                        <span className="h-3 w-3 rounded-full bg-emerald-400" />
                        <span className="ml-4 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Command Center</span>
                    </div>

                    <div className="grid gap-5 p-5 md:grid-cols-[0.8fr_1.2fr]">
                        <div className="space-y-4 rounded-3xl bg-slate-950 p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Program</p>
                                    <h3 className="mt-2 text-xl font-black">BTM 2026</h3>
                                </div>
                                <Sparkles className="h-6 w-6 text-fuchsia-300" />
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4">
                                <div className="flex items-center justify-between text-xs font-bold text-white/70">
                                    <span>Completion Rate</span>
                                    <span>76%</span>
                                </div>
                                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                                    <motion.div
                                        initial={{ width: '18%' }}
                                        animate={{ width: '76%' }}
                                        transition={{ duration: 1.4, repeat: Infinity, repeatType: 'reverse' }}
                                        className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-white/10 p-4">
                                    <p className="text-[10px] text-white/40">Classes</p>
                                    <p className="mt-1 text-2xl font-black">24</p>
                                </div>
                                <div className="rounded-2xl bg-white/10 p-4">
                                    <p className="text-[10px] text-white/40">Facilitators</p>
                                    <p className="mt-1 text-2xl font-black">18</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                {stats.map((item) => (
                                    <StatCard key={item.label} {...item} />
                                ))}
                            </div>
                            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-black text-slate-950">Total Members Growth</h4>
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-600">LIVE</span>
                                </div>
                                <div className="mt-6 flex h-28 items-end gap-3">
                                    {[42, 58, 46, 68, 62, 86, 74, 96].map((height, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ height: 18 }}
                                            animate={{ height }}
                                            transition={{ duration: 1.1, delay: index * 0.08, repeat: Infinity, repeatType: 'reverse' }}
                                            className="flex-1 rounded-t-2xl bg-gradient-to-t from-violet-600 to-fuchsia-400"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.55 }}
                className="absolute -bottom-8 -right-4 hidden w-44 rounded-[2rem] border border-slate-200 bg-slate-950 p-3 shadow-2xl md:block"
            >
                <div className="rounded-[1.5rem] bg-white p-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <QrCode className="h-9 w-9" />
                    </div>
                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">QR Check-in</p>
                    <p className="mt-1 text-xl font-black text-slate-950">142 Today</p>
                </div>
            </motion.div>
        </motion.div>
    );
}

export function LandingPage() {
    return (
        <div className="min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-950 font-sans">
            <Navbar />

            <section className="relative px-6 pb-24 pt-36 lg:pb-32 lg:pt-40">
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute left-[-12%] top-[-18%] h-[520px] w-[520px] rounded-full bg-violet-300/25 blur-[120px]" />
                    <div className="absolute right-[-10%] top-[8%] h-[460px] w-[460px] rounded-full bg-fuchsia-300/20 blur-[130px]" />
                    <div className="absolute inset-0 opacity-[0.45]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.18) 1px, transparent 0)', backgroundSize: '34px 34px' }} />
                </div>

                <div className="mx-auto grid max-w-[1440px] items-center gap-2 lg:grid-cols-[0.92fr_1.08fr]">
                    <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.12 }} className="text-left">
                        <motion.h1 variants={fadeUp} className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.06em] text-slate-950 md:text-7xl xl:text-8xl">
                            Modernize Your <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">Ministry Operations.</span>
                        </motion.h1>

                        <motion.p variants={fadeUp} className="mt-8 max-w-2xl text-lg font-medium leading-8 text-slate-600 md:text-xl">
                            A unified ecosystem for church growth, automated payments, QR attendance, program management, and member engagement.
                        </motion.p>

                        <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-4 sm:flex-row">
                            <Button size="lg" variant="premium" className="h-16 rounded-2xl px-9 text-sm font-black uppercase tracking-[0.22em] shadow-2xl shadow-violet-600/20" onClick={() => (window.location.href = '/signup')}>
                                Register Your Organization <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <a href="#journey" className="contents">
                                <Button size="lg" variant="outline" className="h-16 rounded-2xl border-slate-200 bg-white px-9 text-sm font-black uppercase tracking-[0.22em] text-slate-950 shadow-sm">
                                    Watch Product Tour
                                </Button>
                            </a>
                        </motion.div>


                    </motion.div>

                    <AdminPreview />
                </div>
            </section>

            <section className="px-6 py-24 bg-white" id="ecosystem">
                <div className="mx-auto max-w-[1320px]">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-violet-600">The Ecosystem Map</p>
                        <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] md:text-6xl">One Platform, Two Powerhouses.</h2>
                        <p className="mt-5 text-lg font-medium leading-8 text-slate-600">The web command center gives leadership operational control, while the mobile experience keeps members connected from registration to graduation.</p>
                    </div>

                    <div className="mt-16 grid items-center gap-8 lg:grid-cols-[1fr_0.6fr_1fr]">
                        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
                            <BarChart3 className="h-10 w-10 text-violet-600" />
                            <h3 className="mt-6 text-2xl font-black">Admin Command Center</h3>
                            <p className="mt-3 text-sm font-medium leading-7 text-slate-600">Create programs, manage branches, track attendance, verify payments, and view real-time analytics.</p>
                        </div>
                        <div className="relative flex items-center justify-center py-8">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500 to-transparent lg:hidden" />
                            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.4, repeat: Infinity }} className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-2xl shadow-violet-600/30">
                                <Zap className="h-8 w-8" />
                            </motion.div>
                        </div>
                        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/10">
                            <Smartphone className="h-10 w-10 text-fuchsia-300" />
                            <h3 className="mt-6 text-2xl font-black">Member Mobile App</h3>
                            <p className="mt-3 text-sm font-medium leading-7 text-white/65">Register, pay, check in with QR codes, submit assignments, receive updates, and monitor progress.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="px-6 py-24">
                <div className="mx-auto max-w-[1320px]">
                    <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-violet-600">Core Pillars</p>
                            <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.04em] md:text-6xl">Built around the real work of ministry.</h2>
                        </div>
                        <p className="max-w-md text-base font-medium leading-7 text-slate-600">Every module is designed to reduce admin pressure and increase accountability across programs, members, and finance.</p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {pillars.map((pillar) => {
                            const Icon = pillar.icon;
                            return (
                                <motion.div key={pillar.title} whileHover={{ y: -8 }} className={`group rounded-[2rem] border p-8 shadow-sm transition-all duration-300 hover:shadow-2xl hover:shadow-violet-600/10 ${pillar.featured ? 'border-violet-200 bg-white lg:col-span-1 lg:row-span-2' : 'border-slate-200 bg-white'}`}>
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 transition-all group-hover:bg-violet-600 group-hover:text-white">
                                        <Icon className="h-8 w-8" />
                                    </div>
                                    <h3 className="mt-8 text-2xl font-black tracking-tight">{pillar.title}</h3>
                                    <p className="mt-4 text-sm font-medium leading-7 text-slate-600">{pillar.desc}</p>
                                    <div className="mt-8 flex flex-wrap gap-2">
                                        {pillar.badges.map((badge) => (
                                            <span key={badge} className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700">{badge}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section id="journey" className="bg-white px-6 py-24">
                <div className="mx-auto max-w-[1320px]">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-violet-600">Participant Journey</p>
                        <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] md:text-6xl">From setup to insight in four clean steps.</h2>
                    </div>
                    <div className="mt-16 grid gap-5 md:grid-cols-4">
                        {journey.map((step, index) => (
                            <div key={step} className="relative rounded-[2rem] border border-slate-200 bg-slate-50 p-7">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">{index + 1}</div>
                                <h3 className="mt-8 text-xl font-black">{step}</h3>
                                <div className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-500">
                                    <CheckCircle2 className="h-4 w-4" /> Progress Ready
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-6 py-24">
                <div className="mx-auto max-w-[1320px] rounded-[2.5rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15 md:p-10">
                    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="p-4 md:p-8">
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-fuchsia-300">Role-Specific Benefits</p>
                            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] md:text-6xl">Different roles, one connected flow.</h2>
                            <p className="mt-6 text-base font-medium leading-8 text-white/60">Leadership, facilitators, and members each get an experience built around their responsibility.</p>
                        </div>
                        <div className="grid gap-4">
                            {roles.map((role) => {
                                const Icon = role.icon;
                                return (
                                    <div key={role.title} className="rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
                                        <div className="flex gap-5">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950"><Icon className="h-6 w-6" /></div>
                                            <div>
                                                <h3 className="text-xl font-black">For {role.title}</h3>
                                                <p className="mt-2 text-sm font-medium leading-7 text-white/60">{role.desc}</p>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {role.points.map((point) => <span key={point} className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">{point}</span>)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white px-6 py-24">
                <div className="mx-auto max-w-[1320px]">
                    <div className="mb-12 max-w-3xl">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-violet-600">Enterprise Security</p>
                        <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] md:text-6xl">Bank-Grade Trust.</h2>
                        <p className="mt-5 text-lg font-medium leading-8 text-slate-600">Security is not just encryption. It is access control, visibility, deletion control, and audit-ready records.</p>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        {trustBadges.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.title} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-7 hover:border-violet-200 hover:bg-white hover:shadow-xl hover:shadow-violet-600/5 transition-all">
                                    <Icon className="h-9 w-9 text-violet-600" />
                                    <h3 className="mt-6 text-xl font-black">{item.title}</h3>
                                    <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="px-6 py-24">
                <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[3rem] bg-gradient-to-br from-violet-700 via-indigo-700 to-fuchsia-600 px-8 py-20 text-center text-white shadow-2xl shadow-violet-700/25">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.65) 1px, transparent 0)', backgroundSize: '34px 34px' }} />
                    <div className="relative z-10 mx-auto max-w-4xl">
                        <h2 className="text-5xl font-black tracking-[-0.05em] md:text-7xl">Ready to Scale Your Impact?</h2>
                        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-white/75">Launch a cleaner ministry operating system for programs, people, attendance, payments, and reporting.</p>
                        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                            <Button size="lg" className="h-16 rounded-2xl bg-white px-10 text-sm font-black uppercase tracking-[0.22em] text-violet-700 shadow-2xl shadow-white/20 hover:bg-white/90" onClick={() => (window.location.href = '/signup')}>
                                Register Your Organization <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button size="lg" variant="outline" className="h-16 rounded-2xl border-white/30 bg-white/10 px-10 text-sm font-black uppercase tracking-[0.22em] text-white hover:bg-white/15">
                                Watch Product Tour
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-slate-200 bg-white px-6 py-14 text-center">
                <div className="mx-auto max-w-[1320px]">
                    <div className="text-2xl font-black tracking-tight">KingdomConnect</div>
                    <div className="mt-6 flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                        <a href="/data-deletion" className="hover:text-violet-600">Data Deletion</a>
                        <a href="#" className="hover:text-violet-600">Privacy Policy</a>
                        <a href="#" className="hover:text-violet-600">Terms</a>
                        <a href="#" className="hover:text-violet-600">Support</a>
                    </div>
                    <p className="mt-8 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">© 2026 KingdomConnect. Crafted by Etechzim Excellence.</p>
                </div>
            </footer>
        </div>
    );
}


import { Navbar } from '@/components/layout/Navbar';
import { motion } from 'framer-motion';
import { Shield, Trash2, Mail, Smartphone, Globe, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function DataDeletion() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans theme-lite">
            <Navbar />

            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Background Accents */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 bg-slate-50">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[160px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px]"></div>
                </div>

                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest mb-6">
                            <Shield className="w-3 h-3" /> Data Privacy & Control
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-950 uppercase tracking-tight mb-6">
                            Account & Data <span className="text-primary">Deletion</span>
                        </div>
                        <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                            At KingdomConnect, we believe you should have full control over your personal information. 
                            This page provides instructions on how to request the deletion of your account and associated data.
                        </p>
                    </motion.div>

                    <div className="grid gap-8">
                        {/* Option 1: In-App */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:rotate-6 transition-all duration-500">
                                    <Smartphone className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-slate-950 mb-4 uppercase tracking-tight">Delete via Mobile App</h3>
                                    <p className="text-slate-500 font-medium mb-6 leading-relaxed">
                                        The fastest way to delete your account is directly through the KingdomConnect mobile app.
                                    </p>
                                    <ol className="space-y-3 text-slate-600 font-medium text-sm">
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">1</span>
                                            Open the App and go to <span className="font-bold text-slate-900">Settings</span>.
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">2</span>
                                            Tap on <span className="font-bold text-slate-900">Account Settings</span> or <span className="font-bold text-slate-900">Profile</span>.
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">3</span>
                                            Scroll to the bottom and tap <span className="font-bold text-rose-500">Delete Account</span>.
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">4</span>
                                            Confirm the action in the popup dialog.
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </motion.div>

                        {/* Option 2: Web Portal */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:rotate-6 transition-all duration-500">
                                    <Globe className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-slate-950 mb-4 uppercase tracking-tight">Delete via Web Portal</h3>
                                    <p className="text-slate-500 font-medium mb-6 leading-relaxed">
                                        You can also log in to your account through our web portal to initiate deletion.
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        className="mb-8 border-slate-200 hover:bg-slate-50 uppercase tracking-widest font-black text-[10px]"
                                        onClick={() => navigate('/login')}
                                    >
                                        Log In to Portal
                                    </Button>
                                    <p className="text-sm text-slate-500 font-medium">
                                        Once logged in, navigate to <span className="font-bold text-slate-900">Settings / Profile</span> and look for the <span className="font-bold text-rose-500">Delete Account</span> option in the Danger Zone.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Option 3: Request via Email */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
                            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <Mail className="w-8 h-8 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">Request via Email</h3>
                                    <p className="text-slate-400 font-medium mb-6 leading-relaxed">
                                        If you no longer have access to the app or portal, you can request deletion by contacting our support team.
                                    </p>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all" onClick={() => window.location.href = 'mailto:support@kingdomconnect.co.zw'}>
                                        <div>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Support Email</p>
                                            <p className="text-white font-bold tracking-tight">support@kingdomconnect.co.zw</p>
                                        </div>
                                        <Mail className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                                    </div>
                                    <p className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                        Please include your registered email address and full name. Requests are typically processed within 48-72 hours.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Irreversible Warning */}
                    <div className="mt-16 p-8 bg-rose-50 border border-rose-100 rounded-[2rem] text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 mb-4">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-black text-rose-900 uppercase tracking-tight mb-2">Important Notice</h4>
                        <p className="text-rose-700/70 text-sm font-medium leading-relaxed max-w-xl mx-auto">
                            Deleting your account is <span className="font-bold underline">permanent and irreversible</span>. 
                            All your profile data, attendance history, assignment submissions, and payment records will be permanently removed from our active systems.
                        </p>
                    </div>

                    <div className="mt-12 text-center">
                        <Button variant="ghost" onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Button>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-slate-200 bg-white text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
                    © 2026 Kingdom Connect Logistics. Data Privacy Compliance.
                </p>
            </footer>
        </div>
    );
}

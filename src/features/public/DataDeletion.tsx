

import { Navbar } from '@/components/layout/Navbar';
import { motion } from 'framer-motion';
import { Shield, Trash2, Mail, Clock, Sliders, HelpCircle, ArrowLeft, Info } from 'lucide-react';
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
                        </h1>
                        <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                            If you would like to delete your Kingdom Connect / Be That Man account and associated personal data, you can request deletion at any time.
                        </p>
                    </motion.div>

                    <div className="grid gap-8">
                        {/* 1. How to Request Deletion */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:rotate-6 transition-all duration-500">
                                    <Mail className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1 w-full">
                                    <h3 className="text-2xl font-bold text-slate-950 mb-4 uppercase tracking-tight">How to Request Deletion</h3>
                                    <p className="text-slate-500 font-medium mb-6 leading-relaxed">
                                        Send an email to our support team to initiate the deletion process.
                                    </p>
                                    
                                    <div 
                                        className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group cursor-pointer hover:bg-primary/5 hover:border-primary/20 transition-all mb-6" 
                                        onClick={() => window.location.href = 'mailto:support@kingdomconnect.co.zw?subject=Account Deletion Request'}
                                    >
                                        <div>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Email Subject: "Account Deletion Request"</p>
                                            <p className="text-slate-900 font-bold tracking-tight text-lg">support@kingdomconnect.co.zw</p>
                                        </div>
                                        <Button className="w-full sm:w-auto uppercase tracking-widest font-black text-[10px] py-3 px-6 rounded-xl">
                                            Send Email
                                        </Button>
                                    </div>

                                    <div className="border-t border-slate-100 pt-6">
                                        <p className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Please include in your email:</p>
                                        <ul className="space-y-2 text-slate-600 font-medium text-sm">
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                                <span>The <span className="font-bold text-slate-900">full name or username</span> associated with your account</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                                <span>The <span className="font-bold text-slate-900">email address or phone number</span> used to register</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                                <span>Which app you use: <span className="font-bold text-slate-900">Be That Man / Kingdom Connect</span></span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* 2. What Gets Deleted */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500 group-hover:rotate-6 transition-all duration-500">
                                    <Trash2 className="w-8 h-8 text-rose-500 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-slate-950 mb-4 uppercase tracking-tight">What Gets Deleted</h3>
                                    <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                                        Once we verify your request, we will permanently delete:
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Profile Info</p>
                                            <p className="text-slate-700 text-sm font-medium">Name, contact details, and profile photo.</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Program Participation</p>
                                            <p className="text-slate-700 text-sm font-medium">Cohort and discipleship program participation data.</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Activity History</p>
                                            <p className="text-slate-700 text-sm font-medium">Posts, comments, and progress within the app.</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Other Personal Data</p>
                                            <p className="text-slate-700 text-sm font-medium">Any other personal data associated with your account.</p>
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-3 items-start">
                                        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-amber-800 text-xs font-medium leading-relaxed">
                                            <strong>Note on retention:</strong> Some information may be retained where required by law or for legitimate business purposes, such as records needed for fraud prevention, dispute resolution, or financial/legal record-keeping. Aggregated or anonymized data that no longer identifies you may also be retained for analytics purposes.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* 3. Processing Time */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group"
                            >
                                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:rotate-6 transition-all duration-500">
                                    <Clock className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-950 mb-3 uppercase tracking-tight">Processing Time</h3>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                    We will process your deletion request within <strong>30 days</strong> of verification. You will receive a confirmation email once your account and data have been deleted.
                                </p>
                            </motion.div>

                            {/* 4. Partial Deletion */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group"
                            >
                                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:rotate-6 transition-all duration-500">
                                    <Sliders className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-950 mb-3 uppercase tracking-tight">Partial Deletion</h3>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                    If you would like only specific data deleted while keeping your account active, please specify this clearly in your email and we will do our best to accommodate your request.
                                </p>
                            </motion.div>
                        </div>

                        {/* 5. Questions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
                            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <HelpCircle className="w-8 h-8 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">Questions</h3>
                                    <p className="text-slate-400 font-medium mb-6 leading-relaxed">
                                        If you have any questions about this process or about how your data is handled, please contact us.
                                    </p>
                                    <div 
                                        className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all" 
                                        onClick={() => window.location.href = 'mailto:support@kingdomconnect.co.zw'}
                                    >
                                        <div>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Support Email</p>
                                            <p className="text-white font-bold tracking-tight">support@kingdomconnect.co.zw</p>
                                        </div>
                                        <Mail className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
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


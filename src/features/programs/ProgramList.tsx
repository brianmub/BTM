import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Filter, MoreVertical, Calendar, Users, Award, Sparkles, ArrowRight, Loader2, ChevronRight, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { programService } from '@/services/programService';
import { useOrganization } from '@/hooks/useOrganization';
import { Program } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export function ProgramList() {
    const navigate = useNavigate();
    const { organization, loading: orgLoading } = useOrganization();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { profile } = useAuth();
    const canEdit = ['platform_admin', 'system_admin', 'program_admin'].includes(profile?.role || '');

    useEffect(() => {
        if (orgLoading) return;

        if (organization?.id) {
            fetchPrograms();
        } else {
            setLoading(false);
        }
    }, [organization?.id, orgLoading]);

    const fetchPrograms = async () => {
        try {
            setLoading(true);
            const data = await programService.getPrograms(organization!.id);
            setPrograms(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && programs.length === 0) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Resource Control</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Ministry Programs</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Curated educational paths for spiritual growth</p>
                </div>
                {canEdit && (
                    <Button variant="premium" className="h-14 px-8 font-black uppercase tracking-widest text-xs" onClick={() => navigate('/dashboard/programs/new')}>
                        <Plus className="w-4 h-4 mr-3" /> Create New Program
                    </Button>
                )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                <div className="relative w-full lg:w-[500px] group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Filter benchmarks or curriculum..."
                        className="w-full pl-14 pr-6 py-4 bg-background border border-surface-border rounded-2xl text-xs font-bold text-foreground placeholder:text-slate-400 focus:bg-surface focus:border-primary/30 focus:ring-0 transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <Button variant="outline" className="flex-1 lg:flex-none h-14 bg-background border-surface-border text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-foreground" onClick={fetchPrograms}>
                        <RefreshCw className="w-4 h-4 mr-3" /> Refresh
                    </Button>
                    <Button variant="outline" className="flex-1 lg:flex-none h-14 bg-background border-surface-border text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-foreground">
                        <Filter className="w-4 h-4 mr-3" /> Categories
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest">
                    Error loading programs: {error}
                </div>
            )}

            {/* Program Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-10">
                {programs.map((program, i) => (
                    <motion.div
                        key={program.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-0 overflow-hidden group flex flex-col h-[520px] bg-surface border-surface-border hover:border-primary/30 transition-all shadow-2xl relative">
                            <div className="relative h-56 overflow-hidden">
                                <img
                                    src={program.image_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800'}
                                    alt={program.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
                                <div className="absolute top-6 right-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-2xl backdrop-blur-md border border-white/10 ${program.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                        }`}>
                                        {program.status}
                                    </span>
                                </div>
                                <div className="absolute bottom-6 left-6">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-1">{program.category}</p>
                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter leading-none">{program.name}</h3>
                                </div>
                            </div>

                            <div className="p-8 flex-1 flex flex-col">
                                <div className="space-y-8 flex-1">
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { icon: <Users className="w-4 h-4" />, val: program.max_participants || '∞', label: 'Limit' },
                                            { icon: <Calendar className="w-4 h-4" />, val: '--', label: 'Sessions' },
                                            { icon: <Award className="w-4 h-4" />, val: `${program.attendance_required_pct}%`, label: 'Pass' }
                                        ].map((s, idx) => (
                                            <div key={idx} className="text-center p-4 bg-background rounded-2xl border border-surface-border group-hover:bg-surface transition-colors">
                                                <div className="flex items-center justify-center text-slate-500 mb-2">{s.icon}</div>
                                                <p className="text-sm font-black text-foreground leading-none">{s.val}</p>
                                                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1.5">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Program Progress</span>
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                className="h-full bg-gradient-premium"
                                            ></motion.div>
                                        </div>
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {/* Placeholder for avatars */}
                                            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-surface flex items-center justify-center text-[10px] text-slate-500">
                                                +0
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 flex gap-4">
                                    <Button
                                        variant="premium"
                                        className="flex-[2] h-14 text-[10px] font-black uppercase tracking-widest"
                                        onClick={() => navigate(`/dashboard/programs/${program.id}/sessions`)}
                                    >
                                        Manage Sessions <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                    <button
                                        onClick={() => {
                                            const link = `${window.location.origin}/portal/${organization?.slug}/dashboard/browse?programId=${program.id}`;
                                            navigator.clipboard.writeText(link);
                                            // Optional: Add toast notification here
                                            alert('Program link copied to clipboard!');
                                        }}
                                        className="flex-1 h-14 bg-background rounded-2xl flex items-center justify-center border border-surface-border hover:bg-surface transition-all group relative"
                                        title="Copy Join Link"
                                    >
                                        <Share2 className="w-5 h-5 text-slate-500 group-hover:text-primary" />
                                    </button>
                                    <button
                                        onClick={() => navigate(`/dashboard/programs/${program.id}`)}
                                        className="flex-1 h-14 bg-background rounded-2xl flex items-center justify-center border border-surface-border hover:bg-surface transition-all"
                                    >
                                        <ChevronRight className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}

                {programs.length === 0 && !loading && (
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`h-[520px] rounded-3xl border-2 border-dashed border-surface-border flex flex-col items-center justify-center p-10 text-center group ${canEdit ? 'cursor-pointer hover:border-primary/30 hover:bg-surface' : ''}`}
                        onClick={() => canEdit && navigate('/dashboard/programs/new')}
                    >
                        <div className={`w-20 h-20 bg-background rounded-3xl flex items-center justify-center mb-8 border border-surface-border transition-all ${canEdit ? 'group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/30' : ''}`}>
                            <Plus className={`w-10 h-10 text-slate-500 ${canEdit ? 'group-hover:text-primary' : ''}`} />
                        </div>
                        <h3 className={`text-xl font-black text-slate-500 uppercase tracking-tight transition-colors ${canEdit ? 'group-hover:text-foreground' : ''}`}>
                            {canEdit ? 'Assemble Program' : 'No Programs Found'}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4 max-w-[200px] leading-relaxed">
                            {canEdit 
                                ? 'No programs found. Design a new curriculum structure for your ministry participants.' 
                                : 'No programs are currently available for management.'}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

const RefreshCw = ({ className, ...props }: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
    </svg>
);

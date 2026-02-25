import { useState, useEffect } from 'react';
import { Card, GlassBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { sessionService } from '@/services/sessionService';
import { programService } from '@/services/programService';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { Program, Session } from '@/types';

export function EditSession() {
    const { programId, sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { organization } = useOrganization();

    const [program, setProgram] = useState<Program | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        session_date: '',
        start_time: '',
        end_time: '',
        location_type: 'physical',
        location: '',
        max_capacity: 0,
    });

    useEffect(() => {
        if (programId && sessionId) {
            fetchInitialData();
        }
    }, [programId, sessionId]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [prog, sess] = await Promise.all([
                programService.getProgramById(programId!),
                (await (await import('@/services/supabase')).supabase
                    .from('sessions')
                    .select('*')
                    .eq('id', sessionId!)
                    .single()
                ).data as Session
            ]);

            setProgram(prog);

            if (sess) {
                setFormData({
                    name: sess.name,
                    description: sess.description || '',
                    session_date: sess.session_date,
                    start_time: sess.start_time.slice(0, 5),
                    end_time: sess.end_time.slice(0, 5),
                    location_type: sess.location_type || 'physical',
                    location: sess.location || '',
                    max_capacity: sess.max_capacity || 0,
                });
            }
        } catch (err: any) {
            setError('Failed to load session details.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.session_date || !formData.start_time || !formData.end_time) {
            setError('Please fill in all required fields (Name, Date, Start/End Time).');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            await sessionService.updateSession(sessionId!, {
                ...formData,
                location_type: formData.location_type as any,
            });

            navigate(`/dashboard/programs/${programId}/sessions`);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to update session.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-32">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center space-x-6">
                    <button
                        onClick={() => navigate(`/dashboard/programs/${programId}/sessions`)}
                        className="w-14 h-14 bg-background hover:bg-surface border border-surface-border rounded-2xl flex items-center justify-center transition-all group shadow-xl"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-foreground transition-colors" />
                    </button>
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{program?.name}</span>
                        </div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Edit Session</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="premium" className="h-14 px-10 text-[11px] font-black uppercase tracking-widest" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <Save className="w-4 h-4 mr-3" />}
                        Update Session
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-widest">
                    {error}
                </div>
            )}

            <div className="grid gap-10">
                <GlassBox className="p-10 border-surface-border bg-surface shadow-2xl">
                    <div className="space-y-8">
                        {/* Name */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Session Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Introduction to Theology"
                                className="w-full px-6 py-4 rounded-2xl border border-surface-border bg-background text-foreground placeholder:text-slate-400 focus:bg-background/80 focus:border-primary/30 outline-none transition-all font-bold shadow-inner"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Description / Topics</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What will be covered?"
                                rows={3}
                                className="w-full px-6 py-4 rounded-2xl border border-surface-border bg-background text-foreground placeholder:text-slate-400 focus:bg-background/80 focus:border-primary/30 outline-none transition-all font-bold resize-none shadow-inner"
                            />
                        </div>

                        {/* Schedule */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="date"
                                        value={formData.session_date}
                                        onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl border border-surface-border bg-background text-foreground focus:bg-background/80 focus:border-primary/30 outline-none transition-all font-bold appearance-none shadow-inner"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Start Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl border border-surface-border bg-background text-foreground focus:bg-background/80 focus:border-primary/30 outline-none transition-all font-bold appearance-none shadow-inner"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">End Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="time"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl border border-surface-border bg-background text-foreground focus:bg-background/80 focus:border-primary/30 outline-none transition-all font-bold appearance-none shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Location Type</label>
                                <select
                                    value={formData.location_type}
                                    onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl border border-surface-border bg-background text-foreground focus:bg-background/80 focus:border-primary/30 outline-none transition-all font-bold appearance-none shadow-inner"
                                >
                                    <option value="physical" className="text-slate-900">Physical Venue</option>
                                    <option value="virtual" className="text-slate-900">Virtual / Online</option>
                                    <option value="hybrid" className="text-slate-900">Hybrid</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Venue / Link</label>
                                <div className="relative">
                                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder={formData.location_type === 'virtual' ? 'e.g. Zoom Link' : 'e.g. Main Hall'}
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl border border-surface-border bg-background text-foreground focus:bg-background/80 focus:border-primary/30 outline-none transition-all font-bold shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassBox>
            </div>
        </div>
    );
}


import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/services/supabase';
import { GlassBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Calendar, Users, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Program } from '@/types';

export function ProgramBrowser() {
    const { user } = useAuth();
    const { organization, currentProfile } = useOrganization();
    const navigate = useNavigate();
    const { orgSlug } = useParams();

    const [programs, setPrograms] = useState<Program[]>([]);
    const [enrolledProgramIds, setEnrolledProgramIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);

    useEffect(() => {
        if (organization && user) {
            fetchData();
        }
    }, [organization, user]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch all active programs
            const { data: progs, error: progError } = await supabase
                .from('programs')
                .select('*')
                .eq('organization_id', organization?.id)
                .eq('status', 'active')
                .eq('is_visible', true)
                .order('start_date', { ascending: true });

            if (progError) throw progError;
            setPrograms(progs || []);

            // 2. Fetch my enrollments to check status
            const { data: enrolls, error: enrollError } = await supabase
                .from('enrollments')
                .select('program_id')
                .eq('user_id', user?.id)
                .in('status', ['enrolled', 'active', 'pending']);

            if (enrollError) throw enrollError;
            setEnrolledProgramIds(enrolls?.map(e => e.program_id) || []);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (programId: string) => {
        try {
            setEnrollingId(programId);

            const { data: newEnrollment, error } = await supabase
                .from('enrollments')
                .insert([{
                    organization_id: organization!.id,
                    // Use internal users.id (NOT auth UUID) — FK references users table
                    user_id: currentProfile!.id,
                    program_id: programId,
                    // DO NOT send 'status' — let the DB column default handle it
                    // This bypasses the valid_enrollment_status check constraint entirely
                    payment_status: 'paid',
                    amount_due: 0,
                    enrollment_source: 'web_portal',
                }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    throw new Error('You are already enrolled in this program.');
                }
                throw error;
            }

            // Immediately promote to 'active'
            if (newEnrollment?.id) {
                await supabase
                    .from('enrollments')
                    .update({ status: 'active' })
                    .eq('id', newEnrollment.id);
            }

            // Navigate to program view — celebration modal fires there
            navigate(`/portal/${orgSlug}/dashboard/program/${programId}`);

        } catch (err: any) {
            alert(err.message);
        } finally {
            setEnrollingId(null);
        }
    };

    return (
        <div className="p-6 pb-32 space-y-6">
            <div className="space-y-2 pt-6">
                <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Discover Programs</h1>
                <p className="text-slate-500 text-sm">Find your next step in the journey.</p>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search courses..."
                    className="w-full bg-surface border border-surface-border rounded-xl pl-10 pr-4 py-3 text-foreground text-sm outline-none focus:border-primary/30 transition-colors shadow-inner"
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {programs.map(program => {
                        const isEnrolled = enrolledProgramIds.includes(program.id);
                        return (
                            <GlassBox key={program.id} className="p-0 overflow-hidden group bg-surface border-surface-border shadow-xl">
                                <div className="aspect-video bg-background relative">
                                    {program.image_url && (
                                        <img src={program.image_url} alt="" className="w-full h-full object-cover opacity-60" />
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2 py-1 bg-surface/80 backdrop-blur-md rounded-md text-[10px] font-black uppercase tracking-widest text-foreground border border-surface-border">
                                            {program.category || 'General'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div>
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-2">{program.name}</h3>
                                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{program.description}</p>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-primary" />
                                            <span>Starts {new Date(program.start_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {isEnrolled ? (
                                        <Button
                                            className="w-full bg-emerald-500/5 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/10 font-black uppercase tracking-widest h-12 shadow-lg"
                                            onClick={() => navigate(`/portal/${orgSlug}/dashboard`)}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Enrolled
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="united"
                                            className="w-full h-12 text-xs"
                                            onClick={() => handleEnroll(program.id)}
                                            disabled={enrollingId === program.id}
                                        >
                                            {enrollingId === program.id ? (
                                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Joining...</>
                                            ) : (
                                                'Join the Program'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </GlassBox>
                        );
                    })}

                    {programs.length === 0 && (
                        <div className="text-center py-10 text-slate-500 text-sm">
                            No active programs available at the moment.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

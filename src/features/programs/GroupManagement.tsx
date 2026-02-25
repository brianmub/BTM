import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { Loader2, Users, Plus, UserPlus, X, Trash2, Edit2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, GlassBox } from '@/components/ui/Card';

interface Group {
    id: string;
    name: string;
    description: string;
    max_capacity: number;
    facilitator: {
        first_name: string;
        surname: string;
    } | null;
    member_count: number;
}

export function GroupManagement({ programId }: { programId: string }) {
    const { organization } = useOrganization();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        if (organization) fetchGroups();
    }, [organization, programId]);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('program_groups')
                .select(`
                    *,
                    facilitator:users (first_name, surname),
                    members:group_members (count)
                `)
                .eq('program_id', programId);

            if (error) throw error;

            // Format data to include member count from the join (Supabase count needs handling)
            const formattedGroups = data.map((g: any) => ({
                ...g,
                member_count: g.members[0]?.count || 0
            }));

            setGroups(formattedGroups);
        } catch (err) {
            console.error('Error fetching groups:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Program Groups</h3>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Organize participants into cohorts or teams</p>
                </div>
                <Button variant="premium" size="sm" className="h-10 text-[10px] uppercase font-black tracking-widest" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Assemble Group
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {groups.map(group => (
                        <GlassBox key={group.id} className="p-6 border-surface-border bg-surface hover:border-primary/30 transition-all flex flex-col shadow-xl">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Users className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 text-slate-400 hover:text-foreground transition-colors"><Edit2 className="w-4 h-4" /></button>
                                    <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <h4 className="text-lg font-black text-foreground uppercase tracking-tight mb-2">{group.name}</h4>
                            <p className="text-slate-500 text-xs mb-6 flex-1">{group.description || 'No description provided for this group.'}</p>

                            <div className="space-y-4 pt-4 border-t border-surface-border">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-slate-500">Lead Facilitator</span>
                                    <span className="text-foreground">{group.facilitator ? `${group.facilitator.first_name} ${group.facilitator.surname}` : 'Unassigned'}</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-slate-500">Fill Rate</span>
                                        <span className="text-primary">{group.member_count} / {group.max_capacity || '∞'}</span>
                                    </div>
                                    <div className="h-1 bg-surface rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${group.max_capacity ? (group.member_count / group.max_capacity) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Marital Balance Indicator */}
                                <div className="space-y-2 pb-2">
                                    <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                        <span>Marital Balance</span>
                                        <Heart className="w-2.5 h-2.5 text-pink-500" />
                                    </div>
                                    <div className="flex gap-1 h-1.5">
                                        <div className="flex-1 bg-pink-500/30 rounded-full overflow-hidden relative group/bal">
                                            <div className="h-full bg-pink-500 w-[60%]"></div>
                                            <span className="absolute -top-4 left-0 text-[6px] opacity-0 group-hover/bal:opacity-100 transition-opacity font-bold text-pink-400">Married</span>
                                        </div>
                                        <div className="flex-1 bg-blue-500/30 rounded-full overflow-hidden relative group/bal2">
                                            <div className="h-full bg-blue-500 w-[40%]"></div>
                                            <span className="absolute -top-4 left-0 text-[6px] opacity-0 group-hover/bal2:opacity-100 transition-opacity font-bold text-blue-400">Single</span>
                                        </div>
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full h-10 text-[10px] font-black uppercase tracking-widest bg-background border-surface-border">
                                    <UserPlus className="w-3 h-3 mr-2" /> Manage Participants
                                </Button>
                            </div>
                        </GlassBox>
                    ))}

                    {groups.length === 0 && (
                        <div className="md:col-span-2 text-center py-20 bg-background rounded-3xl border border-dashed border-surface-border">
                            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No groups assembled yet</p>
                        </div>
                    )}
                </div>
            )}

            {isCreateModalOpen && (
                <CreateGroupModal
                    programId={programId}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        fetchGroups();
                    }}
                />
            )}
        </div>
    );
}

function CreateGroupModal({ programId, onClose, onSuccess }: { programId: string, onClose: () => void, onSuccess: () => void }) {
    const { organization } = useOrganization();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [capacity, setCapacity] = useState(20);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('program_groups').insert([{
                organization_id: organization!.id,
                program_id: programId,
                name,
                description,
                max_capacity: capacity
            }]);
            if (error) throw error;
            onSuccess();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <GlassBox className="w-full max-w-md p-8 bg-surface border-surface-border shadow-2xl relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-foreground"><X className="w-6 h-6" /></button>
                <div className="mb-8">
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Form Group</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Initialize a new cohort structure</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Group Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Wednesday Bible Study"
                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-4 text-foreground text-sm outline-none focus:border-primary/30 transition-all font-bold shadow-inner"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Target Capacity</label>
                        <input
                            type="number"
                            required
                            value={capacity}
                            onChange={e => setCapacity(Number(e.target.value))}
                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-4 text-foreground text-sm outline-none focus:border-primary/30 transition-all font-mono shadow-inner"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Brief Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-4 h-32 text-foreground text-sm outline-none focus:border-primary/30 transition-all font-bold resize-none shadow-inner"
                        ></textarea>
                    </div>

                    <Button type="submit" variant="premium" className="w-full h-14 font-black uppercase tracking-widest" disabled={loading}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Assembly'}
                    </Button>
                </form>
            </GlassBox>
        </div>
    );
}

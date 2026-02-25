import { useState, useEffect } from 'react';
import { Card, GlassBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Mail, Shield, User, Trash2, Copy, CheckCircle2, Loader2, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/services/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamMember {
    id: string;
    email: string;
    first_name: string;
    surname: string;
    role: string;
    profile_photo_url?: string;
    is_active: boolean;
}

interface Invitation {
    id: string;
    email: string;
    role: 'program_admin' | 'facilitator';
    token: string;
    created_at: string;
}

export function TeamSettings() {
    const { organization } = useOrganization();
    const { user, profile } = useAuth();

    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'program_admin' | 'facilitator'>('facilitator');
    const [inviting, setInviting] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    useEffect(() => {
        if (organization) {
            fetchTeamData();
        }
    }, [organization]);

    const fetchTeamData = async () => {
        try {
            setLoading(true);

            // Fetch Members
            const { data: membersData } = await supabase
                .from('users')
                .select('*')
                .eq('organization_id', organization!.id)
                .neq('role', 'participant'); // Show only team members

            // Fetch Pending Invitations
            const { data: invitesData } = await supabase
                .from('invitations')
                .select('*')
                .eq('organization_id', organization!.id)
                .is('accepted_at', null);

            setMembers(membersData || []);
            setInvitations(invitesData || []);
        } catch (error) {
            console.error('Error fetching team:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;

        try {
            setInviting(true);
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            // Create Invitation Record
            const { error } = await supabase
                .from('invitations')
                .insert([{
                    organization_id: organization!.id,
                    email: inviteEmail,
                    role: inviteRole,
                    token: token,
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                    created_by: profile?.id ?? user!.id
                }]);

            if (error) throw error;

            // Generate "Magic Link"
            const link = `${window.location.origin}/invite/${token}`;
            setGeneratedLink(link);

            // Refresh list
            fetchTeamData();

        } catch (error: any) {
            alert('Error creating invitation: ' + error.message);
        } finally {
            setInviting(false);
        }
    };

    const copyLink = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            alert('Invitation link copied to clipboard!');
        }
    };

    const closeInviteModal = () => {
        setShowInviteModal(false);
        setInviteEmail('');
        setGeneratedLink(null);
    };

    if (loading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Team Management</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage admins and facilitators</p>
                </div>
                <Button variant="premium" onClick={() => setShowInviteModal(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Invite Member
                </Button>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest">Pending Invitations</h3>
                    <div className="grid gap-4">
                        {invitations.map(invite => (
                            <GlassBox key={invite.id} className="p-4 border-primary/20 bg-primary/5 flex items-center justify-between shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Mail className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{invite.email}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-primary/70">{invite.role.replace('_', ' ')} • Invited just now</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="h-8 text-[10px] bg-background border-surface-border" onClick={() => {
                                        const link = `${window.location.origin}/invite/${invite.token}`;
                                        navigator.clipboard.writeText(link);
                                        alert('Link copied!');
                                    }}>
                                        <Copy className="w-3 h-3 mr-2" /> Copy Link
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </GlassBox>
                        ))}
                    </div>
                </div>
            )}

            {/* Team Members */}
            <div className="grid gap-4">
                {members.map(member => (
                    <Card key={member.id} className="p-6 border-surface-border bg-surface hover:border-primary/30 transition-all shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {member.profile_photo_url ? (
                                    <img src={member.profile_photo_url} alt={member.first_name} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-surface-border">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-base font-bold text-foreground">
                                        {member.first_name} {member.surname} {member.id === user?.id && <span className="text-slate-500 text-xs ml-2">(You)</span>}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${member.role === 'system_admin' ? 'bg-primary/20 text-primary' : 'bg-pink-500/20 text-pink-500'
                                            }`}>
                                            {member.role.replace('_', ' ')}
                                        </span>
                                        <span className="text-slate-600 text-xs">•</span>
                                        <span className="text-slate-500 text-xs">{member.email}</span>
                                    </div>
                                </div>
                            </div>
                            {member.id !== user?.id && (
                                <Button variant="ghost" className="text-slate-500 hover:text-red-400">
                                    Remove
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Invite Modal Overlay */}
            <AnimatePresence>
                {showInviteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface border border-surface-border rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-premium"></div>

                            {!generatedLink ? (
                                <>
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-6">Invite Team Member</h3>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                                            <input
                                                type="email"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/30 transition-colors shadow-inner"
                                                placeholder="colleague@church.com"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Role Permission</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setInviteRole('facilitator')}
                                                    className={`p-3 rounded-xl border text-left transition-all ${inviteRole === 'facilitator' ? 'bg-primary/10 border-primary text-foreground' : 'bg-transparent border-surface-border text-slate-500 hover:border-primary/30'}`}
                                                >
                                                    <div className="text-xs font-bold mb-1">Facilitator</div>
                                                    <div className="text-[10px] opacity-70">Can manage sessions & attendance</div>
                                                </button>
                                                <button
                                                    onClick={() => setInviteRole('program_admin')}
                                                    className={`p-3 rounded-xl border text-left transition-all ${inviteRole === 'program_admin' ? 'bg-primary/10 border-primary text-foreground' : 'bg-transparent border-surface-border text-slate-500 hover:border-primary/30'}`}
                                                >
                                                    <div className="text-xs font-bold mb-1">Admin</div>
                                                    <div className="text-[10px] opacity-70">Full access to programs</div>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button variant="outline" className="flex-1 border-surface-border" onClick={closeInviteModal}>Cancel</Button>
                                            <Button variant="premium" className="flex-1" onClick={handleInvite} disabled={!inviteEmail || inviting}>
                                                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Invite'}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">Invite Created!</h3>
                                    <p className="text-slate-500 text-sm mb-6">Share this magic link with the user to let them join.</p>

                                    <div className="bg-background p-3 rounded-xl border border-surface-border flex items-center gap-3 mb-6 shadow-inner">
                                        <LinkIcon className="w-4 h-4 text-primary flex-shrink-0" />
                                        <span className="text-xs text-slate-600 truncate font-mono">{generatedLink}</span>
                                    </div>

                                    <Button variant="premium" className="w-full mb-3" onClick={copyLink}>
                                        <Copy className="w-4 h-4 mr-2" /> Copy Link
                                    </Button>
                                    <Button variant="ghost" className="w-full text-slate-500" onClick={closeInviteModal}>
                                        Done
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

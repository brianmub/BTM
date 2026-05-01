import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Building,
    Key,
    Mail,
    Bell,
    Shield,
    Save,
    User,
    Users,
    Loader2,
    Sparkles,
    LogOut,
    RefreshCw,
    Copy,
} from 'lucide-react';

import { organizationService } from '@/services/organizationService';
import { TeamSettings } from '@/features/settings/TeamSettings';
import { UserRolesList } from '@/features/settings/UserRolesList';

export function SettingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialTab = searchParams.get('tab') || 'organization';
    const [activeTab, setActiveTab] = useState(initialTab);
    const { user, profile, signOut, deleteAccount } = useAuth();
    const { organization } = useOrganization();

    const [loading, setLoading] = useState(false);
    const [orgForm, setOrgForm] = useState({
        name: '',
        email: '',
        joinCode: ''
    });

    // Update URL when tab changes
    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };

    // Update active tab if URL changes (e.g. back button)
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    // Update local state when organization loads
    useEffect(() => {
        if (organization) {
            setOrgForm({
                name: organization.name,
                email: organization.contact_email || '',
                joinCode: organization.join_code || ''
            });
        }
    }, [organization]);

    const handleSaveOrganization = async () => {
        if (!organization) return;
        setLoading(true);
        try {
            await organizationService.updateOrganization(organization.id, {
                name: orgForm.name,
                contact_email: orgForm.email,
                join_code: orgForm.joinCode
            });
            alert('Organization details updated successfully!');
        } catch (error) {
            console.error('Error updating organization:', error);
            alert('Failed to update organization.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateCode = () => {
        const newCode = organizationService.generateJoinCode();
        setOrgForm(prev => ({ ...prev, joinCode: newCode }));
    };

    const copyJoinCode = () => {
        if (orgForm.joinCode) {
            navigator.clipboard.writeText(orgForm.joinCode);
            alert('Organization code copied to clipboard!');
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "CRITICAL ACTION: Are you sure you want to delete your account? \n\n" +
            "This will permanently remove your profile, assignment submissions, attendance records, and all associated data. " +
            "This action cannot be undone."
        );
        
        if (confirmed) {
            try {
                setLoading(true);
                await deleteAccount();
                navigate('/');
            } catch (error: any) {
                alert(error.message || "Failed to delete account.");
            } finally {
                setLoading(false);
            }
        }
    };


    const tabs = [
        { id: 'users', name: 'Users', icon: <Users className="w-4 h-4" /> },
        { id: 'profile', name: 'User Profile', icon: <User className="w-4 h-4" /> },
        { id: 'organization', name: 'Organization', icon: <Building className="w-4 h-4" /> },
        { id: 'team', name: 'Team Management', icon: <User className="w-4 h-4" /> },
        { id: 'security', name: 'Security', icon: <Shield className="w-4 h-4" /> },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">System Configuration</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Management of organizational protocols and identity</p>
                </div>
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 active:scale-95 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Log Out
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="md:w-64 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-xl shadow-primary/20'
                                : 'text-slate-500 hover:text-foreground hover:bg-background'
                                }`}
                        >
                            <span className={activeTab === tab.id ? 'text-white' : 'text-slate-500'}>
                                {tab.icon}
                            </span>
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-8">
                    {activeTab === 'profile' && (
                        <Card className="space-y-8 bg-surface border-surface-border backdrop-blur-xl p-10 shadow-2xl">
                            <div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-8">Personal Intelligence</h3>
                                <div className="flex items-center gap-6 mb-10 p-6 bg-background rounded-3xl border border-surface-border">
                                    <div className="w-20 h-20 bg-gradient-premium rounded-[24px] flex items-center justify-center text-4xl shadow-2xl shadow-primary/20">
                                        <span className="text-white opacity-90 font-black">
                                            {profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                                            {profile?.first_name} {profile?.surname}
                                        </h2>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                {profile?.role?.replace('_', ' ') || 'User'}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{organization?.name}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Given Name</label>
                                        <input
                                            type="text"
                                            defaultValue={profile?.first_name || ''}
                                            className="w-full px-6 py-4 rounded-2xl border border-surface-border bg-background text-slate-400 font-bold outline-none cursor-not-allowed"
                                            readOnly
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Surname</label>
                                        <input
                                            type="text"
                                            defaultValue={profile?.surname || ''}
                                            className="w-full px-6 py-4 rounded-2xl border border-surface-border bg-background text-slate-400 font-bold outline-none cursor-not-allowed"
                                            readOnly
                                        />
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Direct Communication</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                defaultValue={user?.email || ''}
                                                className="w-full px-6 py-4 rounded-2xl border border-surface-border bg-background text-slate-400 font-bold outline-none cursor-not-allowed"
                                                readOnly
                                            />
                                            <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-surface-border">
                                <h4 className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] mb-6">Security & Access</h4>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/forgot-password')}
                                    className="w-full justify-between group h-14 rounded-2xl bg-background border-surface-border text-slate-500 hover:text-foreground hover:bg-surface-border/5"
                                >
                                    <span className="flex items-center gap-3">
                                        <Key className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                        <span className="text-xs font-black uppercase tracking-widest">Change Login Password</span>
                                    </span>
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Enhanced Security</span>
                                </Button>
                            </div>

                            <div className="pt-10 border-t border-rose-500/10">
                                <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">Danger Zone</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6 leading-relaxed">
                                    Once you delete your account, there is no going back. Please be certain.
                                </p>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-2 group"
                                >
                                    <Shield className="w-3 h-3 group-hover:animate-pulse" />
                                    <span>Delete My Entire Account & Data</span>
                                </button>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-surface border border-surface-border rounded-[32px] p-8 shadow-2xl">
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-8">All Users</h3>
                            <UserRolesList />
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="bg-surface border border-surface-border rounded-[32px] overflow-hidden shadow-2xl">
                            <TeamSettings />
                        </div>
                    )}

                    {activeTab === 'organization' && (
                        <Card className="space-y-10 bg-surface border-surface-border backdrop-blur-xl p-10 shadow-2xl">
                            <div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-8">Organization Information</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Church / Org Designation</label>
                                        <input
                                            type="text"
                                            value={orgForm.name}
                                            onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl border border-surface-border bg-background text-foreground font-bold focus:bg-background/80 focus:border-primary/30 outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Primary Network Email</label>
                                        <input
                                            type="email"
                                            value={orgForm.email}
                                            onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl border border-surface-border bg-background text-foreground font-bold focus:bg-background/80 focus:border-primary/30 outline-none transition-all shadow-inner"
                                        />
                                    </div>

                                    {/* Mobile Registration Code */}
                                    <div className="space-y-3 md:col-span-2 pt-4 border-t border-surface-border mt-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-primary pl-1 flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" /> Mobile Registration Code
                                            </label>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">For Mobile App Signups</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    value={orgForm.joinCode}
                                                    readOnly
                                                    className="w-full px-6 py-4 rounded-2xl border border-surface-border bg-background/50 text-foreground font-mono text-lg font-black tracking-[0.2em] outline-none transition-all shadow-inner uppercase"
                                                    placeholder="NO CODE"
                                                />
                                                <button
                                                    onClick={copyJoinCode}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-surface rounded-xl text-slate-400 hover:text-primary transition-all"
                                                    title="Copy Code"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="h-auto px-6 border-surface-border bg-background hover:bg-surface"
                                                onClick={handleRegenerateCode}
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Regenerate
                                            </Button>
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed px-1">
                                            Participants can use this unique code to join your organization when registering on the mobile app. 
                                            Regenerating the code will invalidate the previous one.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-surface-border flex justify-end">
                                <Button variant="premium" className="h-14 px-10 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20" onClick={handleSaveOrganization} disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4 mr-3" />}
                                    Commit Data
                                </Button>
                            </div>
                        </Card>
                    )}


                </div>
            </div>
        </div>
    );
}

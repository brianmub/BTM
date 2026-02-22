import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    Loader2,
    Sparkles
} from 'lucide-react';

import { organizationService } from '@/services/organizationService';
import { TeamSettings } from '@/features/settings/TeamSettings';

export function SettingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'organization';
    const [activeTab, setActiveTab] = useState(initialTab);
    const { user, profile } = useAuth();
    const { organization } = useOrganization();

    const [loading, setLoading] = useState(false);
    const [orgForm, setOrgForm] = useState({
        name: '',
        email: ''
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
                email: organization.contact_email || ''
            });
        }
    }, [organization]);

    const handleSaveOrganization = async () => {
        if (!organization) return;
        setLoading(true);
        try {
            await organizationService.updateOrganization(organization.id, {
                name: orgForm.name,
                contact_email: orgForm.email
            });
            alert('Organization details updated successfully!');
        } catch (error) {
            console.error('Error updating organization:', error);
            alert('Failed to update organization.');
        } finally {
            setLoading(false);
        }
    };


    const tabs = [
        { id: 'profile', name: 'User Profile', icon: <User className="w-4 h-4" /> },
        { id: 'organization', name: 'Organization', icon: <Building className="w-4 h-4" /> },
        { id: 'team', name: 'Team Management', icon: <User className="w-4 h-4" /> },
        { id: 'security', name: 'Security', icon: <Shield className="w-4 h-4" /> },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">System Configuration</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Management of organizational protocols and identity</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="md:w-64 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20'
                                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
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
                        <Card className="space-y-8 bg-slate-900/40 border-white/5 backdrop-blur-xl p-10">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8">Personal Intelligence</h3>
                                <div className="flex items-center gap-6 mb-10 p-6 bg-white/5 rounded-3xl border border-white/5">
                                    <div className="w-20 h-20 bg-gradient-premium rounded-[24px] flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/20">
                                        <span className="text-white opacity-90 font-black">
                                            {profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                            {profile?.first_name} {profile?.surname}
                                        </h2>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
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
                                            className="w-full px-6 py-4 rounded-2xl border border-white/5 bg-white/5 text-slate-400 font-bold outline-none cursor-not-allowed"
                                            readOnly
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Surname</label>
                                        <input
                                            type="text"
                                            defaultValue={profile?.surname || ''}
                                            className="w-full px-6 py-4 rounded-2xl border border-white/5 bg-white/5 text-slate-400 font-bold outline-none cursor-not-allowed"
                                            readOnly
                                        />
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Direct Communication</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                defaultValue={user?.email || ''}
                                                className="w-full px-6 py-4 rounded-2xl border border-white/5 bg-white/5 text-slate-400 font-bold outline-none cursor-not-allowed"
                                                readOnly
                                            />
                                            <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-white/5">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-6">Security Protocols</h4>
                                <Button variant="outline" className="w-full justify-between group h-14 rounded-2xl bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10">
                                    <span className="flex items-center gap-3">
                                        <Key className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                        <span className="text-xs font-black uppercase tracking-widest">Update Cryptographic Access</span>
                                    </span>
                                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Rotated 3 mo ago</span>
                                </Button>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'team' && (
                        <div className="bg-slate-900/40 border border-white/5 rounded-[32px] overflow-hidden">
                            <TeamSettings />
                        </div>
                    )}

                    {activeTab === 'organization' && (
                        <Card className="space-y-10 bg-slate-900/40 border-white/5 backdrop-blur-xl p-10">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8">Organization Information</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Church / Org Designation</label>
                                        <input
                                            type="text"
                                            value={orgForm.name}
                                            onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl border border-white/5 bg-white/5 text-white font-bold focus:bg-white/10 focus:border-indigo-500/30 outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Primary Network Email</label>
                                        <input
                                            type="email"
                                            value={orgForm.email}
                                            onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl border border-white/5 bg-white/5 text-white font-bold focus:bg-white/10 focus:border-indigo-500/30 outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-white/5 flex justify-end">
                                <Button variant="premium" className="h-14 px-10 font-black uppercase tracking-widest text-xs" onClick={handleSaveOrganization} disabled={loading}>
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

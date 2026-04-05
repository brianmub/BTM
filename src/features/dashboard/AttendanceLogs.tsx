import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Search,
    Filter,
    Download,
    Calendar,
    Clock,
    User,
    ChevronRight,
    Loader2,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useOrganization } from '@/hooks/useOrganization';
import { profileService } from '@/services/profileService';

export function AttendanceLogs() {
    const { organization } = useOrganization();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [programs, setPrograms] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedProgram, setSelectedProgram] = useState('all');
    const [selectedGroup, setSelectedGroup] = useState('all');

    useEffect(() => {
        if (organization?.id) {
            fetchLogs();
        }
    }, [organization?.id]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await profileService.getAttendanceLogs(organization!.id);
            setLogs(data || []);

            // Fetch programs for filter
            const { data: progs } = await (await import('@/services/supabase')).supabase
                .from('programs')
                .select('id, name')
                .eq('organization_id', organization!.id);
            setPrograms(progs || []);
        } catch (err) {
            console.error('Failed to fetch attendance logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async (programId: string) => {
        if (programId === 'all') {
            setGroups([]);
            return;
        }
        const { data } = await (await import('@/services/supabase')).supabase
            .from('program_groups')
            .select('id, name')
            .eq('program_id', programId);
        setGroups(data || []);
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Name', 'Email', 'Program', 'Session', 'Check-in', 'Check-out', 'Status', 'Verified'];
        const csvRows = filteredLogs.map(log => [
            new Date(log.checked_in_at).toLocaleDateString(),
            `${log.users?.first_name} ${log.users?.surname}`,
            log.users?.email,
            log.programs?.name,
            log.sessions?.title,
            new Date(log.entry_time || log.checked_in_at).toLocaleTimeString(),
            log.exit_time ? new Date(log.exit_time).toLocaleTimeString() : 'N/A',
            log.exit_time ? 'Completed' : 'Ongoing',
            log.is_verified ? 'Yes' : 'No'
        ]);

        const csvContent = [headers, ...csvRows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_audit_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredLogs = logs.filter(log => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = (
            `${log.users?.first_name} ${log.users?.surname}`.toLowerCase().includes(query) ||
            log.users?.email?.toLowerCase().includes(query) ||
            log.sessions?.title?.toLowerCase().includes(query) ||
            log.programs?.name?.toLowerCase().includes(query)
        );

        const matchesProgram = selectedProgram === 'all' || log.program_id === selectedProgram;
        // Note: group_id might need to be joined in getAttendanceLogs or mapped here 
        // For now we assume if it's in the log or we filter by user's group
        return matchesSearch && matchesProgram;
    });

    return (
        <div className="space-y-12 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Audit Engine</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight uppercase italic">
                        Attendance Logs
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                        Complete chronological record of all ministry check-ins
                    </p>
                </motion.div>

                <div className="flex gap-4">
                    <Button variant="united" className="h-14 px-8 bg-surface border-surface-border text-slate-500" onClick={fetchLogs}>
                        <RefreshCw className={`w-4 h-4 mr-3 ${loading ? 'animate-spin' : ''}`} /> Sync
                    </Button>
                    <Button variant="premium" className="h-14 px-8 shadow-xl" onClick={exportToCSV}>
                        <Download className="w-4 h-4 mr-3" /> Export Audit (CSV)
                    </Button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <Card className="p-4 bg-surface/50 border-surface-border backdrop-blur-xl flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full lg:w-auto">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search matrix by participant or signature..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-background/50 border border-surface-border rounded-2xl text-[11px] font-bold text-foreground placeholder:text-slate-700 focus:border-primary/40 focus:ring-0 transition-all outline-none uppercase tracking-widest"
                    />
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                    <select 
                        value={selectedProgram}
                        onChange={(e) => {
                            setSelectedProgram(e.target.value);
                            fetchGroups(e.target.value);
                        }}
                        className="h-[60px] bg-background/50 border border-surface-border rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary/40 min-w-[180px]"
                    >
                        <option value="all">Every Program</option>
                        {programs.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    
                    {groups.length > 0 && (
                        <select 
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            className="h-[60px] bg-background/50 border border-surface-border rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary/40 min-w-[180px]"
                        >
                            <option value="all">All Cohorts</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </Card>

            {/* Data Table */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Retrieving Cloud Records...</p>
                    </div>
                ) : filteredLogs.length > 0 ? (
                    <div className="grid gap-4">
                        {filteredLogs.map((log, i) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="p-4 hover:border-primary/30 transition-all group overflow-hidden relative">
                                    {/* Accent line for verified entries */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        {/* Avatar / Initial */}
                                        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-surface-border flex items-center justify-center overflow-hidden shrink-0">
                                            {log.users?.profile_photo_url ? (
                                                <img src={log.users.profile_photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-6 h-6 text-slate-500" />
                                            )}
                                        </div>

                                        {/* Participant Info */}
                                        <div className="min-w-[200px]">
                                            <h4 className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                                                {log.users?.first_name} {log.users?.surname}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-0.5 lowercase italic">
                                                {log.users?.email}
                                            </p>
                                        </div>

                                        {/* Session Info */}
                                        <div className="flex-1 border-l border-surface-border pl-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="w-3 h-3 text-primary" />
                                                <span className="text-[10px] font-black text-foreground uppercase tracking-widest truncate">
                                                    {log.sessions?.title || 'Unknown Session'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2 py-0.5 bg-background border border-surface-border rounded-md">
                                                    {log.programs?.name || 'General'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Arrival & Departure */}
                                        <div className="flex flex-col items-end shrink-0 sm:min-w-[160px] border-l border-surface-border pl-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1.5 text-foreground font-black text-[11px] tracking-tight">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                        {new Date(log.entry_time || log.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Arrival</span>
                                                </div>

                                                <div className="h-6 w-px bg-surface-border rotate-12"></div>

                                                <div className="flex flex-col items-end">
                                                    <div className={`flex items-center gap-1.5 font-black text-[11px] tracking-tight ${log.exit_time ? 'text-foreground' : 'text-primary animate-pulse'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${log.exit_time ? 'bg-indigo-500' : 'bg-primary'}`}></div>
                                                        {log.exit_time ? new Date(log.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ACTIVE'}
                                                    </div>
                                                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Departure</span>
                                                </div>
                                            </div>
                                            
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                                                {new Date(log.entry_time || log.checked_in_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>

                                        {/* Arrival & Departure Times (Increased Visibility) */}
                                        <div className="flex flex-col items-end shrink-0 sm:min-w-[200px] border-l border-surface-border pl-8">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 opacity-60">Arrival Time</span>
                                                    <div className="flex items-center gap-2 text-foreground font-black text-[16px] tracking-tight bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                        {new Date(log.entry_time || log.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>

                                                <div className="h-10 w-px bg-surface-border/50 rotate-12"></div>

                                                <div className="flex flex-col items-end">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 opacity-60">Departure Time</span>
                                                    <div className={`flex items-center gap-2 font-black text-[16px] tracking-tight px-3 py-1.5 rounded-xl border ${log.exit_time ? 'text-foreground bg-indigo-500/5 border-indigo-500/10' : 'text-primary bg-primary/5 border-primary/20 animate-pulse'}`}>
                                                        <div className={`w-2 h-2 rounded-full ${log.exit_time ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]'}`}></div>
                                                        {log.exit_time ? new Date(log.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ACTIVE'}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-slate-500" />
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                                                    {new Date(log.entry_time || log.checked_in_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Navigation */}
                                        <div className="flex items-center pl-4">
                                            <Button variant="ghost" size="sm" className="w-10 h-10 rounded-2xl hover:bg-surface border border-transparent hover:border-surface-border group/btn">
                                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover/btn:text-primary transition-colors" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 bg-surface/30 border border-dashed border-surface-border rounded-3xl space-y-4">
                        <Activity className="w-12 h-12 text-slate-700 opacity-20" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">No attendance records discovered matching your query.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

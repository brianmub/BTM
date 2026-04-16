import { supabase } from './supabase';
import { UserProfile } from '@/types';

export const profileService = {
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) throw error;
        return data as UserProfile | null;
    },

    async updateProfile(userId: string, updates: Partial<UserProfile>) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as UserProfile;
    },

    async getStats(organizationId: string) {
        // Fetch aggregate stats for the organization
        const [
            progCount,
            enrollCount,
            attStats,
            certCount,
            revenueStats
        ] = await Promise.all([
            // 1. Active Programs
            supabase.from('programs').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('is_active', true),

            // 2. Total Participants (Enrollments)
            supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).in('status', ['active', 'enrolled', 'pending']),

            // 3. Attendance Stats (for Verification Rate)
            supabase.from('attendance_records').select('status').eq('organization_id', organizationId),

            // 4. Certificates Issued
            supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('is_active', true),

            // 5. Total Revenue
            supabase.from('payment_records').select('amount').eq('organization_id', organizationId).eq('status', 'paid')
        ]);

        const attendance = attStats.data || [];
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const verificationRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 100;

        const totalRevenue = (revenueStats.data || []).reduce((sum, p) => sum + Number(p.amount), 0);

        return {
            programs: progCount.count || 0,
            participants: enrollCount.count || 0,
            verificationRate: `${verificationRate}%`,
            certificates: certCount.count || 0,
            revenue: totalRevenue
        };
    },

    async getRecentActivity(organizationId: string) {
        const { data, error } = await supabase
            .from('attendance_records')
            .select(`
                *,
                users (first_name, surname, profile_photo_url),
                sessions (title)
            `)
            .eq('organization_id', organizationId)
            .order('checked_in_at', { ascending: false })
            .limit(5);

        if (error) throw error;
        return data;
    },

    async getAttendanceLogs(organizationId: string, page: number = 0, pageSize: number = 20) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
            .from('attendance_records')
            .select(`
                *,
                users:user_id(
                    id,
                    first_name, 
                    surname, 
                    profile_photo_url, 
                    email, 
                    organization_id,
                    group_members(
                        group_id,
                        program_groups:group_id(name)
                    )
                ),
                sessions:session_id(title:name, session_date),
                programs:program_id(name)
            `)
            .eq('organization_id', organizationId)
            .order('checked_in_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        // Fetch payment status for these sessions/users in bulk
        // We link attendance_records -> session_enrollments via enrollments
        // Since session_enrollments has session_id and enrollment_id (which maps to user_id)
        const userIds = [...new Set((data || []).map(l => l.user_id))];
        const sessionIds = [...new Set((data || []).map(l => l.session_id))];

        const { data: payments } = await supabase
            .from('session_enrollments')
            .select(`
                payment_status,
                session_id,
                enrollments!inner(user_id)
            `)
            .in('session_id', sessionIds)
            .in('enrollments.user_id', userIds);

        // Map payment status back to logs
        const flattened = (data || []).map((log: any) => {
            const userGroups = log.users?.group_members || [];
            const groupRecord = userGroups.find((gm: any) => gm.group_id === log.group_id) 
                             || userGroups[0];
            
            // Find specific payment for this user and session
            const paymentRecord = (payments || []).find(p => 
                p.session_id === log.session_id && 
                (p.enrollments as any).user_id === log.user_id
            );

            return {
                ...log,
                group_name: groupRecord?.program_groups?.name || 'Unassigned',
                group_id: groupRecord?.group_id || null,
                payment_status: paymentRecord?.payment_status || 'unpaid'
            };
        });

        return flattened;
    },

    async getAnalytics(organizationId: string) {
        // 1. Attendance Flux (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: attData } = await supabase
            .from('attendance_records')
            .select('checked_in_at, status')
            .eq('organization_id', organizationId)
            .gte('checked_in_at', sevenDaysAgo.toISOString());

        // 2. User Expansion (Last 4 weeks)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: enrollData } = await supabase
            .from('enrollments')
            .select('enrolled_at')
            .eq('organization_id', organizationId)
            .gte('enrolled_at', thirtyDaysAgo.toISOString());

        // 3. Program Performance
        const { data: progPerf } = await supabase
            .from('programs')
            .select(`
                id,
                name,
                enrollments!inner (count)
            `)
            .eq('organization_id', organizationId)
            .eq('is_active', true);

        return {
            attendanceFlux: attData || [],
            userExpansion: enrollData || [],
            programPerformance: progPerf || []
        };
    },

    async getGroupStats(programId: string) {
        const { data, error } = await supabase
            .from('program_groups')
            .select(`
                id,
                name,
                facilitator_id,
                facilitator:users!facilitator_id(first_name, surname),
                members:group_members(count)
            `)
            .eq('program_id', programId);
        
        if (error) throw error;
        return data;
    },

    async getGraduationStatus(programId: string, userId: string) {
        // 1. Fetch Program and total required sessions
        const { data: program } = await supabase
            .from('programs')
            .select('*')
            .eq('id', programId)
            .single();

        const { data: sessions } = await supabase
            .from('sessions')
            .select('id')
            .eq('program_id', programId);

        const totalSessions = sessions?.length || 0;

        // 2. Fetch Attendance
        const { data: attendance } = await supabase
            .from('attendance_records')
            .select('status')
            .eq('user_id', userId)
            .eq('organization_id', program.organization_id);

        const attendedCount = attendance?.filter(a => a.status === 'present').length || 0;
        const attendancePercent = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 0;

        return {
            attendedCount,
            totalSessions,
            attendancePercent: Math.min(attendancePercent, 100),
            isEligible: attendedCount >= 5
        };
    },
    async getUserPayments(userId: string) {
        const { data, error } = await supabase
            .from('payment_records')
            .select('*, program:program_id(name), session:session_id(name, session_date)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};


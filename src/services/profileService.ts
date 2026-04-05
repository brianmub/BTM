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
            supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active'),

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

    async getAttendanceLogs(organizationId: string, limit: number = 100) {
        const { data, error } = await supabase
            .from('attendance_records')
            .select(`
                *,
                users:user_id(first_name, surname, profile_photo_url, email, organization_id),
                sessions:session_id(title:name, session_date),
                programs:program_id(name)
            `)
            .eq('organization_id', organizationId)
            .order('checked_in_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
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

        const totalSessions = sessions?.length || 1; // Avoid division by zero

        // 2. Fetch Attendance
        const { data: attendance } = await supabase
            .from('attendance_records')
            .select('status')
            .eq('user_id', userId)
            .eq('organization_id', program.organization_id);

        const attendedCount = attendance?.filter(a => a.status === 'present').length || 0;
        const attendancePercent = (attendedCount / totalSessions) * 100;

        // 3. Fetch Assignments and Submissions
        const { data: assignments } = await supabase
            .from('assignments')
            .select('id')
            .eq('organization_id', program.organization_id);

        const { data: submissions } = await supabase
            .from('assignment_submissions')
            .select('id')
            .eq('user_id', userId);

        const totalAssignments = assignments?.length || 0;
        const submittedCount = submissions?.length || 0;
        const assignmentsPercent = totalAssignments > 0 ? (submittedCount / totalAssignments) * 100 : 100;

        return {
            attendancePercent: Math.min(attendancePercent, 100),
            assignmentsPercent: Math.min(assignmentsPercent, 100),
            isEligible: attendancePercent >= 80 && assignmentsPercent >= 50
        };
    }
};


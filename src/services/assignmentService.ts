import { supabase } from './supabase';

export const assignmentService = {
    async getAssignments(organizationId: string, sessionId?: string) {
        let query = supabase
            .from('assignments')
            .select(`
                *,
                sessions (name)
            `)
            .eq('organization_id', organizationId);

        if (sessionId) {
            query = query.eq('session_id', sessionId);
        }

        const { data, error } = await query.order('due_date', { ascending: true });
        if (error) throw error;
        return data;
    },

    async getAssignmentsByProgram(programId: string) {
        // First get sessions for this program
        const { data: sessions, error: sError } = await supabase
            .from('sessions')
            .select('id')
            .eq('program_id', programId);

        if (sError) throw sError;
        const sessionIds = sessions?.map(s => s.id) || [];

        if (sessionIds.length === 0) return [];

        const { data, error } = await supabase
            .from('assignments')
            .select(`
                *,
                sessions (name)
            `)
            .in('session_id', sessionIds)
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data;
    },

    async createAssignment(assignment: any) {
        const { data, error } = await supabase
            .from('assignments')
            .insert([assignment])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getSubmissions(assignmentId: string) {
        const { data, error } = await supabase
            .from('assignment_submissions')
            .select(`
                *,
                users (first_name, surname, email)
            `)
            .eq('assignment_id', assignmentId);
        if (error) throw error;
        return data;
    },

    async submitAssignment(submission: any) {
        const { data, error } = await supabase
            .from('assignment_submissions')
            .upsert([submission], { onConflict: 'assignment_id, user_id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async gradeSubmission(submissionId: string, gradeData: { score: number, feedback: string, graded_by: string }) {
        const { data, error } = await supabase
            .from('assignment_submissions')
            .update({
                ...gradeData,
                status: 'graded',
                graded_at: new Date().toISOString()
            })
            .eq('id', submissionId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getParticipantSubmissions(userId: string, organizationId: string) {
        const { data, error } = await supabase
            .from('assignment_submissions')
            .select(`
                *,
                assignments (*)
            `)
            .eq('user_id', userId)
            .eq('organization_id', organizationId);
        if (error) throw error;
        return data;
    }
};

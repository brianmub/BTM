import { supabase } from './supabase';
import { Session, Attendance } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const sessionService = {
    async getSessions(programId: string) {
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('program_id', programId)
            .order('session_date', { ascending: true });

        if (error) throw error;
        return data as Session[];
    },

    async updateSession(sessionId: string, updates: Partial<Session>) {
        const { data, error } = await supabase
            .from('sessions')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', sessionId)
            .select()
            .single();

        if (error) throw error;
        return data as Session;
    },

    async deleteSession(sessionId: string) {
        // Guard: Check if attendance records exist
        const { count, error: countError } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId);

        if (countError) throw countError;
        if (count && count > 0) {
            throw new Error('HAS_ATTENDEES');
        }

        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', sessionId);

        if (error) throw error;
    },

    async createSession(session: Partial<Session>) {
        // First, insert with a temporary qr_code_data to let DB generate the ID
        // (Avoiding NOT NULL constraint violation)
        const tempQr = `temp-${uuidv4().substring(0, 8)}`;
        const { data, error } = await supabase
            .from('sessions')
            .insert([{ ...session, qr_code_data: tempQr }])
            .select()
            .single();

        if (error) throw error;

        // If no qr_code_data was provided, update it to use the new ID
        if (!session.qr_code_data) {
            const { data: updated, error: updateError } = await supabase
                .from('sessions')
                .update({ qr_code_data: `sess-${data.id}`, updated_at: new Date().toISOString() })
                .eq('id', data.id)
                .select()
                .single();
            
            if (updateError) throw updateError;
            return updated as Session;
        }

        return data as Session;
    },

    async markAttendance(sessionId: string, userId: string, organizationId: string) {
        // 1. Check for Session Payment (New Requirement)
        const sessEnroll = await this.getSessionPaymentStatus(sessionId, userId);
        if (!sessEnroll || sessEnroll.payment_status !== 'paid') {
            throw new Error('PAYMENT_REQUIRED');
        }

        // 2. Check if attendance already exists
        const { data: existing } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('session_id', sessionId)
            .eq('user_id', userId)
            .single();

        if (existing) {
            // Toggle Logic: If checked in but not checked out, clock them out
            if (existing.checked_in && !existing.exit_time) {
                const { data, error } = await supabase
                    .from('attendance_records')
                    .update({
                        exit_time: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                return { ...data, action: 'clock_out' };
            }

            // If already fully attended, just return or could reset (let's just return for now)
            return { ...existing, action: 'none' };
        }

        const { data, error } = await supabase
            .from('attendance_records')
            .insert([{
                session_id: sessionId,
                user_id: userId,
                organization_id: organizationId,
                checked_in: true,
                checked_in_at: new Date().toISOString(),
                entry_time: new Date().toISOString(),
                status: 'present',
                is_verified: false // Initially not verified if self-checked in
            }])
            .select()
            .single();

        if (error) throw error;
        return { ...data, action: 'clock_in' };
    },

    async processQRCheckin(qrData: string, userId: string, organizationId: string) {
        // 1. Identify if it's a Session QR or User QR
        // If participant scans Session QR:
        if (qrData.startsWith('sess-')) {
            const { data: session, error: sessError } = await supabase
                .from('sessions')
                .select('id, program_id')
                .eq('qr_code_data', qrData)
                .single();

            if (sessError || !session) throw new Error('Invalid Session QR');

            // Mark attendance
            return this.markAttendance(session.id, userId, organizationId);
        }

        // If admin scans Participant QR:
        if (qrData.startsWith('user-')) {
            // Here qrData is likely the enrollment or user ID encoded
            // For simplicity, let's assume it's the user ID for now
            const participantId = qrData.replace('user-', '');
            // We need a sessionId context here, usually passed from the scanning terminal
            // This would be handled in the UI calling this service
        }

        throw new Error('Unsupported QR format');
    },

    async getAttendanceForSession(sessionId: string) {
        const { data, error } = await supabase
            .from('attendance_records')
            .select(`
                *,
                users (
                    first_name,
                    surname,
                    profile_photo_url
                )
            `)
            .eq('session_id', sessionId);

        if (error) throw error;
        return data;
    },

    async getSessionPaymentStatus(sessionId: string, userId: string) {
        // Refined join based on schema: session_enrollments links to enrollments(id) as enrollment_id
        const { data: sessEnroll, error: enrollError } = await supabase
            .from('session_enrollments')
            .select(`
                *,
                enrollments!inner (user_id)
            `)
            .eq('session_id', sessionId)
            .eq('enrollments.user_id', userId)
            .single();

        if (enrollError && enrollError.code !== 'PGRST116') throw enrollError;
        return sessEnroll;
    },

    async recordSessionPayment(
        sessionId: string,
        userId: string,
        organizationId: string,
        amount: number,
        method: string,
        processedById: string,
        paymentStatus: 'paid' | 'pending' = 'paid',
        receiptNumber?: string
    ) {
        // 1. Get enrollment ID
        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', userId)
            .eq('organization_id', organizationId)
            .single();

        if (!enrollment) throw new Error('User not enrolled in program');

        // 2. Upsert session enrollment
        const { data: sessEnroll, error: sessErr } = await supabase
            .from('session_enrollments')
            .upsert([{
                organization_id: organizationId,
                enrollment_id: enrollment.id,
                session_id: sessionId,
                payment_status: paymentStatus,
                amount_paid: paymentStatus === 'paid' ? amount : 0,
                amount_due: amount
            }], { onConflict: 'enrollment_id, session_id' })
            .select()
            .single();

        if (sessErr) throw sessErr;

        // 3. Record in payment_records table for receipt
        const { data: payment, error: payErr } = await supabase
            .from('payment_records')
            .upsert([{
                organization_id: organizationId,
                user_id: userId,
                enrollment_id: enrollment.id,
                session_id: sessionId,
                amount: amount,
                status: 'paid',
                confirmed_by: processedById,
                confirmed_at: new Date().toISOString(),
                receipt_number: receiptNumber?.trim() || `SES-${Date.now().toString().slice(-6)}`
            }], { onConflict: 'session_id, user_id' })
            .select(`
                *,
                user:user_id(first_name, surname),
                program:program_id(name)
            `)
            .single();

        if (payErr) throw payErr;
        return payment;
    },

    async verifyAttendance(attendanceId: string, verifiedById: string) {
        const { data, error } = await supabase
            .from('attendance_records')
            .update({
                is_verified: true,
                verified_by: verifiedById,
                verified_at: new Date().toISOString()
            })
            .eq('id', attendanceId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async bulkVerifyAttendance(sessionId: string, verifiedById: string) {
        const { data, error } = await supabase
            .from('attendance_records')
            .update({
                is_verified: true,
                verified_by: verifiedById,
                verified_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('is_verified', false);

        if (error) throw error;
        return data;
    }
};


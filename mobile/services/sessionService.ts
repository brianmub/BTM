import { supabase } from '../lib/supabase';
import { Session, Attendance } from '../lib/types';
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
            .from('attendance')
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
        // Generate a unique QR code data if not provided
        const qrData = session.qr_code_data || `sess-${uuidv4()}`;

        const { data, error } = await supabase
            .from('sessions')
            .insert([{ ...session, qr_code_data: qrData }])
            .select()
            .single();

        if (error) throw error;
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
            .from('attendance')
            .select('*')
            .eq('session_id', sessionId)
            .eq('user_id', userId)
            .single();

        if (existing) {
            // Toggle Logic: If checked in but not checked out, clock them out
            if (existing.checked_in && !existing.checked_out) {
                const { data, error } = await supabase
                    .from('attendance')
                    .update({
                        checked_out: true,
                        checkout_time: new Date().toISOString(),
                        checkout_method: 'qr'
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
            .from('attendance')
            .insert([{
                session_id: sessionId,
                user_id: userId,
                organization_id: organizationId,
                checked_in: true,
                checkin_time: new Date().toISOString(),
                status: 'present',
                checkin_method: 'qr'
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
            .from('attendance')
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

    async recordSessionPayment(sessionId: string, userId: string, organizationId: string, amount: number, method: string, processedById: string, paymentStatus: 'paid' | 'pending' = 'paid') {
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

        // 3. Record in payments table for receipt
        const { data: payment } = await supabase
            .from('payments')
            .insert([{
                organization_id: organizationId,
                user_id: userId,
                enrollment_id: enrollment.id,
                session_enrollment_id: sessEnroll.id,
                amount: amount,
                payment_method: method,
                status: 'completed',
                receipt_number: `SES-${Date.now().toString().slice(-6)}`,
                processed_by: processedById
            }])
            .select(`
                *,
                user:users(first_name, surname),
                program:programs(name)
            `)
            .single();

        return payment;
    }
};


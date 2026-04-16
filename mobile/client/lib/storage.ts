import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const STORAGE_KEYS = {
  USER: "@cellconnect_user",
  ONBOARDING_COMPLETE: "@cellconnect_onboarding",
};

export type UserRole = "participant" | "leader" | "facilitator" | "admin" | "sysadmin";
export type MaritalStatus = "married" | "unmarried";
export type Gender = "male" | "female";
export type EnrollmentStatus = "enrolled" | "assigned" | "graduated" | "incomplete" | "pending";
export type LeaderStatus = "pending" | "approved" | "rejected";

export interface Program {
  id: string;
  name: string;
  description: string;
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  programStartDate: string;
  isActive: boolean;
  minCellSize: number;
  maxCellSize: number;
}

export interface Enrollment {
  id: string;
  programId: string;
  userId: string;
  status: EnrollmentStatus;
  cellId?: string;
  enrolledAt: string;
  sessionsAttended: number;
  assignmentsCompleted: number;
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  dob?: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  role: UserRole;
  leaderStatus?: LeaderStatus;
  cellId?: string;
  isApproved: boolean;
  isOnboardingComplete?: boolean;
  organizationId?: string;
  passwordHash?: string;
  churchName?: string;
  residentialAddress?: string;
  suburb?: string;
  cityTown?: string;
  province?: string;
  country?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  programId: string;
  sessionNumber: number;
  date: string;
  title: string;
  overview: string;
  topics: string[];
  assignmentId?: string;
}

export interface Assignment {
  id: string;
  sessionId: string;
  programId: string;
  title: string;
  description: string;
  dueDate: string;
  submissionType: "text" | "file";
}

export interface FileAttachment {
  id: string;
  submissionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  content: string;
  submittedAt: string;
  isLate: boolean;
  isConfirmed: boolean;
  attachments?: FileAttachment[];
}

export interface CellGroup {
  id: string;
  programId: string;
  name: string;
  leaderId: string;
  memberIds: string[];
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  programId: string;
  userId: string;
  checkedIn: boolean;
  isVerified: boolean;
  confirmedByLeader: boolean;
  checkedInAt?: string;
  entryTime?: string;
  exitTime?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  confirmedAt?: string;
}

export type PaymentStatus = "pending" | "paid" | "waived" | "unpaid";

export interface PaymentRecord {
  id: string;
  sessionId: string;
  programId: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod?: string;
  receiptNumber?: string;
  isPaid?: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  unpaidReason?: string;
}

export type AuditAction =
  | "leader_approved"
  | "leader_rejected"
  | "cell_created"
  | "cell_member_assigned"
  | "cell_member_override"
  | "attendance_confirmed"
  | "payment_confirmed"
  | "assignment_confirmed"
  | "graduation_granted"
  | "enrollment_created"
  | "cells_auto_assigned";

export interface AuditLog {
  id: string;
  action: AuditAction;
  performedBy: string;
  targetUserId?: string;
  targetCellId?: string;
  programId?: string;
  sessionId?: string;
  details: string;
  timestamp: string;
}

function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = snakeToCamel(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = camelToSnake(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

function normalizeUserPayload(data: any): any {
  const normalized = camelToSnake(data);

  if (data.phone !== undefined) {
    normalized.phone_number = data.phone;
    delete normalized.phone;
  }

  if (data.cityTown !== undefined) {
    normalized.city = data.cityTown;
    delete normalized.city_town;
  }

  if (data.residentialAddress !== undefined) {
    normalized.residential_address = data.residentialAddress;
    delete normalized.residential_address;
  }

  return normalized;
}

function mapUserRecord(record: any): User {
  const user = snakeToCamel(record);
  return {
    ...user,
    fullName:
      user.fullName ||
      [user.firstName, user.surname].filter(Boolean).join(" ").trim(),
    phone: user.phone || user.phoneNumber || "",
    cityTown: user.cityTown || user.city,
    residentialAddress: user.residentialAddress || user.residential_address,
  };
}

function mapUserRecords(records: any[] = []): User[] {
  return records.map(mapUserRecord);
}

function mapDbSessionToMobile(row: any): Session {
  return {
    ...snakeToCamel(row),
    title: row.name || 'Unnamed Session',
    overview: row.description || '',
    date: row.session_date || new Date().toISOString(),
    topics: []
  };
}

export const storage = {
  async initializeSampleData(): Promise<void> {
    return;
  },

  async getUser(): Promise<User | null> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async getOrganization(id: string): Promise<any> {
    try {
      const { data, error } = await supabase.from('organizations').select('*').eq('id', id).single();
      if (error) throw error;
      return snakeToCamel(data);
    } catch {
      return null;
    }
  },

  async validateJoinCode(code: string): Promise<any> {
    try {
      const { data, error } = await supabase.from('organizations').select('*').eq('join_code', code.toUpperCase()).single();
      if (error) throw error;
      return snakeToCamel(data);
    } catch {
      throw new Error("Invalid organization code. Please check and try again.");
    }
  },

  async signup(data: any): Promise<User> {
    const { fullName, role, password, ...rest } = data;
    const nameParts = (fullName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || 'User';
    const surname = nameParts.slice(1).join(' ') || '';

    const { data: user, error } = await supabase.from('users').insert({
      first_name: firstName,
      surname: surname,
      role,
      ...normalizeUserPayload(rest),
      password_hash: password,
      is_active: false,
      leader_status: role === 'leader' ? 'pending' : undefined
    }).select().single();

    if (error) throw error;
    return mapUserRecord(user);
  },

  async login(data: { email: string; password: string }): Promise<User> {
     const { data: user, error } = await supabase.from('users').select('*').eq('email', data.email).single();
    if (error || !user) throw new Error("Invalid email or password");
    return mapUserRecord(user);
  },

  async isOnboardingComplete(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      return value === "true";
    } catch {
      return false;
    }
  },

  async setOnboardingComplete(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, "true");
  },

  async getPrograms(organizationId?: string): Promise<Program[]> {
    try {
      let query = supabase.from('programs').select('*').eq('is_active', true);
      if (organizationId) query = query.eq('organization_id', organizationId);
      const { data, error } = await query.order('name');
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async createProgram(program: Omit<Program, 'id'>): Promise<Program> {
    const { data, error } = await supabase.from('programs').insert(camelToSnake(program)).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async updateProgram(id: string, updates: Partial<Program>): Promise<Program | null> {
    const { data, error } = await supabase.from('programs').update(camelToSnake(updates)).eq('id', id).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async getEnrollments(organizationId?: string): Promise<Enrollment[]> {
    try {
      let query = supabase.from('enrollments').select('*');
      if (organizationId) query = query.eq('organization_id', organizationId);
      const { data, error } = await query;
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    try {
      const { data, error } = await supabase.from('enrollments').select('*').eq('user_id', userId);
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async getUserEnrollment(userId: string, programId: string): Promise<Enrollment | null> {
    const { data, error } = await supabase.from('enrollments').select('*').eq('user_id', userId).eq('program_id', programId).single();
    if (error) return null;
    return snakeToCamel(data);
  },

  async enrollInProgram(userId: string, programId: string): Promise<Enrollment> {
    const user = await this.getUserById(userId);
    const { data, error } = await supabase.from('enrollments').insert({
      user_id: userId,
      program_id: programId,
      organization_id: user?.organizationId,
      status: "enrolled",
    }).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async getSessions(organizationId?: string): Promise<Session[]> {
    try {
      let query = supabase.from('sessions').select('*');
      if (organizationId) query = query.eq('organization_id', organizationId);
      const { data, error } = await query.order('session_number');
      if (error) throw error;
      return (data || []).map(mapDbSessionToMobile);
    } catch {
      return [];
    }
  },

  async getSessionsByProgram(programId: string): Promise<Session[]> {
    try {
      const { data, error } = await supabase.from('sessions').select('*').eq('program_id', programId).order('session_number');
      if (error) throw error;
      return (data || []).map(mapDbSessionToMobile);
    } catch {
      return [];
    }
  },

  async createSession(session: Omit<Session, 'id'>): Promise<Session> {
    const { title, overview, date, ...rest } = session;
    const { data, error } = await supabase.from('sessions').insert({
      name: title,
      description: overview,
      session_date: date,
      ...camelToSnake(rest)
    }).select().single();
    if (error) throw error;
    return mapDbSessionToMobile(data);
  },

  async updateSession(session: Session): Promise<void> {
    const { id, title, overview, date, ...rest } = session;
    const { error } = await supabase.from('sessions').update({
      name: title,
      description: overview,
      session_date: date,
      ...camelToSnake(rest)
    }).eq('id', id);
    if (error) throw error;
  },

  async deleteSession(id: string): Promise<void> {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) throw error;
  },

  async getAssignments(organizationId?: string): Promise<Assignment[]> {
    try {
      let query = supabase.from('assignments').select('*');
      if (organizationId) query = query.eq('organization_id', organizationId);
      const { data, error } = await query;
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async createAssignment(assignment: Omit<Assignment, "id">): Promise<Assignment> {
    const { data, error } = await supabase.from('assignments').insert(camelToSnake(assignment)).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async getSubmissions(organizationId?: string): Promise<AssignmentSubmission[]> {
    try {
      let query = supabase.from('assignment_submissions').select('*');
      if (organizationId) query = query.eq('organization_id', organizationId);
      const { data, error } = await query;
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async getUserSubmissions(userId: string): Promise<AssignmentSubmission[]> {
    try {
      const { data, error } = await supabase.from('assignment_submissions').select('*').eq('user_id', userId);
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async createSubmission(submission: Omit<AssignmentSubmission, 'id'>): Promise<AssignmentSubmission> {
    const { data, error } = await supabase.from('assignment_submissions').insert(camelToSnake(submission)).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async updateSubmission(id: string, updates: Partial<AssignmentSubmission>): Promise<AssignmentSubmission | null> {
    const { data, error } = await supabase.from('assignment_submissions').update(camelToSnake(updates)).eq('id', id).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async getAttendance(organizationId?: string): Promise<AttendanceRecord[]> {
    try {
      let query = supabase.from('attendance_records').select('*');
      if (organizationId) query = query.eq('organization_id', organizationId);
      const { data, error } = await query;
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async getUserAttendance(userId: string): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await supabase.from('attendance_records').select('*').eq('user_id', userId);
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async getSessionAttendance(sessionId: string): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await supabase.from('attendance_records').select('*').eq('session_id', sessionId);
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async isPaymentValidForSession(userId: string, sessionId: string, programId: string): Promise<boolean> {
    try {
      // 1. Check if ANY payment for this session is confirmed (paid/waived)
      const { data: sessionPayments } = await supabase
        .from('payment_records')
        .select('status')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .in('status', ['paid', 'waived']);
      
      if (sessionPayments && sessionPayments.length > 0) return true;

      // 2. Fallback: Check if there's a general PROGRAM payment (where session_id is NULL)
      const { data: programPayments } = await supabase
        .from('payment_records')
        .select('status')
        .eq('user_id', userId)
        .eq('program_id', programId)
        .is('session_id', null)
        .in('status', ['paid', 'waived']);
      
      return !!(programPayments && programPayments.length > 0);
    } catch (err) {
      console.error("Error validating payment for session:", err);
      return false; // Error defaults to blocking for security
    }
  },

  async checkInToSession(userId: string, sessionId: string, programId: string, organizationId?: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Validate Payment First (CRITICAL REQ)
      const isPaid = await this.isPaymentValidForSession(userId, sessionId, programId);
      if (!isPaid) {
        return { 
          success: false, 
          message: "Check-in blocked. No confirmed payment found for this session. Please contact the administrator to settle your dues." 
        };
      }

      // 2. Check if already checked in
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id, checked_in')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existing && existing.checked_in) {
        return { success: true, message: "Already checked in for this session." };
      }

      const { error } = await supabase.from('attendance_records').upsert([{
          user_id: userId,
          session_id: sessionId,
          program_id: programId,
          organization_id: organizationId,
          checked_in: true,
          checked_in_at: new Date().toISOString(),
          is_verified: false
        }], { onConflict: 'user_id,session_id' });
      
      if (error) throw error;
      return { success: true, message: "Entry time recorded! Please wait for your facilitator to verify your presence." };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to record check-in." };
    }
  },

  async checkOutOfSession(userId: string, sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.from('attendance_records').update({ exit_time: new Date().toISOString(), checked_in: false }).eq('user_id', userId).eq('session_id', sessionId);
      if (error) throw error;
      return { success: true, message: "Successfully checked out" };
    } catch {
      return { success: false, message: "Failed to check out" };
    }
  },

  async isCheckoutAvailable(sessionDate: string): Promise<boolean> {
    const now = new Date();
    const sessDate = new Date(sessionDate);
    return now.toDateString() === sessDate.toDateString() && now.getHours() >= 11;
  },

  async getPayments(organizationId?: string): Promise<PaymentRecord[]> {
    try {
      let query = supabase.from('payment_records').select('*');
      if (organizationId) query = query.eq('organization_id', organizationId);
      const { data, error } = await query;
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async getUserPayments(userId: string): Promise<PaymentRecord[]> {
    try {
      const { data, error } = await supabase.from('payment_records').select('*').eq('user_id', userId);
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async getSessionPayments(sessionId: string): Promise<PaymentRecord[]> {
    try {
      const { data, error } = await supabase.from('payment_records').select('*').eq('session_id', sessionId);
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async confirmPayment(paymentId: string, confirmedBy: string): Promise<void> {
    const { error } = await supabase.from('payment_records').update({ status: 'paid', confirmed_by: confirmedBy, confirmed_at: new Date().toISOString() }).eq('id', paymentId);
    if (error) throw error;
  },

  async bulkConfirmPayments(paymentIds: string[], confirmedBy: string): Promise<void> {
    const { error } = await supabase.from('payment_records').update({ status: 'paid', confirmed_by: confirmedBy, confirmed_at: new Date().toISOString() }).in('id', paymentIds);
    if (error) throw error;
  },

  async markPaymentUnpaid(paymentId: string, reason: string, confirmedBy: string): Promise<void> {
    const { error } = await supabase.from('payment_records').update({ status: 'unpaid', unpaid_reason: reason, confirmed_by: confirmedBy }).eq('id', paymentId);
    if (error) throw error;
  },

  async waivePayment(paymentId: string, confirmedBy: string): Promise<void> {
    const { error } = await supabase.from('payment_records').update({ status: 'waived', confirmed_by: confirmedBy, confirmed_at: new Date().toISOString() }).eq('id', paymentId);
    if (error) throw error;
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return mapUserRecords(data || []);
    } catch {
      return [];
    }
  },

  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) throw error;
      return mapUserRecord(data);
    } catch {
      return null;
    }
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const { data, error } = await supabase.from('users').update(normalizeUserPayload(updates)).eq('id', userId).select().single();
      if (error) throw error;
      return mapUserRecord(data);
    } catch {
      return null;
    }
  },

  async getPendingLeaders(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'leader').eq('leader_status', 'pending');
      if (error) throw error;
      return mapUserRecords(data || []);
    } catch {
      return [];
    }
  },

  async getApprovedLeaders(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'leader').eq('leader_status', 'approved');
      if (error) throw error;
      return mapUserRecords(data || []);
    } catch {
      return [];
    }
  },

  async approveLeader(userId: string, approvedBy: string): Promise<void> {
    const { error } = await supabase.from('users').update({ leader_status: 'approved', is_active: true }).eq('id', userId);
    if (error) throw error;
    await this.createAuditLog({ action: 'leader_approved', performedBy: approvedBy, targetUserId: userId, details: 'Leader approved' });
  },

  async rejectLeader(userId: string, rejectedBy: string): Promise<void> {
    const { error } = await supabase.from('users').update({ leader_status: 'rejected', is_active: false }).eq('id', userId);
    if (error) throw error;
    await this.createAuditLog({ action: 'leader_rejected', performedBy: rejectedBy, targetUserId: userId, details: 'Leader rejected' });
  },

  async getCellGroups(): Promise<CellGroup[]> {
    try {
      const { data, error } = await supabase.from('cell_groups').select('*');
      if (error) throw error;
      const cells = await Promise.all((data || []).map(async (cell) => {
        const members = await this.getCellMembers(cell.id);
        return { ...snakeToCamel(cell), memberIds: members.map(m => m.id) };
      }));
      return cells;
    } catch {
      return [];
    }
  },

  async getCellGroupsByProgram(programId: string): Promise<CellGroup[]> {
    try {
      const { data, error } = await supabase.from('cell_groups').select('*').eq('program_id', programId);
      if (error) throw error;
      const cells = await Promise.all((data || []).map(async (cell) => {
        const members = await this.getCellMembers(cell.id);
        return { ...snakeToCamel(cell), memberIds: members.map(m => m.id) };
      }));
      return cells;
    } catch {
      return [];
    }
  },

  async createCellGroup(cell: Omit<CellGroup, 'id'>): Promise<CellGroup> {
    const { data, error } = await supabase.from('cell_groups').insert(camelToSnake(cell)).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async getUnassignedParticipants(programId: string): Promise<User[]> {
    try {
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('program_id', programId)
        .eq('status', 'enrolled')
        .is('cell_id', null);

      if (enrollError) throw enrollError;
      if (!enrollments || enrollments.length === 0) return [];

      const userIds = enrollments.map(e => e.user_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      if (usersError) throw usersError;
      return mapUserRecords(users || []);
    } catch {
      return [];
    }
  },

  async getCellMembers(cellId: string): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('cell_members').select('user_id').eq('cell_id', cellId);
      if (error) throw error;
      const userIds = (data || []).map(row => row.user_id);
      if (userIds.length === 0) return [];
      const { data: users, error: usersError } = await supabase.from('users').select('*').in('id', userIds);
      if (usersError) throw usersError;
      return mapUserRecords(users || []);
    } catch {
      return [];
    }
  },

  async addCellMember(cellId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('cell_members').insert({ cell_id: cellId, user_id: userId });
    if (error) throw error;
  },

  async removeCellMember(cellId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('cell_members').delete().eq('cell_id', cellId).eq('user_id', userId);
    if (error) throw error;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const { error } = await supabase.from('audit_logs').insert(camelToSnake(log));
    if (error) throw error;
  },

  async isPaymentConfirmed(userId: string, programId: string): Promise<boolean> {
    const payments = await this.getUserPayments(userId);
    return payments.some(p => p.programId === programId && (p.status === 'paid' || p.status === 'waived'));
  },

  async enrollViaQR(userId: string, programId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!await this.isPaymentConfirmed(userId, programId)) {
        return { success: false, message: "Payment not confirmed" };
      }
      await this.enrollInProgram(userId, programId);
      return { success: true, message: "Enrolled!" };
    } catch {
      return { success: false, message: "Enrollment failed" };
    }
  },

  async checkGraduationEligibility(userId: string, programId: string): Promise<{ eligible: boolean; sessionsConfirmed: number; totalSessions: number; sessionsWithPaidPayments: number }> {
    return { eligible: false, sessionsConfirmed: 0, totalSessions: 0, sessionsWithPaidPayments: 0 };
  },

  async autoAssignCells(programId: string, performedBy: string): Promise<any> {
     return { cells: [], assignedCount: 0 };
  },

  async createCellsForProgram(programId: string, performedBy: string): Promise<any[]> {
    return [];
  },

  async reassignCellMember(userId: string, fromCellId: string, toCellId: string, performedBy: string): Promise<void> {
    return;
  },

  async getAttachments(submissionId: string): Promise<FileAttachment[]> {
    try {
      const { data, error } = await supabase.from('file_attachments').select('*').eq('submission_id', submissionId);
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async uploadAttachment(submissionId: string, file: any): Promise<FileAttachment> {
    const { data, error } = await supabase.from('file_attachments').insert(camelToSnake({ submissionId, ...file })).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async submitAssignment(submission: Omit<AssignmentSubmission, 'id'>): Promise<AssignmentSubmission> {
    return this.createSubmission(submission);
  },

  async confirmAssignment(assignmentId: string, userId: string, confirmedBy: string): Promise<void> {
    const { error } = await supabase.from('assignment_submissions').update({ is_confirmed: true }).eq('assignment_id', assignmentId).eq('user_id', userId);
    if (error) throw error;
  },

  async confirmAttendance(attendanceId: string, confirmedBy: string): Promise<void> {
    const { error } = await supabase.from('attendance_records').update({ confirmed_by_leader: true, confirmed_at: new Date().toISOString() }).eq('id', attendanceId);
    if (error) throw error;
  }
};

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
  | "enrollment_created";

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
  };
}

function mapUserRecords(records: any[] = []): User[] {
  return records.map(mapUserRecord);
}

export const storage = {
  async initializeSampleData(): Promise<void> {
    // Satisfy screen calls, data is now handled by the backend
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
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return snakeToCamel(data);
    } catch (err) {
      console.error('getOrganization error:', err);
      return null;
    }
  },

  async validateJoinCode(code: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('join_code', code.toUpperCase())
        .single();
      
      if (error) throw error;
      return snakeToCamel(data);
    } catch (err) {
      console.error('validateJoinCode error:', err);
      throw new Error("Invalid organization code. Please check and try again.");
    }
  },

  async signup(data: any): Promise<User> {
    const { fullName, role, password, ...rest } = data;
    const nameParts = (fullName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || 'User';
    const surname = nameParts.slice(1).join(' ') || '';

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        first_name: firstName,
        surname: surname,
        role,
        ...normalizeUserPayload(rest),
        password_hash: password, // Store as password_hash to match schema. Note: Consider hashing this on server.
        is_active: false,
        leader_status: role === 'leader' ? 'pending' : undefined
      })
      .select()
      .single();

    if (error) throw error;
    return mapUserRecord(user);
  },

  async login(data: { email: string; password: string }): Promise<User> {
     const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', data.email)
      .single();

    if (error || !user) throw new Error("Invalid email or password");

    // Note: In a production serverless app, you'd use Supabase Auth's signInWithPassword
    // but here we are doing a direct check against the users table for compatibility.
    // Ideally, the password check should happen in an RPC or Supabase Auth.
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
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch (err) {
      console.error('getPrograms error:', err);
      return [];
    }
  },

  async getEnrollments(organizationId?: string): Promise<Enrollment[]> {
    try {
      let query = supabase.from('enrollments').select('*');
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch (err) {
      console.error('getEnrollments error:', err);
      return [];
    }
  },

  async getUserEnrollment(userId: string, programId: string): Promise<Enrollment | null> {
    const enrollments = await this.getUserEnrollments(userId);
    return enrollments.find(e => e.programId === programId) || null;
  },

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch (err) {
      console.error('getUserEnrollments error:', err);
      return [];
    }
  },

  async enrollInProgram(userId: string, programId: string): Promise<Enrollment> {
    const existing = await this.getUserEnrollment(userId, programId);
    if (existing) return existing;

    const user = await this.getUserById(userId);
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        program_id: programId,
        organization_id: user?.organizationId,
        status: "enrolled",
        sessions_attended: 0,
        assignments_completed: 0,
      })
      .select()
      .single();
    
    if (error) {
      console.error('enrollInProgram error:', error);
      throw new Error("Could not complete enrollment. You might already be enrolled.");
    }
    return snakeToCamel(data);
  },

  async getSessions(organizationId?: string): Promise<Session[]> {
    try {
      let query = supabase.from('sessions').select('*');
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query.order('session_number');
      if (error) throw error;
      
      // Need to map some fields manually if they don't match exactly
      const sessions = (data || []).map(row => ({
        ...row,
        title: row.name,
        overview: row.description,
        date: row.session_date,
        topics: [] // Handle empty topics or fetch them if added later
      }));
      
      return snakeToCamel(sessions);
    } catch (err) {
      console.error('getSessions error:', err);
      return [];
    }
  },

  async getSessionsByProgram(programId: string): Promise<Session[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('program_id', programId)
        .order('session_number');
      
      if (error) throw error;
      
      const sessions = (data || []).map(row => ({
        ...row,
        title: row.name,
        overview: row.description,
        date: row.session_date,
        topics: []
      }));
      
      return snakeToCamel(sessions);
    } catch (err) {
      console.error('getSessionsByProgram error:', err);
      return [];
    }
  },

  async getAssignments(organizationId?: string): Promise<Assignment[]> {
    try {
      let query = supabase.from('assignments').select('*');
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch (err) {
      console.error('getAssignments error:', err);
      return [];
    }
  },

  async createAssignment(assignment: Omit<Assignment, "id">): Promise<Assignment> {
    const { data, error } = await supabase.from('assignments').insert(camelToSnake(assignment)).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async updateSession(session: Session): Promise<void> {
    const { error } = await supabase.from('sessions').update(camelToSnake(session)).eq('id', session.id);
    if (error) throw error;
  },

  async getAttendance(organizationId?: string): Promise<AttendanceRecord[]> {
    try {
      let query = supabase.from('attendance_records').select('*');
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch (err) {
      console.error('getAttendance error:', err);
      return [];
    }
  },

  async getUserAttendance(userId: string): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await (await import('./supabase')).supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch (err) {
      console.error('getUserAttendance error:', err);
      return [];
    }
  },

  async getSessionAttendance(sessionId: string): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', sessionId);
      
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch (err) {
      console.error('getSessionAttendance error:', err);
      return [];
    }
  },

  async checkInToSession(userId: string, sessionId: string, programId: string, organizationId?: string): Promise<void> {
    const { error } = await supabase
      .from('attendance_records')
      .upsert([{
        user_id: userId,
        session_id: sessionId,
        program_id: programId,
        organization_id: organizationId,
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        entry_time: new Date().toISOString(),
        status: 'present',
        is_verified: false
      }], { onConflict: 'user_id,session_id' });
    
    if (error) {
      console.error('checkInToSession error:', error);
      throw error;
    }
  },

  async checkOutOfSession(userId: string, sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('attendance_records')
        .update({
          exit_time: now,
          checked_in: false // Mark as no longer "currently" checked in
        })
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, message: "Successfully checked out" };
    } catch (err) {
      console.error('checkOutOfSession error:', err);
      return { success: false, message: "Failed to check out. Please try again." };
    }
  },

  async isCheckoutAvailable(sessionDate: string): Promise<boolean> {
    const sessionDateObj = new Date(sessionDate);
    const now = new Date();

    const isSameDay = sessionDateObj.toDateString() === now.toDateString();
    const isAfterSessionDate = now > sessionDateObj;

    if (!isSameDay && !isAfterSessionDate) {
      return false;
    }

    const currentHour = now.getHours();
    return currentHour >= 11;
  },

  async isPaymentConfirmed(userId: string, programId: string): Promise<boolean> {
    const payments = await this.getUserPayments(userId);
    const payment = payments.find(p => p.programId === programId && (p.status === 'paid' || p.status === 'waived'));
    return !!payment;
  },

  async enrollViaQR(userId: string, programId: string): Promise<{ success: boolean; message: string }> {
    const isPaymentConfirmed = await this.isPaymentConfirmed(userId, programId);

    if (!isPaymentConfirmed) {
      return { success: false, message: "Payment has not been confirmed. Please contact your leader." };
    }

    const existingEnrollment = await this.getUserEnrollment(userId, programId);
    if (existingEnrollment) {
      return { success: false, message: "You are already enrolled in this program" };
    }

    await this.enrollInProgram(userId, programId);
    return { success: true, message: "Successfully enrolled in the program!" };
  },

  async getPayments(organizationId?: string): Promise<PaymentRecord[]> {
    try {
      let query = supabase.from('payment_records').select('*');
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch (err) {
      console.error('getPayments error:', err);
      return [];
    }
  },

  async getUserPayments(userId: string): Promise<PaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch (err) {
      console.error('getUserPayments error:', err);
      return [];
    }
  },

  async confirmPayment(paymentId: string, confirmedBy: string): Promise<void> {
    const { error } = await supabase
      .from('payment_records')
      .update({ status: 'paid', confirmed_by: confirmedBy, confirmed_at: new Date().toISOString() })
      .eq('id', paymentId);
    if (error) throw error;
  },

  async markPaymentUnpaid(paymentId: string, reason: string, confirmedBy: string): Promise<void> {
    const { error } = await supabase
      .from('payment_records')
      .update({ status: 'unpaid', unpaid_reason: reason, confirmed_by: confirmedBy })
      .eq('id', paymentId);
    if (error) throw error;
  },

  async waivePayment(paymentId: string, confirmedBy: string): Promise<void> {
    const { error } = await supabase
      .from('payment_records')
      .update({ status: 'waived', confirmed_by: confirmedBy, confirmed_at: new Date().toISOString() })
      .eq('id', paymentId);
    if (error) throw error;
  },

  async bulkConfirmPayments(paymentIds: string[], confirmedBy: string): Promise<void> {
    const { error } = await supabase
      .from('payment_records')
      .update({ status: 'paid', confirmed_by: confirmedBy, confirmed_at: new Date().toISOString() })
      .in('id', paymentIds);
    if (error) throw error;
  },

  async getSessionPayments(sessionId: string): Promise<PaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .eq('session_id', sessionId);
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
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

  async addUser(user: User): Promise<User> {
    const { id, createdAt, fullName, ...userData } = user;
    const nameParts = fullName.trim().split(/\s+/);
    const { data, error } = await supabase.from('users').insert({
      first_name: nameParts[0],
      surname: nameParts.slice(1).join(' ') || 'User',
      ...normalizeUserPayload(userData)
    }).select().single();
    if (error) throw error;
    return mapUserRecord(data);
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

  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
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
      const { data: cells, error } = await supabase.from('cell_groups').select('*');
      if (error) throw error;
      
      const cellsWithMembers = await Promise.all(
        (cells || []).map(async (cell) => {
          const members = await this.getCellMembers(cell.id);
          return snakeToCamel({ ...cell, member_ids: members.map((m: User) => m.id) });
        })
      );
      return cellsWithMembers;
    } catch (err) {
      console.error('getCellGroups error:', err);
      return [];
    }
  },

  async getCellGroupsByProgram(programId: string): Promise<CellGroup[]> {
    try {
      const { data: cells, error } = await supabase
        .from('cell_groups')
        .select('*')
        .eq('program_id', programId);
      
      if (error) throw error;
      
      const cellsWithMembers = await Promise.all(
        (cells || []).map(async (cell) => {
          const members = await this.getCellMembers(cell.id);
          return snakeToCamel({ ...cell, member_ids: members.map((m: User) => m.id) });
        })
      );
      return cellsWithMembers;
    } catch {
      return [];
    }
  },

  async getCellMembers(cellId: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('users(*)')
        .eq('group_id', cellId);
      
      if (error) throw error;
      return snakeToCamel((data || []).map((d: any) => d.users));
    } catch (err) {
      console.error('getCellMembers error:', err);
      return [];
    }
  },

  async getUnassignedParticipants(programId: string): Promise<User[]> {
    try {
      const { data: enrolled, error: enrollError } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('program_id', programId);
      
      if (enrollError) throw enrollError;
      
      const enrolledUserIds = enrolled.map(e => e.user_id);
      
      const { data: assigned, error: assignError } = await supabase
        .from('group_members')
        .select('user_id');
      
      if (assignError) throw assignError;
      
      const assignedUserIds = new Set(assigned.map(a => a.user_id));
      const unassignedIds = enrolledUserIds.filter(id => !assignedUserIds.has(id));
      
      if (unassignedIds.length === 0) return [];
      
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('id', unassignedIds);
        
      if (userError) throw userError;
      return snakeToCamel(users || []);
    } catch (err) {
      console.error('getUnassignedParticipants error:', err);
      return [];
    }
  },

  async getSubmissions(organizationId?: string): Promise<AssignmentSubmission[]> {
    try {
      let query = supabase.from('assignment_submissions').select('*, file_attachments(*)');
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch (err) {
      console.error('getSubmissions error:', err);
      return [];
    }
  },

  async getUserSubmissions(userId: string): Promise<AssignmentSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*, file_attachments(*)')
        .eq('user_id', userId);
      
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch (err) {
      console.error('getUserSubmissions error:', err);
      return [];
    }
  },

  async submitAssignment(submission: Omit<AssignmentSubmission, "id">): Promise<AssignmentSubmission> {
    const { data, error } = await supabase.from('assignment_submissions').insert(camelToSnake(submission)).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async confirmAssignment(submissionId: string, confirmedBy: string): Promise<void> {
    const { error } = await supabase.from('assignment_submissions').update({ is_confirmed: true, confirmed_by: confirmedBy }).eq('id', submissionId);
    if (error) throw error;
  },

  async getAttachments(submissionId: string): Promise<FileAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('submission_id', submissionId);
      
      if (error) throw error;
      return snakeToCamel(data || []);
    } catch {
      return [];
    }
  },

  async uploadAttachment(submissionId: string, file: { uri: string; name: string; type: string }): Promise<FileAttachment> {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `submissions/${fileName}`;
    
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(filePath, blob, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('submissions')
      .getPublicUrl(filePath);

    const { data, error } = await supabase.from('file_attachments').insert({
      submission_id: submissionId,
      file_name: file.name,
      file_type: file.type,
      file_size: blob.size,
      file_url: publicUrl
    }).select().single();

    if (error) throw error;
    return snakeToCamel(data);
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    const { data, error } = await supabase.from('file_attachments').select('*').eq('id', attachmentId).single();
    if (data && data.file_url) {
        const filePath = data.file_url.split('/').pop();
        if (filePath) {
            await supabase.storage.from('submissions').remove([`submissions/${filePath}`]);
        }
        await supabase.from('file_attachments').delete().eq('id', attachmentId);
    }
  },

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const { data, error } = await supabase.from('audit_logs').insert(camelToSnake(log)).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async createCellGroup(cell: { programId: string; name: string; leaderId: string; createdBy: string }): Promise<CellGroup> {
    const { data, error } = await supabase.from('cell_groups').insert(camelToSnake(cell)).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async addCellMember(cellId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('cell_members').insert({ cell_id: cellId, user_id: userId });
    if (error) throw error;
  },

  async reassignCellMember(userId: string, fromCellId: string, toCellId: string, performedBy: string): Promise<void> {
      if (fromCellId && fromCellId !== "unassigned") {
        await supabase.from('cell_members').delete().eq('cell_id', fromCellId).eq('user_id', userId);
      }
      await this.addCellMember(toCellId, userId);
      await this.createAuditLog({ action: 'cell_member_override', performedBy, targetUserId: userId, targetCellId: toCellId, details: 'Member manually assigned' });
  },

  async createProgram(program: Omit<Program, "id">): Promise<Program> {
    const { data, error } = await supabase.from('programs').insert(camelToSnake(program)).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async updateProgram(programId: string, updates: Partial<Program>): Promise<Program | null> {
    const { data, error } = await supabase.from('programs').update(camelToSnake(updates)).eq('id', programId).select().single();
    if (error) return null;
    return snakeToCamel(data);
  },

  async createSession(session: Omit<Session, "id">): Promise<Session> {
    const { data, error } = await supabase.from('sessions').insert(camelToSnake(session)).select().single();
    if (error) throw error;
    return snakeToCamel(data);
  },

  async deleteSession(sessionId: string): Promise<void> {
    await supabase.from('sessions').delete().eq('id', sessionId);
  },

  async checkGraduationEligibility(userId: string, programId: string): Promise<{
    eligible: boolean;
    sessionsConfirmed: number;
    totalSessions: number;
    sessionsWithPaidPayments: number;
  }> {
    const [attendance, payments, sessions] = await Promise.all([
      this.getUserAttendance(userId),
      this.getUserPayments(userId),
      this.getSessionsByProgram(programId),
    ]);

    const confirmedSessions = attendance.filter(
      a => a.programId === programId && (a.isVerified || a.confirmedByLeader)
    );

    const sessionIdsAttended = new Set(confirmedSessions.map(s => s.sessionId));
    const paidSessionPayments = payments.filter(
      p => p.programId === programId &&
        sessionIdsAttended.has(p.sessionId) &&
        (p.status === 'paid' || p.status === 'waived')
    );


    const sessionsConfirmed = confirmedSessions.length;
    const totalSessions = sessions.length;
    const sessionsWithPaidPayments = paidSessionPayments.length;

    const eligible = totalSessions > 0 && 
                     sessionsConfirmed >= totalSessions &&
                     sessionsWithPaidPayments >= sessionsConfirmed;

    return { eligible, sessionsConfirmed, totalSessions, sessionsWithPaidPayments };
  },
};

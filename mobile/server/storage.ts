import { supabase } from './lib/supabase';

export interface User {
  id: string;
  full_name: string; // Combined from first_name and surname
  first_name?: string;
  surname?: string;
  phone: string;
  email: string;
  password_hash?: string;
  gender: 'male' | 'female';
  marital_status: 'married' | 'unmarried';
  role: string; // Flexible role
  leader_status?: 'pending' | 'approved' | 'rejected';
  cell_id?: string;
  is_active: boolean;
  is_onboarding_complete?: boolean;
  organization_id?: string;
  created_at: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  enrollment_start_date: string;
  enrollment_end_date: string;
  program_start_date: string;
  is_active: boolean;
  min_cell_size: number;
  max_cell_size: number;
}

export interface Session {
  id: string;
  program_id: string;
  session_number: number;
  date: string;
  title: string;
  overview: string;
  topics: string[];
  assignment_id?: string;
}

export interface Enrollment {
  id: string;
  program_id: string;
  user_id: string;
  status: 'enrolled' | 'assigned' | 'graduated' | 'incomplete';
  cell_id?: string;
  enrolled_at: string;
  sessions_attended: number;
  assignments_completed: number;
}

export interface CellGroup {
  id: string;
  program_id: string;
  name: string;
  leader_id: string;
}

export interface Assignment {
  id: string;
  session_id: string;
  program_id: string;
  title: string;
  description: string;
  due_date: string;
  submission_type: 'text' | 'file';
}

export interface FileAttachment {
  id: string;
  submission_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  content: string;
  submitted_at: string;
  is_late: boolean;
  is_confirmed: boolean;
  attachments?: FileAttachment[];
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  program_id: string;
  user_id: string;
  checked_in: boolean;
  checked_in_at?: string;
  entry_time?: string;
  exit_time?: string;
  confirmed_by_leader: boolean;
  confirmed_at?: string;
}

export type PaymentStatus = "pending" | "paid" | "waived" | "unpaid";

export interface PaymentRecord {
  id: string;
  session_id: string;
  program_id: string;
  user_id: string;
  amount?: number;
  status: PaymentStatus;
  confirmed_by?: string;
  confirmed_at?: string;
  unpaid_reason?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performed_by: string;
  target_user_id?: string;
  target_cell_id?: string;
  program_id?: string;
  session_id?: string;
  details: string;
  timestamp: string;
}

export const storage = {
  // Organizations
  async getOrganizationByJoinCode(code: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('join_code', code.toUpperCase())
      .single();

    if (error) {
       console.error('Error fetching organization by join code:', error);
       return null;
    }
    return data;
  },

  // Users
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data || []).map(u => ({
      ...u,
      full_name: `${u.first_name || ''} ${u.surname || ''}`.trim()
    }));
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return null;
    return {
      ...data,
      full_name: `${data.first_name || ''} ${data.surname || ''}`.trim()
    };
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error) return null;
    return {
      ...data,
      full_name: `${data.first_name || ''} ${data.surname || ''}`.trim()
    };
  },

  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const { full_name, role, ...rest } = user;
    const nameParts = full_name.trim().split(/\s+/);
    const first_name = nameParts[0] || '';
    const surname = nameParts.slice(1).join(' ') || 'User';

    const { data, error } = await supabase.from('users').insert({
      first_name,
      surname,
      role,
      ...rest,
      is_active: true // Default to active in the existing system
    }).select().single();
    if (error) throw error;
    return {
      ...data,
      full_name: `${data.first_name || ''} ${data.surname || ''}`.trim()
    };
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    let finalUpdates = { ...updates } as any;
    if (updates.full_name) {
      const nameParts = updates.full_name.trim().split(/\s+/);
      finalUpdates.first_name = nameParts[0];
      finalUpdates.surname = nameParts.slice(1).join(' ');
      delete finalUpdates.full_name;
    }

    const { data, error } = await supabase.from('users').update(finalUpdates).eq('id', id).select().single();
    if (error) throw error;
    return {
      ...data,
      full_name: `${data.first_name || ''} ${data.surname || ''}`.trim()
    };
  },

  async getPendingLeaders(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').eq('role', 'leader').eq('leader_status', 'pending');
    if (error) throw error;
    return data || [];
  },

  async getApprovedLeaders(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').eq('role', 'leader').eq('leader_status', 'approved');
    if (error) throw error;
    return data || [];
  },

  // Programs
  async getPrograms(): Promise<Program[]> {
    const { data, error } = await supabase.from('programs').select('*').eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async getProgramById(id: string): Promise<Program | null> {
    const { data, error } = await supabase.from('programs').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async createProgram(program: Omit<Program, 'id'>): Promise<Program> {
    const { data, error } = await supabase.from('programs').insert(program).select().single();
    if (error) throw error;
    return data;
  },

  async updateProgram(id: string, updates: Partial<Program>): Promise<Program | null> {
    const { data, error } = await supabase.from('programs').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // Sessions
  async getSessions(): Promise<Session[]> {
    const { data, error } = await supabase.from('sessions').select('*').order('session_number');
    if (error) throw error;
    return data || [];
  },

  async getSessionsByProgram(programId: string): Promise<Session[]> {
    const { data, error } = await supabase.from('sessions').select('*').eq('program_id', programId).order('session_number');
    if (error) throw error;
    return data || [];
  },

  async getSessionById(id: string): Promise<Session | null> {
    const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
    const { data, error } = await supabase.from('sessions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async createSession(session: Omit<Session, 'id'>): Promise<Session> {
    const { data, error } = await supabase.from('sessions').insert(session).select().single();
    if (error) throw error;
    return data;
  },

  async deleteSession(id: string): Promise<void> {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) throw error;
  },

  // Enrollments
  async getEnrollments(): Promise<Enrollment[]> {
    const { data, error } = await supabase.from('enrollments').select('*');
    if (error) throw error;
    return data || [];
  },

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    const { data, error } = await supabase.from('enrollments').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  async getUserEnrollment(userId: string, programId: string): Promise<Enrollment | null> {
    const { data, error } = await supabase.from('enrollments').select('*').eq('user_id', userId).eq('program_id', programId).single();
    if (error) return null;
    return data;
  },

  async createEnrollment(enrollment: Omit<Enrollment, 'id' | 'enrolled_at'>): Promise<Enrollment> {
    const { data, error } = await supabase.from('enrollments').insert(enrollment).select().single();
    if (error) throw error;
    return data;
  },

  async updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment | null> {
    const { data, error } = await supabase.from('enrollments').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // Cell Groups
  async getCellGroups(): Promise<CellGroup[]> {
    const { data, error } = await supabase.from('cell_groups').select('*');
    if (error) throw error;
    return data || [];
  },

  async getCellGroupsByProgram(programId: string): Promise<CellGroup[]> {
    const { data, error } = await supabase.from('cell_groups').select('*').eq('program_id', programId);
    if (error) throw error;
    return data || [];
  },

  async createCellGroup(cell: Omit<CellGroup, 'id'>): Promise<CellGroup> {
    const { data, error } = await supabase.from('cell_groups').insert(cell).select().single();
    if (error) throw error;
    return data;
  },

  async getCellMembers(cellId: string): Promise<{ user_id: string }[]> {
    const { data, error } = await supabase.from('cell_members').select('user_id').eq('cell_id', cellId);
    if (error) throw error;
    return data || [];
  },

  async addCellMember(cellId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('cell_members').insert({ cell_id: cellId, user_id: userId });
    if (error) throw error;
  },

  async removeCellMember(cellId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('cell_members').delete().eq('cell_id', cellId).eq('user_id', userId);
    if (error) throw error;
  },

  async updateEnrollmentCell(userId: string, cellId: string): Promise<void> {
    const { error } = await supabase.from('enrollments').update({ cell_id: cellId, status: 'assigned' }).eq('user_id', userId);
    if (error) throw error;
  },

  // Assignments
  async getAssignments(): Promise<Assignment[]> {
    const { data, error } = await supabase.from('assignments').select('*');
    if (error) throw error;
    return data || [];
  },

  async getAssignmentsByProgram(programId: string): Promise<Assignment[]> {
    const { data, error } = await supabase.from('assignments').select('*').eq('program_id', programId);
    if (error) throw error;
    return data || [];
  },

  async createAssignment(assignment: Omit<Assignment, 'id'>): Promise<Assignment> {
    const { data, error } = await supabase.from('assignments').insert(assignment).select().single();
    if (error) throw error;
    return data;
  },

  // Assignment Submissions
  async getSubmissions(): Promise<AssignmentSubmission[]> {
    const { data, error } = await supabase.from('assignment_submissions').select('*');
    if (error) throw error;
    return data || [];
  },

  async getUserSubmissions(userId: string): Promise<AssignmentSubmission[]> {
    const { data, error } = await supabase.from('assignment_submissions').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  async createSubmission(submission: Omit<AssignmentSubmission, 'id' | 'submitted_at'>): Promise<AssignmentSubmission> {
    const { data, error } = await supabase.from('assignment_submissions').insert(submission).select().single();
    if (error) throw error;
    return data;
  },

  async updateSubmission(id: string, updates: Partial<AssignmentSubmission>): Promise<AssignmentSubmission | null> {
    const { data, error } = await supabase.from('assignment_submissions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // File Attachments
  async getAttachmentsBySubmission(submissionId: string): Promise<FileAttachment[]> {
    const { data, error } = await supabase.from('file_attachments').select('*').eq('submission_id', submissionId);
    if (error) throw error;
    return data || [];
  },

  async createAttachment(attachment: Omit<FileAttachment, 'id' | 'uploaded_at'>): Promise<FileAttachment> {
    const { data, error } = await supabase.from('file_attachments').insert(attachment).select().single();
    if (error) throw error;
    return data;
  },

  async deleteAttachment(id: string): Promise<void> {
    const { error } = await supabase.from('file_attachments').delete().eq('id', id);
    if (error) throw error;
  },

  // Attendance
  async getAttendance(): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase.from('attendance').select('*');
    if (error) throw error;
    return data || [];
  },

  async getUserAttendance(userId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase.from('attendance').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  async getSessionAttendance(sessionId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase.from('attendance').select('*').eq('session_id', sessionId);
    if (error) throw error;
    return data || [];
  },

  async upsertAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(record, { onConflict: 'session_id,user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateAttendance(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | null> {
    const { data, error } = await supabase.from('attendance').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // Payments
  async getPayments(): Promise<PaymentRecord[]> {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) throw error;
    return data || [];
  },

  async getUserPayments(userId: string): Promise<PaymentRecord[]> {
    const { data, error } = await supabase.from('payments').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  async createPayment(payment: Omit<PaymentRecord, 'id'>): Promise<PaymentRecord> {
    const { data, error } = await supabase.from('payments').insert(payment).select().single();
    if (error) throw error;
    return data;
  },

  async updatePayment(id: string, updates: Partial<PaymentRecord>): Promise<PaymentRecord | null> {
    const { data, error } = await supabase.from('payments').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async getSessionPayments(sessionId: string): Promise<PaymentRecord[]> {
    const { data, error } = await supabase.from('payments').select('*').eq('session_id', sessionId);
    if (error) throw error;
    return data || [];
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
    if (error) throw error;
    return data || [];
  },

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const { data, error } = await supabase.from('audit_logs').insert(log).select().single();
    if (error) throw error;
    return data;
  },

  async autoAssignCells(programId: string, performedBy: string): Promise<{ cells: CellGroup[]; assignedCount: number }> {
    const program = await this.getProgramById(programId);
    if (!program) throw new Error('Program not found');

    const now = new Date();
    const enrollmentEnd = new Date(program.enrollment_end_date);
    if (now < enrollmentEnd) {
      throw new Error('Enrollment period has not ended yet');
    }

    const existingCells = await this.getCellGroupsByProgram(programId);
    if (existingCells.length > 0) {
      throw new Error('Cells already exist for this program');
    }

    const enrollments = await this.getEnrollments();
    const programEnrollments = enrollments.filter(e => e.program_id === programId && e.status === 'enrolled');

    if (programEnrollments.length === 0) {
      throw new Error('No enrolled participants found');
    }

    const users = await this.getAllUsers();
    const approvedLeaders = users.filter((u: User) => u.role === 'leader' && u.leader_status === 'approved');

    if (approvedLeaders.length === 0) {
      throw new Error('No approved leaders available');
    }

    const participants = programEnrollments
      .map(e => users.find((u: User) => u.id === e.user_id))
      .filter((u): u is User => u !== undefined);

    const married = participants.filter(p => p.marital_status === 'married');
    const unmarried = participants.filter(p => p.marital_status === 'unmarried');

    const minCellSize = program.min_cell_size || 5;
    const maxCellSize = program.max_cell_size || 12;

    const idealCellCount = Math.ceil(participants.length / maxCellSize);
    const numCells = Math.min(
      approvedLeaders.length,
      Math.max(idealCellCount, Math.ceil(participants.length / minCellSize))
    );

    if (numCells === 0) {
      throw new Error('Cannot create cells with current constraints');
    }

    const cells: CellGroup[] = [];
    const cellMemberLists: string[][] = Array.from({ length: numCells }, () => []);

    for (let i = 0; i < numCells; i++) {
      const cell = await this.createCellGroup({
        program_id: programId,
        name: `Cell ${i + 1}`,
        leader_id: approvedLeaders[i].id,
      });
      cells.push(cell);

      await this.createAuditLog({
        action: 'cell_created',
        performed_by: performedBy,
        target_cell_id: cell.id,
        program_id: programId,
        details: `Cell ${cell.name} created with leader ${approvedLeaders[i].full_name}`,
      });
    }

    const shuffleArray = <T>(arr: T[]): T[] => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const shuffledMarried = shuffleArray(married);
    const shuffledUnmarried = shuffleArray(unmarried);

    let cellIndex = 0;
    let marriedIdx = 0;
    let unmarriedIdx = 0;
    let useMarried = true;

    while (marriedIdx < shuffledMarried.length || unmarriedIdx < shuffledUnmarried.length) {
      let participant: User | null = null;

      if (useMarried && marriedIdx < shuffledMarried.length) {
        participant = shuffledMarried[marriedIdx++];
      } else if (!useMarried && unmarriedIdx < shuffledUnmarried.length) {
        participant = shuffledUnmarried[unmarriedIdx++];
      } else if (marriedIdx < shuffledMarried.length) {
        participant = shuffledMarried[marriedIdx++];
      } else if (unmarriedIdx < shuffledUnmarried.length) {
        participant = shuffledUnmarried[unmarriedIdx++];
      }

      if (participant) {
        cellMemberLists[cellIndex].push(participant.id);
        cellIndex = (cellIndex + 1) % numCells;
        useMarried = !useMarried;
      }
    }

    let assignedCount = 0;
    for (let i = 0; i < numCells; i++) {
      for (const userId of cellMemberLists[i]) {
        await this.addCellMember(cells[i].id, userId);

        const enrollment = programEnrollments.find(e => e.user_id === userId);
        if (enrollment) {
          await this.updateEnrollment(enrollment.id, {
            status: 'assigned',
            cell_id: cells[i].id,
          });
        }
        assignedCount++;
      }
    }

    await this.createAuditLog({
      action: 'cells_auto_assigned',
      performed_by: performedBy,
      program_id: programId,
      details: `Auto-assigned ${assignedCount} participants to ${numCells} cells with balanced married/unmarried distribution`,
    });

    return { cells, assignedCount };
  },
};

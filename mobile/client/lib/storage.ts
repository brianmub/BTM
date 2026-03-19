import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, getApiUrl } from "./query-client";

const getBaseUrl = getApiUrl;

const STORAGE_KEYS = {
  USER: "@cellconnect_user",
  ONBOARDING_COMPLETE: "@cellconnect_onboarding",
};

export type UserRole = "participant" | "leader" | "facilitator" | "admin" | "sysadmin";
export type MaritalStatus = "married" | "unmarried";
export type Gender = "male" | "female";
export type EnrollmentStatus = "enrolled" | "assigned" | "graduated" | "incomplete";
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
  gender: Gender;
  maritalStatus: MaritalStatus;
  role: UserRole;
  leaderStatus?: LeaderStatus;
  cellId?: string;
  isApproved: boolean;
  isOnboardingComplete?: boolean;
  organizationId?: string;
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
  checkedInAt?: string;
  entryTime?: string;
  exitTime?: string;
  confirmedByLeader: boolean;
  confirmedAt?: string;
}

export type PaymentStatus = "pending" | "paid" | "waived" | "unpaid";

export interface PaymentRecord {
  id: string;
  sessionId: string;
  programId: string;
  userId: string;
  status: PaymentStatus;
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

async function fetchApi<T>(endpoint: string): Promise<T> {
  try {
    const baseUrl = getApiUrl();
    const url = new URL(endpoint, baseUrl);
    const res = await fetch(url, { credentials: "include" });

    if (!res.ok) {
      let errorMessage = `API error: ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // If error response is not JSON, use status text
        errorMessage = `${res.status}: ${res.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    return snakeToCamel(data);
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
      throw new Error('Unable to connect to server. Please check your internet connection and ensure the backend server is running.');
    }
    throw error;
  }
}

async function postApi<T>(endpoint: string, body: any): Promise<T> {
  try {
    const res = await apiRequest("POST", endpoint, camelToSnake(body));
    const data = await res.json();
    return snakeToCamel(data);
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
      throw new Error('Unable to connect to server. Please check your internet connection and ensure the backend server is running.');
    }
    throw error;
  }
}

async function putApi<T>(endpoint: string, body: any): Promise<T> {
  try {
    const res = await apiRequest("PUT", endpoint, camelToSnake(body));
    const data = await res.json();
    return snakeToCamel(data);
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
      throw new Error('Unable to connect to server. Please check your internet connection and ensure the backend server is running.');
    }
    throw error;
  }
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

  async validateJoinCode(code: string): Promise<any> {
    return await fetchApi<any>(`/api/organizations/code/${code}`);
  },

  async signup(data: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    gender: 'male' | 'female';
    maritalStatus: 'married' | 'unmarried';
    role: UserRole;
    organizationId?: string;
  }): Promise<User> {
    const response = await postApi<User>('/api/auth/signup', data);
    return response;
  },

  async login(data: { email: string; password: string }): Promise<User> {
    const response = await postApi<User>('/api/auth/login', data);
    return response;
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

  async getPrograms(): Promise<Program[]> {
    try {
      return await fetchApi<Program[]>("/api/programs");
    } catch {
      return [];
    }
  },

  async getEnrollments(): Promise<Enrollment[]> {
    try {
      return await fetchApi<Enrollment[]>("/api/enrollments");
    } catch {
      return [];
    }
  },

  async getUserEnrollment(userId: string, programId: string): Promise<Enrollment | null> {
    const enrollments = await this.getUserEnrollments(userId);
    return enrollments.find(e => e.programId === programId) || null;
  },

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    try {
      return await fetchApi<Enrollment[]>(`/api/users/${userId}/enrollments`);
    } catch {
      return [];
    }
  },

  async enrollInProgram(userId: string, programId: string): Promise<Enrollment> {
    return await postApi<Enrollment>("/api/enrollments", {
      userId,
      programId,
      status: "enrolled",
      sessionsAttended: 0,
      assignmentsCompleted: 0,
    });
  },

  async getSessions(): Promise<Session[]> {
    try {
      return await fetchApi<Session[]>("/api/sessions");
    } catch {
      return [];
    }
  },

  async getSessionsByProgram(programId: string): Promise<Session[]> {
    try {
      return await fetchApi<Session[]>(`/api/programs/${programId}/sessions`);
    } catch {
      return [];
    }
  },

  async getAssignments(): Promise<Assignment[]> {
    try {
      return await fetchApi<Assignment[]>("/api/assignments");
    } catch {
      return [];
    }
  },

  async createAssignment(assignment: Omit<Assignment, "id">): Promise<Assignment> {
    return await postApi<Assignment>("/api/assignments", assignment);
  },

  async updateSession(session: Session): Promise<void> {
    await putApi(`/api/sessions/${session.id}`, session);
  },

  async getAttendance(): Promise<AttendanceRecord[]> {
    try {
      return await fetchApi<AttendanceRecord[]>("/api/attendance");
    } catch {
      return [];
    }
  },

  async getUserAttendance(userId: string): Promise<AttendanceRecord[]> {
    try {
      return await fetchApi<AttendanceRecord[]>(`/api/users/${userId}/attendance`);
    } catch {
      return [];
    }
  },

  async getSessionAttendance(sessionId: string): Promise<AttendanceRecord[]> {
    try {
      return await fetchApi<AttendanceRecord[]>(`/api/sessions/${sessionId}/attendance`);
    } catch {
      return [];
    }
  },

  async checkInToSession(userId: string, sessionId: string, programId: string): Promise<void> {
    await postApi("/api/attendance/check-in", { userId, sessionId, programId });
  },

  async checkOutOfSession(userId: string, sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      await postApi("/api/attendance/check-out", { userId, sessionId });
      return { success: true, message: "Successfully checked out" };
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to check out" };
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

  async getPayments(): Promise<PaymentRecord[]> {
    try {
      return await fetchApi<PaymentRecord[]>("/api/payments");
    } catch {
      return [];
    }
  },

  async getUserPayments(userId: string): Promise<PaymentRecord[]> {
    try {
      return await fetchApi<PaymentRecord[]>(`/api/users/${userId}/payments`);
    } catch {
      return [];
    }
  },

  async confirmPayment(paymentId: string, confirmedBy: string): Promise<void> {
    await putApi(`/api/payments/${paymentId}/confirm`, { confirmedBy });
  },

  async markPaymentUnpaid(paymentId: string, reason: string, confirmedBy: string): Promise<void> {
    await putApi(`/api/payments/${paymentId}/unpaid`, { reason, confirmedBy });
  },

  async waivePayment(paymentId: string, confirmedBy: string): Promise<void> {
    await putApi(`/api/payments/${paymentId}/waive`, { confirmedBy });
  },

  async bulkConfirmPayments(paymentIds: string[], confirmedBy: string): Promise<void> {
    await postApi("/api/payments/bulk-confirm", { paymentIds, confirmedBy });
  },

  async getSessionPayments(sessionId: string): Promise<PaymentRecord[]> {
    try {
      return await fetchApi<PaymentRecord[]>(`/api/sessions/${sessionId}/payments`);
    } catch {
      return [];
    }
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  },

  async getAllUsers(): Promise<User[]> {
    try {
      return await fetchApi<User[]>("/api/users");
    } catch {
      return [];
    }
  },

  async addUser(user: User): Promise<User> {
    const { id, createdAt, ...userData } = user;
    return await postApi<User>("/api/users", userData);
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      return await putApi<User>(`/api/users/${userId}`, updates);
    } catch {
      return null;
    }
  },

  async getUserById(userId: string): Promise<User | null> {
    try {
      return await fetchApi<User>(`/api/users/${userId}`);
    } catch {
      return null;
    }
  },

  async getPendingLeaders(): Promise<User[]> {
    try {
      return await fetchApi<User[]>("/api/users/pending-leaders");
    } catch {
      return [];
    }
  },

  async getApprovedLeaders(): Promise<User[]> {
    try {
      return await fetchApi<User[]>("/api/users/approved-leaders");
    } catch {
      return [];
    }
  },

  async approveLeader(userId: string, approvedBy: string): Promise<void> {
    await postApi(`/api/users/${userId}/approve`, { performedBy: approvedBy });
  },

  async rejectLeader(userId: string, rejectedBy: string): Promise<void> {
    await postApi(`/api/users/${userId}/reject`, { performedBy: rejectedBy });
  },

  async getCellGroups(): Promise<CellGroup[]> {
    try {
      const cells = await fetchApi<any[]>("/api/cell-groups");
      const cellsWithMembers = await Promise.all(
        cells.map(async (cell) => {
          const members = await this.getCellMembers(cell.id);
          return { ...cell, memberIds: members.map((m: User) => m.id) };
        })
      );
      return cellsWithMembers;
    } catch {
      return [];
    }
  },

  async getCellGroupsByProgram(programId: string): Promise<CellGroup[]> {
    try {
      const cells = await fetchApi<any[]>(`/api/programs/${programId}/cell-groups`);
      const cellsWithMembers = await Promise.all(
        cells.map(async (cell) => {
          const members = await this.getCellMembers(cell.id);
          return { ...cell, memberIds: members.map((m: User) => m.id) };
        })
      );
      return cellsWithMembers;
    } catch {
      return [];
    }
  },

  async getCellMembers(cellId: string): Promise<User[]> {
    try {
      return await fetchApi<User[]>(`/api/cell-groups/${cellId}/members`);
    } catch {
      return [];
    }
  },

  async getSubmissions(): Promise<AssignmentSubmission[]> {
    try {
      return await fetchApi<AssignmentSubmission[]>("/api/submissions");
    } catch {
      return [];
    }
  },

  async getUserSubmissions(userId: string): Promise<AssignmentSubmission[]> {
    try {
      return await fetchApi<AssignmentSubmission[]>(`/api/users/${userId}/submissions`);
    } catch {
      return [];
    }
  },

  async submitAssignment(submission: Omit<AssignmentSubmission, "id">): Promise<AssignmentSubmission> {
    return await postApi<AssignmentSubmission>("/api/submissions", submission);
  },

  async confirmAssignment(submissionId: string, confirmedBy: string): Promise<void> {
    await postApi(`/api/submissions/${submissionId}/confirm`, { performedBy: confirmedBy });
  },

  async getAttachments(submissionId: string): Promise<FileAttachment[]> {
    try {
      return await fetchApi<FileAttachment[]>(`/api/submissions/${submissionId}/attachments`);
    } catch {
      return [];
    }
  },

  async uploadAttachment(submissionId: string, file: { uri: string; name: string; type: string }): Promise<FileAttachment> {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/submissions/${submissionId}/attachments`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const result = await response.json();
    return snakeToCamel(result);
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    const baseUrl = getBaseUrl();
    await fetch(`${baseUrl}/api/attachments/${attachmentId}`, { method: "DELETE" });
  },

  async confirmAttendance(attendanceId: string, confirmedBy: string): Promise<void> {
    await postApi(`/api/attendance/${attendanceId}/confirm`, { performedBy: confirmedBy });
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      return await fetchApi<AuditLog[]>("/api/audit-logs");
    } catch {
      return [];
    }
  },

  async createCellGroup(cell: { programId: string; name: string; leaderId: string; createdBy: string }): Promise<CellGroup> {
    return await postApi<CellGroup>("/api/cell-groups", cell);
  },

  async addCellMember(cellId: string, userId: string): Promise<void> {
    await postApi(`/api/cell-groups/${cellId}/members`, { userId });
  },

  async createCellsForProgram(programId: string, createdBy: string): Promise<CellGroup[]> {
    try {
      const response = await postApi(`/api/programs/${programId}/auto-assign-cells`, {
        performed_by: createdBy,
      }) as { cells?: any[] };

      if (response && response.cells) {
        return response.cells.map((c: any) => ({
          id: c.id,
          programId: c.program_id,
          name: c.name,
          leaderId: c.leader_id,
          memberIds: [],
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to auto-assign cells:', error);
      throw error;
    }
  },

  async checkGraduationEligibility(userId: string, programId: string): Promise<{
    eligible: boolean;
    sessionsConfirmed: number;
    sessionsWithPaidPayments: number;
    assignmentsConfirmed: number;
    totalAssignments: number
  }> {
    const [attendance, payments, assignments, submissions] = await Promise.all([
      this.getUserAttendance(userId),
      this.getUserPayments(userId),
      this.getAssignments(),
      this.getUserSubmissions(userId),
    ]);

    const confirmedSessions = attendance.filter(
      a => a.programId === programId && a.confirmedByLeader
    );

    const sessionIdsAttended = new Set(confirmedSessions.map(s => s.sessionId));
    const paidSessionPayments = payments.filter(
      p => p.programId === programId &&
        sessionIdsAttended.has(p.sessionId) &&
        (p.status === 'paid' || p.status === 'waived')
    );

    const programAssignments = assignments.filter(a => a.programId === programId);
    const confirmedSubmissions = submissions.filter(
      s => programAssignments.some(a => a.id === s.assignmentId) && s.isConfirmed
    );

    const sessionsConfirmed = confirmedSessions.length;
    const sessionsWithPaidPayments = paidSessionPayments.length;
    const assignmentsConfirmed = confirmedSubmissions.length;
    const totalAssignments = programAssignments.length;

    const eligible = sessionsConfirmed >= 5 &&
      sessionsWithPaidPayments >= sessionsConfirmed &&
      (totalAssignments === 0 || assignmentsConfirmed >= totalAssignments);

    return { eligible, sessionsConfirmed, sessionsWithPaidPayments, assignmentsConfirmed, totalAssignments };
  },

  async reassignCellMember(userId: string, fromCellId: string, toCellId: string, performedBy: string): Promise<void> {
    await postApi("/api/cell-groups/reassign-member", {
      user_id: userId,
      from_cell_id: fromCellId,
      to_cell_id: toCellId,
      performed_by: performedBy,
    });
  },

  async createProgram(program: Omit<Program, "id">): Promise<Program> {
    return await postApi<Program>("/api/programs", program);
  },

  async updateProgram(programId: string, updates: Partial<Program>): Promise<Program | null> {
    try {
      return await putApi<Program>(`/api/programs/${programId}`, updates);
    } catch {
      return null;
    }
  },

  async createSession(session: Omit<Session, "id">): Promise<Session> {
    return await postApi<Session>("/api/sessions", session);
  },

  async deleteSession(sessionId: string): Promise<void> {
    const baseUrl = getBaseUrl();
    await fetch(`${baseUrl}/api/sessions/${sessionId}`, { method: "DELETE" });
  },
};

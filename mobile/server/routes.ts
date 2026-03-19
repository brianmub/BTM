import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { storage } from "./storage";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "video/mp4",
      "video/quicktime",
      "audio/mpeg",
      "audio/wav",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

interface IdParams { id: string; }
interface UserIdParams { userId: string; }
interface ProgramIdParams { programId: string; }
interface SessionIdParams { sessionId: string; }
interface CellIdParams { cellId: string; }

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check with Supabase connectivity verification
  app.get("/api/health", async (_req: Request, res: Response) => {
    const healthData: any = {
      status: "ok",
      timestamp: new Date().toISOString(),
      supabase: {
        connected: false,
        error: null
      }
    };

    // Test Supabase connection by attempting to query users table
    try {
      await storage.getAllUsers();
      healthData.supabase.connected = true;
    } catch (error: any) {
      healthData.status = "degraded";
      healthData.supabase.connected = false;
      healthData.supabase.error = error.message || "Unknown error";
    }

    const statusCode = healthData.status === "ok" ? 200 : 503;
    res.status(statusCode).json(healthData);
  });

  // ============ ORGANIZATIONS ============
  app.get("/api/organizations/code/:code", async (req, res) => {
    try {
      const org = await storage.getOrganizationByJoinCode(req.params.code);
      if (!org) {
        return res.status(404).json({ error: "Invalid organization code" });
      }
      res.json(org);
    } catch (error) {
      res.status(500).json({ error: "Failed to validate organization code" });
    }
  });

  // ============ AUTHENTICATION ============
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { full_name, phone, email, password, gender, marital_status, role, organization_id } = req.body;

      if (!full_name || !phone || !email || !password || !gender || !marital_status || !role || !organization_id) {
        const missingFields = {
          full_name: !full_name,
          phone: !phone,
          email: !email,
          password: !password,
          gender: !gender,
          marital_status: !marital_status,
          role: !role,
          organization_id: !organization_id
        };
        return res.status(400).json({ error: "All fields are required", missing: missingFields });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }

      const bcrypt = await import("bcrypt");
      const password_hash = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        full_name,
        phone,
        email,
        password_hash,
        gender,
        marital_status,
        role,
        leader_status: role === "leader" ? "pending" : undefined,
        organization_id,
        is_active: false,
        is_onboarding_complete: false,
      });

      res.status(201).json(user);
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const bcrypt = await import("bcrypt");
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Don't send password hash to client
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });


  // ============ USERS ============
  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req: Request<IdParams>, res: Response) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.code === '23505') {
        res.status(409).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Failed to create user", details: error.message });
      }
    }
  });

  app.put("/api/users/:id", async (req: Request<IdParams>, res: Response) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/api/users/pending-leaders", async (_req: Request, res: Response) => {
    try {
      const leaders = await storage.getPendingLeaders();
      res.json(leaders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending leaders" });
    }
  });

  app.get("/api/users/approved-leaders", async (_req: Request, res: Response) => {
    try {
      const leaders = await storage.getApprovedLeaders();
      res.json(leaders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch approved leaders" });
    }
  });

  app.post("/api/users/:id/approve", async (req: Request<IdParams>, res: Response) => {
    try {
      const { performedBy } = req.body;
      const user = await storage.updateUser(req.params.id, {
        leader_status: 'approved',
        is_active: true,
      });
      if (user) {
        await storage.createAuditLog({
          action: 'leader_approved',
          performed_by: performedBy,
          target_user_id: req.params.id,
          details: `Leader ${user.full_name} approved`,
        });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve leader" });
    }
  });

  app.post("/api/users/:id/reject", async (req: Request<IdParams>, res: Response) => {
    try {
      const { performedBy } = req.body;
      const user = await storage.updateUser(req.params.id, {
        leader_status: 'rejected',
        is_active: false,
      });
      if (user) {
        await storage.createAuditLog({
          action: 'leader_rejected',
          performed_by: performedBy,
          target_user_id: req.params.id,
          details: `Leader ${user.full_name} rejected`,
        });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject leader" });
    }
  });

  // ============ PROGRAMS ============
  app.get("/api/programs", async (_req: Request, res: Response) => {
    try {
      const programs = await storage.getPrograms();
      res.json(programs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });

  app.get("/api/programs/:id", async (req: Request<IdParams>, res: Response) => {
    try {
      const program = await storage.getProgramById(req.params.id);
      if (!program) return res.status(404).json({ error: "Program not found" });
      res.json(program);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch program" });
    }
  });

  app.post("/api/programs", async (req: Request, res: Response) => {
    try {
      const program = await storage.createProgram(req.body);
      res.status(201).json(program);
    } catch (error) {
      res.status(500).json({ error: "Failed to create program" });
    }
  });

  app.put("/api/programs/:id", async (req: Request<IdParams>, res: Response) => {
    try {
      const program = await storage.updateProgram(req.params.id, req.body);
      res.json(program);
    } catch (error) {
      res.status(500).json({ error: "Failed to update program" });
    }
  });

  // ============ SESSIONS ============
  app.get("/api/sessions", async (_req: Request, res: Response) => {
    try {
      const sessions = await storage.getSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/programs/:programId/sessions", async (req: Request<ProgramIdParams>, res: Response) => {
    try {
      const sessions = await storage.getSessionsByProgram(req.params.programId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.put("/api/sessions/:id", async (req: Request<IdParams>, res: Response) => {
    try {
      const session = await storage.updateSession(req.params.id, req.body);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  app.post("/api/sessions", async (req: Request, res: Response) => {
    try {
      const session = await storage.createSession(req.body);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.delete("/api/sessions/:id", async (req: Request<IdParams>, res: Response) => {
    try {
      await storage.deleteSession(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // ============ ENROLLMENTS ============
  app.get("/api/enrollments", async (_req: Request, res: Response) => {
    try {
      const enrollments = await storage.getEnrollments();
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/users/:userId/enrollments", async (req: Request<UserIdParams>, res: Response) => {
    try {
      const enrollments = await storage.getUserEnrollments(req.params.userId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user enrollments" });
    }
  });

  app.post("/api/enrollments", async (req: Request, res: Response) => {
    try {
      const { user_id, program_id } = req.body;

      const existing = await storage.getUserEnrollment(user_id, program_id);
      if (existing) {
        return res.status(409).json({ error: "Already enrolled", enrollment: existing });
      }

      const enrollment = await storage.createEnrollment({
        user_id,
        program_id,
        status: 'enrolled',
        sessions_attended: 0,
        assignments_completed: 0,
      });

      await storage.createAuditLog({
        action: 'enrollment_created',
        performed_by: user_id,
        program_id,
        details: 'User enrolled in program',
      });

      res.status(201).json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create enrollment" });
    }
  });

  // ============ CELL GROUPS ============
  app.get("/api/cell-groups", async (_req: Request, res: Response) => {
    try {
      const cells = await storage.getCellGroups();
      res.json(cells);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cell groups" });
    }
  });

  app.get("/api/programs/:programId/cell-groups", async (req: Request<ProgramIdParams>, res: Response) => {
    try {
      const cells = await storage.getCellGroupsByProgram(req.params.programId);
      res.json(cells);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cell groups" });
    }
  });

  app.post("/api/cell-groups", async (req: Request, res: Response) => {
    try {
      const cell = await storage.createCellGroup(req.body);

      await storage.createAuditLog({
        action: 'cell_created',
        performed_by: req.body.created_by,
        target_cell_id: cell.id,
        program_id: cell.program_id,
        details: `Cell ${cell.name} created`,
      });

      res.status(201).json(cell);
    } catch (error) {
      res.status(500).json({ error: "Failed to create cell group" });
    }
  });

  app.get("/api/cell-groups/:cellId/members", async (req: Request<CellIdParams>, res: Response) => {
    try {
      const members = await storage.getCellMembers(req.params.cellId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cell members" });
    }
  });

  app.post("/api/cell-groups/:cellId/members", async (req: Request<CellIdParams>, res: Response) => {
    try {
      await storage.addCellMember(req.params.cellId, req.body.user_id);
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add cell member" });
    }
  });

  app.delete("/api/cell-groups/:cellId/members/:userId", async (req: Request<CellIdParams & { userId: string }>, res: Response) => {
    try {
      await storage.removeCellMember(req.params.cellId, req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove cell member" });
    }
  });

  app.post("/api/cell-groups/reassign-member", async (req: Request, res: Response) => {
    try {
      const { user_id, from_cell_id, to_cell_id, performed_by } = req.body;

      if (!user_id || !from_cell_id || !to_cell_id || !performed_by) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await storage.removeCellMember(from_cell_id, user_id);
      await storage.addCellMember(to_cell_id, user_id);

      await storage.updateEnrollmentCell(user_id, to_cell_id);

      await storage.createAuditLog({
        action: 'cell_member_override',
        performed_by,
        target_user_id: user_id,
        target_cell_id: to_cell_id,
        details: `Member manually reassigned to different cell`,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reassign member" });
    }
  });

  app.post("/api/programs/:programId/auto-assign-cells", async (req: Request<ProgramIdParams>, res: Response) => {
    try {
      const { performed_by } = req.body;
      if (!performed_by) {
        return res.status(400).json({ error: "performed_by is required" });
      }

      const result = await storage.autoAssignCells(req.params.programId, performed_by);
      res.status(201).json({
        success: true,
        cells_created: result.cells.length,
        participants_assigned: result.assignedCount,
        cells: result.cells,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to auto-assign cells";
      res.status(400).json({ error: message });
    }
  });

  // ============ ASSIGNMENTS ============
  app.get("/api/assignments", async (_req: Request, res: Response) => {
    try {
      const assignments = await storage.getAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.get("/api/programs/:programId/assignments", async (req: Request<ProgramIdParams>, res: Response) => {
    try {
      const assignments = await storage.getAssignmentsByProgram(req.params.programId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.post("/api/assignments", async (req: Request, res: Response) => {
    try {
      const assignment = await storage.createAssignment(req.body);
      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  // ============ SUBMISSIONS ============
  app.get("/api/submissions", async (_req: Request, res: Response) => {
    try {
      const submissions = await storage.getSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/users/:userId/submissions", async (req: Request<UserIdParams>, res: Response) => {
    try {
      const submissions = await storage.getUserSubmissions(req.params.userId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user submissions" });
    }
  });

  app.post("/api/submissions", async (req: Request, res: Response) => {
    try {
      const submission = await storage.createSubmission(req.body);
      res.status(201).json(submission);
    } catch (error) {
      res.status(500).json({ error: "Failed to create submission" });
    }
  });

  app.put("/api/submissions/:id", async (req: Request<IdParams>, res: Response) => {
    try {
      const submission = await storage.updateSubmission(req.params.id, req.body);
      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: "Failed to update submission" });
    }
  });

  app.post("/api/submissions/:id/confirm", async (req: Request<IdParams>, res: Response) => {
    try {
      const { performedBy } = req.body;
      const submission = await storage.updateSubmission(req.params.id, { is_confirmed: true });

      if (submission) {
        await storage.createAuditLog({
          action: 'assignment_confirmed',
          performed_by: performedBy,
          target_user_id: submission.user_id,
          details: `Assignment submission confirmed`,
        });
      }

      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm submission" });
    }
  });

  // ============ FILE ATTACHMENTS ============
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  }, require("express").static(uploadsDir));

  app.get("/api/submissions/:id/attachments", async (req: Request<IdParams>, res: Response) => {
    try {
      const attachments = await storage.getAttachmentsBySubmission(req.params.id);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attachments" });
    }
  });

  app.post("/api/submissions/:id/attachments", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const submissionId = req.params.id as string;
      const host = req.get("host") || "localhost:5000";
      const baseUrl = `${req.protocol}://${host}`;
      const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

      const attachment = await storage.createAttachment({
        submission_id: submissionId,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        file_url: fileUrl,
      });

      res.status(201).json(attachment);
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.delete("/api/attachments/:id", async (req: Request<IdParams>, res: Response) => {
    try {
      await storage.deleteAttachment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete attachment" });
    }
  });

  // ============ ATTENDANCE ============
  app.get("/api/attendance", async (_req: Request, res: Response) => {
    try {
      const attendance = await storage.getAttendance();
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  app.get("/api/users/:userId/attendance", async (req: Request<UserIdParams>, res: Response) => {
    try {
      const attendance = await storage.getUserAttendance(req.params.userId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user attendance" });
    }
  });

  app.get("/api/sessions/:sessionId/attendance", async (req: Request<SessionIdParams>, res: Response) => {
    try {
      const attendance = await storage.getSessionAttendance(req.params.sessionId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session attendance" });
    }
  });

  app.post("/api/attendance/check-in", async (req: Request, res: Response) => {
    try {
      const { user_id, session_id, program_id } = req.body;
      const now = new Date().toISOString();

      const record = await storage.upsertAttendance({
        user_id,
        session_id,
        program_id,
        checked_in: true,
        checked_in_at: now,
        entry_time: now,
        confirmed_by_leader: false,
      });

      // Auto-create pending payment record if not exists
      try {
        const existingPayments = await storage.getPayments();
        const hasPayment = existingPayments.some(
          p => p.user_id === user_id && p.session_id === session_id
        );
        if (!hasPayment) {
          await storage.createPayment({
            user_id,
            session_id,
            program_id,
            amount: 0,
            status: 'pending',
          });
        }
      } catch (paymentError) {
        console.error("Failed to create payment record:", paymentError);
      }

      res.json(record);
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ error: "Failed to check in" });
    }
  });

  app.post("/api/attendance/check-out", async (req: Request, res: Response) => {
    try {
      const { user_id, session_id } = req.body;
      const now = new Date().toISOString();

      const existing = await storage.getUserAttendance(user_id);
      const record = existing.find(a => a.session_id === session_id);

      if (!record) {
        return res.status(400).json({ error: "Not checked in to this session" });
      }

      if (record.exit_time) {
        return res.status(400).json({ error: "Already checked out" });
      }

      const updated = await storage.updateAttendance(record.id, { exit_time: now });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to check out" });
    }
  });

  app.post("/api/attendance/:id/confirm", async (req: Request<IdParams>, res: Response) => {
    try {
      const { performedBy } = req.body;
      const now = new Date().toISOString();

      const record = await storage.updateAttendance(req.params.id, {
        confirmed_by_leader: true,
        confirmed_at: now,
      });

      if (record) {
        await storage.createAuditLog({
          action: 'attendance_confirmed',
          performed_by: performedBy,
          target_user_id: record.user_id,
          session_id: record.session_id,
          details: 'Attendance confirmed by leader',
        });
      }

      res.json(record);
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm attendance" });
    }
  });

  // ============ PAYMENTS ============
  app.get("/api/payments", async (_req: Request, res: Response) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/users/:userId/payments", async (req: Request<UserIdParams>, res: Response) => {
    try {
      const payments = await storage.getUserPayments(req.params.userId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user payments" });
    }
  });

  app.post("/api/payments", async (req: Request, res: Response) => {
    try {
      const payment = await storage.createPayment(req.body);
      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.get("/api/sessions/:sessionId/payments", async (req: Request<SessionIdParams>, res: Response) => {
    try {
      const payments = await storage.getSessionPayments(req.params.sessionId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session payments" });
    }
  });

  app.put("/api/payments/:id/confirm", async (req: Request<IdParams>, res: Response) => {
    try {
      const { confirmedBy } = req.body;
      const now = new Date().toISOString();

      const payment = await storage.updatePayment(req.params.id, {
        status: 'paid',
        confirmed_by: confirmedBy,
        confirmed_at: now,
      });

      if (payment) {
        await storage.createAuditLog({
          action: 'payment_confirmed',
          performed_by: confirmedBy,
          target_user_id: payment.user_id,
          session_id: payment.session_id,
          program_id: payment.program_id,
          details: 'Payment confirmed by leader',
        });
      }

      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  app.put("/api/payments/:id/unpaid", async (req: Request<IdParams>, res: Response) => {
    try {
      const { reason, confirmedBy } = req.body;
      const now = new Date().toISOString();

      const payment = await storage.updatePayment(req.params.id, {
        status: 'unpaid',
        unpaid_reason: reason,
        confirmed_by: confirmedBy,
        confirmed_at: now,
      });

      if (payment) {
        await storage.createAuditLog({
          action: 'payment_marked_unpaid',
          performed_by: confirmedBy,
          target_user_id: payment.user_id,
          session_id: payment.session_id,
          program_id: payment.program_id,
          details: `Payment marked unpaid: ${reason}`,
        });
      }

      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark payment unpaid" });
    }
  });

  app.put("/api/payments/:id/waive", async (req: Request<IdParams>, res: Response) => {
    try {
      const { confirmedBy } = req.body;
      const now = new Date().toISOString();

      const payment = await storage.updatePayment(req.params.id, {
        status: 'waived',
        confirmed_by: confirmedBy,
        confirmed_at: now,
      });

      if (payment) {
        await storage.createAuditLog({
          action: 'payment_waived',
          performed_by: confirmedBy,
          target_user_id: payment.user_id,
          session_id: payment.session_id,
          program_id: payment.program_id,
          details: 'Payment waived',
        });
      }

      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to waive payment" });
    }
  });

  app.post("/api/payments/bulk-confirm", async (req: Request, res: Response) => {
    try {
      const { paymentIds, confirmedBy } = req.body;
      const now = new Date().toISOString();

      const results = [];
      for (const id of paymentIds) {
        const payment = await storage.updatePayment(id, {
          status: 'paid',
          confirmed_by: confirmedBy,
          confirmed_at: now,
        });
        if (payment) {
          await storage.createAuditLog({
            action: 'payment_confirmed',
            performed_by: confirmedBy,
            target_user_id: payment.user_id,
            session_id: payment.session_id,
            program_id: payment.program_id,
            details: 'Payment confirmed via bulk action',
          });
          results.push(payment);
        }
      }

      res.json({ confirmed: results.length, payments: results });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk confirm payments" });
    }
  });

  // ============ AUDIT LOGS ============
  app.get("/api/audit-logs", async (_req: Request, res: Response) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

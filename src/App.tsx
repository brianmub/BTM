import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { TenantProvider } from '@/context/TenantContext';
import { LandingPage } from '@/features/landing/LandingPage';
import { SignUpPage } from '@/features/auth/SignUpPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPassword } from '@/features/auth/ForgotPassword';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardOverview } from '@/features/dashboard/DashboardOverview';
import { ProgramList } from '@/features/programs/ProgramList';
import { CreateProgram } from '@/features/programs/CreateProgram';
import { ProgramDetails } from '@/features/programs/ProgramDetails';
import { SessionList } from '@/features/programs/SessionList';
import { CreateSession } from '@/features/programs/CreateSession';
import { EditSession } from '@/features/programs/EditSession';
import { EnrollmentManager } from '@/features/programs/EnrollmentManager';
import { PaymentsPage } from '@/features/dashboard/PaymentsPage';
import { QRManagement } from '@/features/dashboard/QRManagement';
import { RewardsCenter } from '@/features/dashboard/RewardsCenter';
import { CertificateDesigner } from '@/features/dashboard/CertificateDesigner';
import { AnalyticsDashboard } from '@/features/dashboard/AnalyticsDashboard';
import { SettingsPage } from '@/features/dashboard/SettingsPage';
import { PlatformDashboard } from '@/features/admin/PlatformDashboard';
import { OrgLandingPage } from '@/features/public/OrgLandingPage';
import { ParticipantRegister } from '@/features/public/ParticipantRegister';
import { AcceptInvite } from '@/features/auth/AcceptInvite';
import { RequireRole } from '@/components/auth/RequireRole';
import { ParticipantLayout } from '@/components/layout/ParticipantLayout';
import { ParticipantDashboard } from '@/features/participant/ParticipantDashboard';
import { ProgramBrowser } from '@/features/participant/ProgramBrowser';
import { ParticipantProfile } from '@/features/participant/ParticipantProfile';
import { ParticipantQR } from '@/features/participant/ParticipantQR';
import { ParticipantProgramView } from '@/features/participant/ParticipantProgramView';
import { ParticipantPayments } from '@/features/participant/ParticipantPayments';
import { CellGroupDashboard } from '@/features/cellgroups/CellGroupDashboard';
import { CellMeetingRegister } from '@/features/cellgroups/CellMeetingRegister';
import { CellMeetingHistory } from '@/features/cellgroups/CellMeetingHistory';
import { AttendanceLogs } from '@/features/dashboard/AttendanceLogs';
import { UserDirectory } from '@/features/dashboard/UserDirectory';

function App() {
    return (
        <AuthProvider>
            <TenantProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                        {/* Auth & Public */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/signup" element={<SignUpPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/invite/:token" element={<AcceptInvite />} />
                        <Route path="/register" element={<ParticipantRegister />} />

                        {/* Public Portal */}
                        <Route path="/portal/:orgSlug" element={<OrgLandingPage />} />
                        <Route path="/portal/:orgSlug/register" element={<ParticipantRegister />} />
                        <Route path="/portal/:orgSlug/login" element={<LoginPage />} />

                        {/* Protected Dashboard Routes */}
                        <Route path="/dashboard" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin', 'facilitator']}>
                                <DashboardLayout><DashboardOverview /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/programs" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin', 'facilitator']}>
                                <DashboardLayout><ProgramList /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/programs/new" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin']}>
                                <DashboardLayout><CreateProgram /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/programs/:programId" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin', 'facilitator']}>
                                <DashboardLayout><ProgramDetails /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/programs/:programId/sessions" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin', 'facilitator']}>
                                <DashboardLayout><SessionList /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/programs/:programId/sessions/new" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin']}>
                                <DashboardLayout><CreateSession /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/programs/:programId/sessions/edit/:sessionId" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin']}>
                                <DashboardLayout><EditSession /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/enrollments" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin', 'facilitator']}>
                                <DashboardLayout><EnrollmentManager /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/payments" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin', 'facilitator']}>
                                <DashboardLayout><PaymentsPage /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/qr" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin', 'facilitator']}>
                                <DashboardLayout><QRManagement /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/attendance" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin', 'facilitator']}>
                                <DashboardLayout><AttendanceLogs /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/rewards" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin']}>
                                <DashboardLayout><RewardsCenter /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/rewards/certificates" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin']}>
                                <DashboardLayout><CertificateDesigner /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/analytics" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin']}>
                                <DashboardLayout><AnalyticsDashboard /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/settings" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin']}>
                                <DashboardLayout><SettingsPage /></DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/users" element={
                            <RequireRole roles={['platform_admin', 'system_admin', 'program_admin']}>
                                <DashboardLayout><UserDirectory /></DashboardLayout>
                            </RequireRole>
                        } />

                        {/* Platform Command Center */}
                        <Route path="/platform/admin" element={
                            <RequireRole roles={['platform_admin']}>
                                <DashboardLayout><PlatformDashboard /></DashboardLayout>
                            </RequireRole>
                        } />

                        {/* Cell Groups — Management & Facilitator */}
                        <Route path="/dashboard/cell-groups" element={
                            <RequireRole roles={['system_admin', 'program_admin', 'facilitator']}>
                                <DashboardLayout><CellGroupDashboard /></DashboardLayout>
                            </RequireRole>
                        } />
                        <Route path="/dashboard/cell-groups/:meetingId" element={
                            <RequireRole roles={['system_admin', 'program_admin', 'facilitator']}>
                                <DashboardLayout><CellMeetingRegister /></DashboardLayout>
                            </RequireRole>
                        } />
                        <Route path="/dashboard/cell-groups/:groupId/history" element={
                            <RequireRole roles={['system_admin', 'program_admin', 'facilitator']}>
                                <DashboardLayout><CellMeetingHistory /></DashboardLayout>
                            </RequireRole>
                        } />

                        {/* Participant Dashboard */}
                        <Route path="/portal/:orgSlug/dashboard" element={<ParticipantLayout><ParticipantDashboard /></ParticipantLayout>} />
                        <Route path="/portal/:orgSlug/dashboard/browse" element={<ParticipantLayout><ProgramBrowser /></ParticipantLayout>} />
                        <Route path="/portal/:orgSlug/dashboard/profile" element={<ParticipantLayout><ParticipantProfile /></ParticipantLayout>} />
                        <Route path="/portal/:orgSlug/dashboard/qr" element={<ParticipantLayout><ParticipantQR /></ParticipantLayout>} />
                        <Route path="/portal/:orgSlug/dashboard/program/:programId" element={<ParticipantLayout><ParticipantProgramView /></ParticipantLayout>} />
                        <Route path="/portal/:orgSlug/dashboard/payments" element={<ParticipantLayout><ParticipantPayments /></ParticipantLayout>} />

                        {/* Cell Groups in mobile portal (admins + facilitators) */}
                        <Route path="/portal/:orgSlug/dashboard/cell-groups" element={<RequireRole roles={['system_admin', 'program_admin', 'facilitator']}><ParticipantLayout><CellGroupDashboard /></ParticipantLayout></RequireRole>} />
                        <Route path="/portal/:orgSlug/dashboard/cell-groups/:meetingId" element={<RequireRole roles={['system_admin', 'program_admin', 'facilitator']}><ParticipantLayout><CellMeetingRegister /></ParticipantLayout></RequireRole>} />
                        <Route path="/portal/:orgSlug/dashboard/cell-groups/:groupId/history" element={<RequireRole roles={['system_admin', 'program_admin', 'facilitator']}><ParticipantLayout><CellMeetingHistory /></ParticipantLayout></RequireRole>} />
                    </Routes>
                </Router>
            </TenantProvider>
        </AuthProvider>
    );
}

export default App;

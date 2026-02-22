import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { TenantProvider } from '@/context/TenantContext';
import { LandingPage } from '@/features/landing/LandingPage';
import { SignUpPage } from '@/features/auth/SignUpPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardOverview } from '@/features/dashboard/DashboardOverview';
import { ProgramList } from '@/features/programs/ProgramList';
import { CreateProgram } from '@/features/programs/CreateProgram';
import { SessionList } from '@/features/programs/SessionList';
import { CreateSession } from '@/features/programs/CreateSession';
import { EnrollmentManager } from '@/features/programs/EnrollmentManager';
import { PaymentsPage } from '@/features/dashboard/PaymentsPage';
import { QRManagement } from '@/features/dashboard/QRManagement';
import { RewardsCenter } from '@/features/dashboard/RewardsCenter';
import { CertificateDesigner } from '@/features/dashboard/CertificateDesigner';
import { AnalyticsDashboard } from '@/features/dashboard/AnalyticsDashboard';
import { SettingsPage } from '@/features/dashboard/SettingsPage';
import { AssignmentsOverview } from '@/features/dashboard/AssignmentsOverview';
import { OrgLandingPage } from '@/features/public/OrgLandingPage';
import { ParticipantRegister } from '@/features/public/ParticipantRegister';
import { AcceptInvite } from '@/features/auth/AcceptInvite';
import { RequireRole } from '@/components/auth/RequireRole';
import { ParticipantLayout } from '@/components/layout/ParticipantLayout';
import { ParticipantDashboard } from '@/features/participant/ParticipantDashboard';
import { ProgramBrowser } from '@/features/participant/ProgramBrowser';
import { ParticipantProfile } from '@/features/participant/ParticipantProfile';
import { ParticipantQR } from '@/features/participant/ParticipantQR';
import { ParticipantAssignmentsPage } from '@/features/participant/ParticipantAssignmentsPage';
import { ParticipantProgramView } from '@/features/participant/ParticipantProgramView';
import { ProgramDetails } from '@/features/programs/ProgramDetails';

function App() {
    return (
        <AuthProvider>
            <TenantProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/signup" element={<SignUpPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/invite/:token" element={<AcceptInvite />} />

                        {/* Public Portal */}
                        <Route path="/portal/:orgSlug" element={<OrgLandingPage />} />
                        <Route path="/portal/:orgSlug/register" element={<ParticipantRegister />} />
                        <Route path="/portal/:orgSlug/login" element={<LoginPage />} />

                        {/* Dashboard Sub-routes */}
                        <Route path="/dashboard" element={
                            <DashboardLayout>
                                <DashboardOverview />
                            </DashboardLayout>
                        } />
                        <Route path="/dashboard/programs" element={
                            <DashboardLayout>
                                <ProgramList />
                            </DashboardLayout>
                        } />
                        <Route path="/dashboard/programs/new" element={
                            <DashboardLayout>
                                <CreateProgram />
                            </DashboardLayout>
                        } />
                        <Route path="/dashboard/assignments" element={
                            <RequireRole roles={['system_admin', 'program_admin', 'facilitator']}>
                                <DashboardLayout>
                                    <AssignmentsOverview />
                                </DashboardLayout>
                            </RequireRole>
                        } />
                        <Route path="/dashboard/programs/:programId/sessions" element={
                            <DashboardLayout>
                                <SessionList />
                            </DashboardLayout>
                        } />
                        <Route path="/dashboard/programs/:programId/sessions/new" element={
                            <DashboardLayout>
                                <CreateSession />
                            </DashboardLayout>
                        } />

                        <Route path="/dashboard/qr" element={
                            <DashboardLayout>
                                <QRManagement />
                            </DashboardLayout>
                        } />

                        <Route path="/dashboard/rewards" element={
                            <RequireRole roles={['system_admin', 'program_admin']}>
                                <DashboardLayout>
                                    <RewardsCenter />
                                </DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/rewards/certificates" element={
                            <RequireRole roles={['system_admin', 'program_admin']}>
                                <DashboardLayout>
                                    <CertificateDesigner />
                                </DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/analytics" element={
                            <RequireRole roles={['system_admin', 'program_admin']}>
                                <DashboardLayout>
                                    <AnalyticsDashboard />
                                </DashboardLayout>
                            </RequireRole>
                        } />

                        <Route path="/dashboard/programs/:programId" element={<RequireRole roles={['system_admin', 'program_admin', 'facilitator']}><DashboardLayout><ProgramDetails /></DashboardLayout></RequireRole>} />
                        <Route path="/dashboard/programs/:programId/sessions" element={<RequireRole roles={['system_admin', 'program_admin', 'facilitator']}><DashboardLayout><SessionList /></DashboardLayout></RequireRole>} />

                        {/* Enrollments & Payments */}
                        <Route path="/dashboard/enrollments" element={<RequireRole roles={['system_admin', 'program_admin', 'facilitator']}><DashboardLayout><EnrollmentManager /></DashboardLayout></RequireRole>} />
                        <Route path="/dashboard/payments" element={<RequireRole roles={['system_admin', 'program_admin', 'facilitator']}><DashboardLayout><PaymentsPage /></DashboardLayout></RequireRole>} />

                        {/* Settings - Admin only */}
                        <Route path="/dashboard/settings" element={
                            <RequireRole roles={['system_admin', 'program_admin']}>
                                <DashboardLayout>
                                    <SettingsPage />
                                </DashboardLayout>
                            </RequireRole>
                        } />

                        {/* Participant Dashboard */}
                        <Route path="/portal/:orgSlug/dashboard" element={
                            <ParticipantLayout>
                                <ParticipantDashboard />
                            </ParticipantLayout>
                        } />
                        <Route path="/portal/:orgSlug/dashboard/browse" element={
                            <ParticipantLayout>
                                <ProgramBrowser />
                            </ParticipantLayout>
                        } />
                        <Route path="/portal/:orgSlug/dashboard/profile" element={
                            <ParticipantLayout>
                                <ParticipantProfile />
                            </ParticipantLayout>
                        } />
                        <Route path="/portal/:orgSlug/dashboard/qr" element={
                            <ParticipantLayout>
                                <ParticipantQR />
                            </ParticipantLayout>
                        } />
                        <Route path="/portal/:orgSlug/dashboard/assignments" element={
                            <ParticipantLayout>
                                <ParticipantAssignmentsPage />
                            </ParticipantLayout>
                        } />
                        <Route path="/portal/:orgSlug/dashboard/program/:programId" element={
                            <ParticipantLayout>
                                <ParticipantProgramView />
                            </ParticipantLayout>
                        } />
                    </Routes>
                </Router>
            </TenantProvider>
        </AuthProvider>
    );
}

export default App;

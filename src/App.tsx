import { Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/layout/PublicLayout";
import { ParticipantLayout } from "./components/layout/ParticipantLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { ADMIN_ENTRY_PERMISSIONS } from "./auth/roleRouting";
import { HomePage } from "./features/public/HomePage";
import { LoginPage } from "./features/authPages/LoginPage";
import { SignupPage } from "./features/authPages/SignupPage";
import { RegistrationWizard } from "./features/registrationWizard/RegistrationWizard";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ProfilePage } from "./features/dashboard/ProfilePage";
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage";
import { EventsPage } from "./features/admin/EventsPage";
import { RegistrationsQueuePage } from "./features/admin/RegistrationsQueuePage";
import { RegistrationReviewPage } from "./features/admin/RegistrationReviewPage";
import { TeamsPage } from "./features/admin/TeamsPage";
import { PaymentsQueuePage } from "./features/admin/PaymentsQueuePage";
import { UsersPage } from "./features/admin/UsersPage";
import { RolesPage } from "./features/admin/RolesPage";
import { AnalyticsPage } from "./features/admin/AnalyticsPage";
import { ReportsPage } from "./features/admin/ReportsPage";
import { AuditLogsPage } from "./features/admin/AuditLogsPage";
import { SystemSettingsPage } from "./features/admin/SystemSettingsPage";
import { NotFoundPage } from "./routes/NotFoundPage";

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/register/:eventId"
          element={
            <ProtectedRoute participantOnly>
              <RegistrationWizard />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        element={
          <ProtectedRoute participantOnly>
            <ParticipantLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute anyPermission={ADMIN_ENTRY_PERMISSIONS}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="registrations" element={<RegistrationsQueuePage />} />
        <Route path="registrations/:id" element={<RegistrationReviewPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="payments" element={<PaymentsQueuePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

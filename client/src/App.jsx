import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMarketplaceActivityPage from "./pages/admin/AdminMarketplaceActivityPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AdminProviderApprovalsPage from "./pages/admin/AdminProviderApprovalsPage";
import AdminUsersOverviewPage from "./pages/admin/AdminUsersOverviewPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotificationsPage from "./pages/NotificationsPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import BookingsPage from "./pages/user/BookingsPage";
import BookingRequestPage from "./pages/user/BookingRequestPage";
import ServiceProfilePage from "./pages/user/ServiceProfilePage";
import ServicesPage from "./pages/user/ServicesPage";
import UserDashboardPage from "./pages/user/UserDashboardPage";

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AppLayout>
            <HomePage />
          </AppLayout>
        }
      />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={user ? <Navigate to="/" replace /> : <ResetPasswordPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/services/:serviceId" element={<ServiceProfilePage />} />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute roles={["user", "provider", "admin"]}>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute roles={["user"]}>
            <UserDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/:serviceId/book"
        element={
          <ProtectedRoute roles={["user"]}>
            <BookingRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute roles={["user", "provider", "admin"]}>
            <BookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider"
        element={
          <ProtectedRoute roles={["provider"]}>
            <ProviderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/providers"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminProviderApprovalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/activity"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminMarketplaceActivityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminUsersOverviewPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;

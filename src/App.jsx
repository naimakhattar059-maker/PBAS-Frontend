import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import LoginSplash from "./pages/LoginSplash";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Requests from "./pages/Requests";
import Payroll from "./pages/Payroll";
import EstimatesManagement from "./pages/EstimatesManagement";
import BudgetManagement from "./pages/BudgetManagement";
import InternalRevenue from "./pages/InternalRevenue";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Placeholder from "./pages/Placeholder";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import "./App.css";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginSplash />} />
        <Route path="/login/form" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/departments" element={<Requests />} />
          <Route path="/budget" element={<BudgetManagement />} />
          <Route path="/expenses" element={<Placeholder title="Expense Management" />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/estimates" element={<EstimatesManagement />} />
          <Route path="/internal-revenue" element={<InternalRevenue />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/requests" element={<Navigate to="/departments" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

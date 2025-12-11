import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Students from "./pages/Students";
import Placeholder from "./pages/Placeholder";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import "./App.css";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/students" element={<Students />} />
          <Route path="/departments" element={<Placeholder title="Department Management" />} />
          <Route path="/budget" element={<Placeholder title="Budget Management" />} />
          <Route path="/expenses" element={<Placeholder title="Expense Management" />} />
          <Route path="/payroll" element={<Placeholder title="Payroll Management" />} />
          <Route path="/fees" element={<Placeholder title="Fee Management" />} />
          <Route path="/reports" element={<Placeholder title="Reports" />} />
          <Route path="/notifications" element={<Placeholder title="Notifications" />} />
          <Route path="/requests" element={<Placeholder title="Requests & Approvals" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

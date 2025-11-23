import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import AppLayout from "./AppLayout";

const ProtectedRoute = () => {
  const { token } = useSelector((state) => state.auth);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

export default ProtectedRoute;

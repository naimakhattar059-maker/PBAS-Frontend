import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import AppLayout from "./AppLayout";
import { logout } from "../store/authSlice";
import { validateSession } from "../api/auth";

const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    if (!token) {
      setChecking(false);
      return undefined;
    }

    validateSession(token)
      .catch(() => {
        dispatch(logout());
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [dispatch, token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (checking) {
    return null;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

export default ProtectedRoute;

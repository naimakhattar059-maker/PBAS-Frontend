import { CheckCircleTwoTone, WarningTwoTone } from "@ant-design/icons";
import { Button, Typography, Spin, message } from "antd";
import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { verifyEmail } from "../api/auth";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/authSlice";
import "./VerifyEmail.css";

const { Title, Text } = Typography;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = searchParams.get("token");
  const [state, setState] = useState({ status: "loading", message: "", detail: "" });

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setState({ status: "error", message: "Missing verification token" });
        return;
      }
      try {
        const result = await verifyEmail(token);
        setState({ status: "success", message: "Your email is verified." });
        if (result.token && result.user) {
          dispatch(setAuth({ user: result.user, token: result.token }));
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        setState({
          status: "error",
          message: "This verification link may have expired or was already used.",
          detail: err.message,
        });
      }
    };
    run();
  }, [token]);

  const renderContent = () => {
    if (state.status === "loading") {
      return (
        <div className="verify-panel">
          <Spin />
          <Text style={{ display: "block", marginTop: 12 }}>Verifying your email...</Text>
        </div>
      );
    }

    if (state.status === "success") {
      return (
        <div className="verify-panel">
          <CheckCircleTwoTone twoToneColor="#52c41a" className="verify-icon" />
          <Title className="verify-title">Email verified</Title>
          <Text className="verify-subtitle">{state.message}</Text>
          <div className="verify-actions">
            <Button type="primary" onClick={() => navigate("/dashboard", { replace: true })}>
              Go to dashboard
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="verify-panel">
        <WarningTwoTone twoToneColor="#faad14" className="verify-icon" />
        <Title className="verify-title">Need a fresh link</Title>
        <Text className="verify-subtitle">
          This verification link may have expired or was already used. Please log in and request a
          new verification email.
        </Text>
        {state.detail ? (
          <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
            {state.detail}
          </Text>
        ) : null}
        <div className="verify-actions">
          <Button type="link" onClick={() => navigate("/login")}>
            Back to login
          </Button>
        </div>
      </div>
    );
  };

  return <div className="verify-shell">{renderContent()}</div>;
};

export default VerifyEmail;

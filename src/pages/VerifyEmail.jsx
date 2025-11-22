import { CheckCircleTwoTone, WarningTwoTone } from "@ant-design/icons";
import { Button, Typography, Spin, message } from "antd";
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { verifyEmail } from "../api/auth";

const { Title, Text } = Typography;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState({ status: "loading", message: "" });

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setState({ status: "error", message: "Verification token missing" });
        return;
      }
      try {
        await verifyEmail(token);
        setState({ status: "success", message: "Email verified successfully." });
      } catch (err) {
        setState({ status: "error", message: err.message });
        message.error(err.message);
      }
    };
    run();
  }, [token]);

  const renderContent = () => {
    if (state.status === "loading") {
      return (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <Spin />
          <Text style={{ display: "block", marginTop: 12 }}>Verifying your email...</Text>
        </div>
      );
    }

    if (state.status === "success") {
      return (
        <div style={{ textAlign: "center" }}>
          <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 44 }} />
          <Title level={3} style={{ marginTop: 12 }}>
            Email verified
          </Title>
          <Text>{state.message}</Text>
          <div style={{ marginTop: 16 }}>
            <Button type="primary">
              <Link to="/login">Go to login</Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ textAlign: "center" }}>
        <WarningTwoTone twoToneColor="#faad14" style={{ fontSize: 44 }} />
        <Title level={3} style={{ marginTop: 12 }}>
          Verification issue
        </Title>
        <Text>{state.message}</Text>
        <div style={{ marginTop: 16 }}>
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    );
  };

  return <AuthLayout title="Verify email">{renderContent()}</AuthLayout>;
};

export default VerifyEmail;

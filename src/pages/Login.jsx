import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Space, Typography, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "../components/AuthLayout";
import { login, resendVerification } from "../store/authSlice";
import { useEffect, useState } from "react";

const { Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((state) => state.auth);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    if (token) {
      message.success("Logged in");
      navigate("/dashboard");
    }
  }, [token, navigate]);

  const onFinish = async (values) => {
    setVerificationNeeded(false);
    setPendingEmail(values.email);
    try {
      await dispatch(login({ email: values.email, password: values.password })).unwrap();
    } catch (err) {
      if (err.payload?.needs_verification) {
        setVerificationNeeded(true);
        message.warning("Email not verified. Please verify to continue.");
      } else {
        message.error(err.message || err);
      }
    }
  };

  const resend = async () => {
    const email = pendingEmail || form.getFieldValue("email");
    if (!email) {
      return message.info("Enter your email to resend verification.");
    }
    try {
      await dispatch(resendVerification(email)).unwrap();
      message.info(`Verification email sent to ${email}`);
    } catch (err) {
      message.error(err.message || err);
    }
  };

  return (
    <AuthLayout title="Log in" subtitle="Access the Budget Automation System.">
      <Form layout="vertical" onFinish={onFinish} requiredMark="optional" form={form}>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Please enter your email" }]}
        >
          <Input size="middle" prefix={<MailOutlined />} placeholder="Enter email" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please enter your password" }]}
        >
          <Input.Password
            size="middle"
            prefix={<LockOutlined />}
            placeholder="Enter your password"
          />
        </Form.Item>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <Checkbox>Remember me</Checkbox>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={status === "loading"}
          style={{ marginTop: 4 }}
        >
          Log in
        </Button>

        {error ? (
          <Text type="danger" style={{ marginTop: 12, display: "block" }}>
            {error}
          </Text>
        ) : null}

        <Space style={{ marginTop: 16 }}>
          <Text>Don't have an account?</Text>
          <Link to="/register">Register</Link>
        </Space>

        {verificationNeeded ? (
          <Space style={{ marginTop: 12 }}>
            <Text type="warning">Email not verified.</Text>
            <Button type="link" size="small" onClick={resend}>
              Resend verification
            </Button>
          </Space>
        ) : null}
      </Form>
    </AuthLayout>
  );
};

export default Login;

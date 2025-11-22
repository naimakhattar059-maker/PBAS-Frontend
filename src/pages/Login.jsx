import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Space, Typography, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "../components/AuthLayout";
import { login } from "../store/authSlice";
import { useEffect } from "react";

const { Text } = Typography;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      message.success("Logged in");
    }
  }, [token]);

  const onFinish = async (values) => {
    try {
      await dispatch(login({ email: values.email, password: values.password })).unwrap();
    } catch (err) {
      message.error(err);
    }
  };

  return (
    <AuthLayout title="Log in" subtitle="Access the Budget Automation System.">
      <Form layout="vertical" onFinish={onFinish} requiredMark="optional">
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Please enter your email" }]}
        >
          <Input size="large" prefix={<MailOutlined />} placeholder="Enter email" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please enter your password" }]}
        >
          <Input.Password
            size="large"
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
      </Form>
    </AuthLayout>
  );
};

export default Login;

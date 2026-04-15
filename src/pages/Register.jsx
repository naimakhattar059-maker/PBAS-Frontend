import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, Row, Space, Typography, message, Tag, Modal } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "../components/AuthLayout";
import { register } from "../store/authSlice";
import { useEffect, useState } from "react";
import { fetchInvitation } from "../api/auth";

const { Text } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [invitation, setInvitation] = useState(null);
  const invitationToken = searchParams.get("invitation_token");

  useEffect(() => {
    const loadInvitation = async () => {
      if (!invitationToken) return;
      try {
        const data = await fetchInvitation(invitationToken);
        setInvitation(data.invitation);
      } catch (e) {
        message.warning("Invitation is invalid or expired");
      }
    };
    loadInvitation();
  }, [invitationToken]);

  const onFinish = async (values) => {
    try {
      const email = values.email;
      const payload = await dispatch(
        register({
          user: {
            email,
            username: values.username,
            password: values.password,
            password_confirmation: values.password_confirmation,
          },
          invitationToken,
        })
      ).unwrap();

      Modal.info({
        title: "Verify your email",
        content: `We sent a verification link to ${email}. Please check your inbox to activate your account.`,
        onOk: () => navigate("/login"),
      });
      if (!payload?.message) {
        message.success("Account created");
      }
    } catch (err) {
      message.error(err.message || err);
    }
  };

  return (
    <AuthLayout
      title="Register"
      subtitle={
        invitation
          ? `You're joining as ${invitation.role}`
          : "Create your student account or join via an invitation link."
      }
    >
      {invitation ? (
        <div style={{ marginBottom: 16 }}>
          <Tag color="blue">Invited role: {invitation.role}</Tag>
          <Text type="secondary"> Invitation email: {invitation.email}</Text>
        </div>
      ) : null}
      <Form layout="vertical" onFinish={onFinish} requiredMark="optional" form={form}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Email"
              name="email"
              initialValue={invitation?.email}
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input
                size="middle"
                prefix={<MailOutlined />}
                placeholder="Enter your email"
                disabled={Boolean(invitation?.email)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Please enter a username" }]}
            >
              <Input size="middle" prefix={<UserOutlined />} placeholder="Enter your username" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter a password" }]}
            >
              <Input.Password
                size="middle"
                prefix={<LockOutlined />}
                placeholder="Enter your password"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Confirm password"
              name="password_confirmation"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                size="middle"
                prefix={<LockOutlined />}
                placeholder="Confirm your password"
              />
            </Form.Item>
          </Col>
        </Row>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={status === "loading"}
        >
          Register
        </Button>

        {error ? (
          <Text type="danger" style={{ marginTop: 12, display: "block" }}>
            {error}
          </Text>
        ) : null}

        <Space style={{ marginTop: 16 }}>
          <Text>Already have an account?</Text>
          <Link to="/login">Log in</Link>
        </Space>
      </Form>
    </AuthLayout>
  );
};

export default Register;

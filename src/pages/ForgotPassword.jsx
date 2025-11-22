import { MailOutlined } from "@ant-design/icons";
import { Button, Form, Input, Typography, message } from "antd";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "../components/AuthLayout";
import { requestPasswordReset } from "../store/authSlice";

const { Text } = Typography;

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);

  const onFinish = async (values) => {
    try {
      await dispatch(requestPasswordReset(values.email)).unwrap();
      message.success("If that email exists, we've sent reset instructions.");
    } catch (err) {
      message.error(err);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="We'll email you a reset link.">
      <Form layout="vertical" onFinish={onFinish} requiredMark="optional">
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Please enter your email" }]}
        >
          <Input size="large" prefix={<MailOutlined />} placeholder="Enter your email" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large" loading={status === "loading"}>
          Send reset link
        </Button>
        {error ? (
          <Text type="danger" style={{ marginTop: 12, display: "block" }}>
            {error}
          </Text>
        ) : null}
        <div style={{ marginTop: 16 }}>
          <Link to="/login">Back to login</Link>
        </div>
      </Form>
    </AuthLayout>
  );
};

export default ForgotPassword;

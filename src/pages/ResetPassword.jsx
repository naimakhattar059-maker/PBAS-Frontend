import { LockOutlined } from "@ant-design/icons";
import { Button, Form, Input, Typography, message } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "../components/AuthLayout";
import { resetPassword } from "../store/authSlice";

const { Text } = Typography;

const ResetPassword = () => {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const onFinish = async (values) => {
    try {
      await dispatch(
        resetPassword({
          token,
          password: values.password,
          password_confirmation: values.password_confirmation,
        })
      ).unwrap();
      message.success("Password updated. You can now log in.");
    } catch (err) {
      message.error(err);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Reset password">
        <Text type="danger">Reset token missing. Please use the link from your email.</Text>
        <div style={{ marginTop: 12 }}>
          <Link to="/forgot-password">Request another link</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password">
      <Form layout="vertical" onFinish={onFinish} requiredMark="optional">
        <Form.Item
          label="New password"
          name="password"
          rules={[{ required: true, message: "Please enter a password" }]}
        >
          <Input.Password size="large" prefix={<LockOutlined />} placeholder="New password" />
        </Form.Item>
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
          <Input.Password size="large" prefix={<LockOutlined />} placeholder="Confirm password" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={status === "loading"}
        >
          Update password
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

export default ResetPassword;

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useSelector } from "react-redux";
import { createUser, deleteUser, listUsers, updateUser } from "../api/users";
import "./Users.css";

const { Title, Text } = Typography;

const roleColors = {
  admin: "volcano",
  teacher: "geekblue",
  principal: "purple",
  student: "green",
};

const Users = () => {
  const { token, user: currentUser } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const payload = await listUsers(token);
      setRows(payload.users || []);
    } catch (err) {
      message.error(err.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      if (editingId) {
        await updateUser(token, editingId, values);
        message.success("User updated");
      } else {
        await createUser(token, values);
        message.success("User created and credentials emailed");
      }
      form.resetFields();
      setEditingId(null);
      loadUsers();
    } catch (err) {
      message.error(err.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      email: record.email,
      username: record.username,
      student_id: record.student_id,
      role: record.role,
    });
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await deleteUser(token, id);
      message.success("User deleted");
      loadUsers();
    } catch (err) {
      message.error(err.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => {
    const base = [
      { title: "Name", dataIndex: "username", key: "username" },
      { title: "Email", dataIndex: "email", key: "email" },
      { title: "Student ID", dataIndex: "student_id", key: "student_id" },
      {
        title: "Role",
        dataIndex: "role",
        key: "role",
        render: (role) => <Tag color={roleColors[role] || "default"}>{role}</Tag>,
      },
    ];

    if (currentUser?.role === "admin") {
      base.push({
        title: "Actions",
        key: "actions",
        width: 160,
        render: (_, record) => (
          <Space size="small">
            <Button type="link" onClick={() => startEdit(record)}>
              Edit
            </Button>
            <Button danger type="link" onClick={() => handleDelete(record.id)}>
              Delete
            </Button>
          </Space>
        ),
      });
    }
    return base;
  }, [currentUser]);

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <Text className="eyebrow">User Management</Text>
          <Title level={3} style={{ margin: 0 }}>
            Team & Access
          </Title>
        </div>
        <Tag color="blue">{rows.length} users</Tag>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card className="users-card" title={editingId ? "Update user" : "Add new user"}>
            <Form
              layout="vertical"
              form={form}
              onFinish={handleSubmit}
              initialValues={{ role: "student" }}
              disabled={saving}
            >
              <Form.Item label="Full name" name="username" rules={[{ required: true, message: "Name is required" }]}>
                <Input placeholder="e.g. Jane Doe" />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Invalid email" }]}
              >
                <Input placeholder="user@school.edu" />
              </Form.Item>
              <Form.Item label="Student ID (optional)" name="student_id">
                <Input placeholder="For students only" />
              </Form.Item>
              <Form.Item label="Role" name="role" rules={[{ required: true, message: "Select a role" }]}>
                <Select
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "teacher", label: "Teacher" },
                    { value: "principal", label: "Principal" },
                    { value: "student", label: "Student" },
                  ]}
                />
              </Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving}>
                  {editingId ? "Save changes" : "Create user"}
                </Button>
                {editingId && (
                  <Button
                    onClick={() => {
                      setEditingId(null);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </Space>
              <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                Passwords are generated automatically and emailed to the user.
              </Text>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card className="users-card" title="User list">
            <Table
              loading={loading}
              columns={columns}
              dataSource={rows}
              rowKey="id"
              pagination={{ pageSize: 8 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Users;

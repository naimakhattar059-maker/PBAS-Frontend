import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { createUser, deleteUser, listUsers, updateUser, updateUserActivation } from "../api/users";
import "./Users.css";

const { Title, Text } = Typography;

const ROLE_OPTIONS = [
  { value: "head_of_institute", label: "Head of Institute" },
  { value: "admin_officer", label: "Admin Officer" },
  { value: "accountant", label: "Accountant" },
  { value: "staff", label: "Staff" },
  { value: "staff/hod", label: "HOD" },
  { value: "staff/coordinator", label: "Coordinator" },
  { value: "staff/librarian", label: "Librarian" },
  { value: "staff/college_assistant", label: "College Assistant" },
];

const roleColors = {
  head_of_institute: "purple",
  admin_officer: "cyan",
  accountant: "gold",
  staff: "green",
};

const formatLabel = (value) =>
  value
    ?.split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "-";

const formatCnicInput = (value) => {
  const digits = value?.replace(/\D/g, "").slice(0, 13) || "";
  const part1 = digits.slice(0, 5);
  const part2 = digits.slice(5, 12);
  const part3 = digits.slice(12, 13);

  return [part1, part2, part3].filter(Boolean).join("-");
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Users = () => {
  const { token, user: currentUser } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState({ open: false, src: "", title: "" });
  const roleSelection = Form.useWatch("roleSelection", form);
  const selectedRole = roleSelection?.startsWith("staff") ? "staff" : roleSelection;

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
      const [role, staffSubRole] = values.roleSelection?.split("/") || [];
      const selectedFile = values.attachment_image?.[0]?.originFileObj;
      const payload = {
        username: values.username,
        father_name: values.father_name,
        email: values.email,
        cnic: formatCnicInput(values.cnic),
        department: values.department,
        designation: values.designation,
        role,
        staff_sub_role: role === "staff" ? staffSubRole || null : null,
        attachment_image_data: selectedFile
          ? await fileToDataUrl(selectedFile)
          : values.attachment_image_data || null,
      };

      if (editingId) {
        await updateUser(token, editingId, payload);
        message.success("User updated");
      } else {
        await createUser(token, payload);
        message.success("User created and credentials emailed");
      }
      form.resetFields();
      setEditingId(null);
      setModalOpen(false);
      setDiscardModalOpen(false);
      loadUsers();
    } catch (err) {
      if (err.message === "Unauthorized") {
        message.error("Your session is not valid. Please log in again.");
      } else {
        message.error(err.message || "Action failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setModalOpen(true);
    form.setFieldsValue({
      email: record.email,
      username: record.username,
      cnic: record.cnic,
      father_name: record.father_name,
      designation: record.designation,
      department: record.department,
      roleSelection:
        record.role === "staff" && record.staff_sub_role ? `staff/${record.staff_sub_role}` : record.role,
      attachment_image_data: record.attachment_image_data || null,
      attachment_image: undefined,
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ roleSelection: "staff", attachment_image_data: null, attachment_image: undefined });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (form.isFieldsTouched()) {
      setDiscardModalOpen(true);
      return;
    }

    setEditingId(null);
    setModalOpen(false);
    form.resetFields();
  };

  const discardChanges = () => {
    setDiscardModalOpen(false);
    setEditingId(null);
    setModalOpen(false);
    form.resetFields();
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await deleteUser(token, id);
      message.success("User deleted");
      loadUsers();
    } catch (err) {
      if (err.message === "Unauthorized") {
        message.error("Your session is not valid. Please log in again.");
      } else {
        message.error(err.message || "Delete failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivation = async (record) => {
    setSaving(true);
    try {
      await updateUserActivation(token, record.id, !record.active);
      message.success(record.active ? "User deactivated" : "User activated");
      loadUsers();
    } catch (err) {
      message.error(err.message || "Status update failed");
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => {
    const base = [
      { title: "Name", dataIndex: "username", key: "username" },
      {
        title: "Image",
        key: "image",
        width: 90,
        render: (_, record) =>
          record.attachment_image_data ? (
            <Image
              className="user-list-image"
              src={record.attachment_image_data}
              alt={record.username}
              preview={false}
              onClick={() =>
                setImagePreview({
                  open: true,
                  src: record.attachment_image_data,
                  title: record.username,
                })
              }
            />
          ) : (
            <Text type="secondary">No image</Text>
          ),
      },
      { title: "Email", dataIndex: "email", key: "email" },
      { title: "CNIC", dataIndex: "cnic", key: "cnic" },
      { title: "Father Name", dataIndex: "father_name", key: "father_name" },
      { title: "Designation", dataIndex: "designation", key: "designation", render: formatLabel },
      { title: "Department", dataIndex: "department", key: "department" },
      {
        title: "Status",
        dataIndex: "active",
        key: "active",
        render: (active) => <Tag color={active ? "green" : "red"}>{active ? "Active" : "Inactive"}</Tag>,
      },
      {
        title: "Role",
        key: "role",
        render: (_, record) => (
          <Tag color={roleColors[record.role] || "default"}>
            {record.role === "staff" && record.staff_sub_role
              ? `${formatLabel(record.role)} / ${formatLabel(record.staff_sub_role)}`
              : formatLabel(record.role)}
          </Tag>
        ),
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
            <Popconfirm
              title={record.active ? "Deactivate this user?" : "Activate this user?"}
              onConfirm={() => handleToggleActivation(record)}
              okText={record.active ? "Deactivate" : "Activate"}
              cancelText="Cancel"
              disabled={record.id === currentUser?.id}
            >
              <Button type="link" disabled={record.id === currentUser?.id}>
                {record.active ? "Deactivate" : "Activate"}
              </Button>
            </Popconfirm>
            <Button danger type="link" onClick={() => handleDelete(record.id)}>
              Delete
            </Button>
          </Space>
        ),
      });
    }
    return base;
  }, [currentUser, saving]);

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <Text className="eyebrow">User Management</Text>
          <Title level={3} style={{ margin: 0 }}>
            Team & Access
          </Title>
        </div>
        <Space>
          <Tag color="blue">{rows.length} users</Tag>
          {currentUser?.role === "admin" && (
            <Button type="primary" onClick={openCreateModal}>
              Add User
            </Button>
          )}
        </Space>
      </div>

      <Card className="users-card" title="User list">
        <Table
          loading={loading}
          columns={columns}
          dataSource={rows}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editingId ? "Update user" : "Add new user"}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form
          className="users-form"
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{ roleSelection: "staff" }}
          disabled={saving}
        >
          <Form.Item label="Full name" name="username" rules={[{ required: true, message: "Name is required" }]}>
            <Input size="small" placeholder="e.g. Jane Doe" />
          </Form.Item>
          <Form.Item
            label="Father name"
            name="father_name"
            rules={[{ required: true, message: "Father name is required" }]}
          >
            <Input size="small" placeholder="e.g. John Doe" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Invalid email" }]}
          >
            <Input size="small" placeholder="user@school.edu" />
          </Form.Item>
          <Form.Item
            label="CNIC"
            name="cnic"
            rules={[
              { required: true, message: "CNIC is required" },
              { pattern: /^\d{5}-\d{7}-\d{1}$/, message: "CNIC must be in 35202-1234567-1 format" },
            ]}
            normalize={formatCnicInput}
          >
            <Input size="small" inputMode="numeric" maxLength={15} placeholder="e.g. 35202-1234567-1" />
          </Form.Item>
          <Form.Item label="Department" name="department" rules={[{ required: true, message: "Department is required" }]}>
            <Input size="small" placeholder="e.g. Administration" />
          </Form.Item>
          <Form.Item label="Role" name="roleSelection" rules={[{ required: true, message: "Select a role" }]}>
            <Select
              size="small"
              options={ROLE_OPTIONS}
              placeholder="Select role"
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            label="Designation"
            name="designation"
            rules={[{ required: true, message: "Designation is required" }]}
          >
            <Input
              size="small"
              placeholder={selectedRole === "staff" ? "e.g. Senior Coordinator" : "e.g. Accounts Officer"}
            />
          </Form.Item>
          <Form.Item label="Attachment" name="attachment_image" valuePropName="fileList" getValueFromEvent={(event) => event?.fileList}>
            <Upload
              accept="image/*"
              beforeUpload={() => false}
              maxCount={1}
              listType="text"
            >
              <Button size="small" icon={<UploadOutlined />}>
                Add Image
              </Button>
            </Upload>
          </Form.Item>
          {form.getFieldValue("attachment_image_data") && !form.getFieldValue("attachment_image")?.length ? (
            <div className="existing-image-block">
              <Text type="secondary">Current attachment</Text>
              <Image
                className="user-list-image"
                src={form.getFieldValue("attachment_image_data")}
                alt="Current attachment"
                preview={false}
                onClick={() =>
                  setImagePreview({
                    open: true,
                    src: form.getFieldValue("attachment_image_data"),
                    title: form.getFieldValue("username") || "User attachment",
                  })
                }
              />
            </div>
          ) : null}
          <Space>
            <Button size="small" type="primary" htmlType="submit" loading={saving}>
              {editingId ? "Save changes" : "Create user"}
            </Button>
            <Button size="small" onClick={closeModal}>Cancel</Button>
          </Space>
          <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
            Passwords are generated automatically and emailed to the user.
          </Text>
        </Form>
      </Modal>

      <Modal
        open={discardModalOpen}
        title="Discard changes?"
        onCancel={() => setDiscardModalOpen(false)}
        zIndex={2100}
        maskClosable={false}
        footer={
          <Space>
            <Button size="small" onClick={() => setDiscardModalOpen(false)}>
              Cancel
            </Button>
            <Button size="small" danger type="primary" onClick={discardChanges}>
              Discard
            </Button>
          </Space>
        }
        width={420}
      >
        <Text type="secondary">You have unsaved changes in this form. Discard them and close the modal?</Text>
      </Modal>

      <Modal
        open={imagePreview.open}
        title={imagePreview.title}
        footer={null}
        onCancel={() => setImagePreview({ open: false, src: "", title: "" })}
        width={720}
      >
        <img className="user-preview-image" src={imagePreview.src} alt={imagePreview.title} />
      </Modal>
    </div>
  );
};

export default Users;

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Timeline,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import { BankOutlined, CheckOutlined, CloseCircleOutlined, DeleteOutlined, EditOutlined, FileTextOutlined, FilterOutlined, HistoryOutlined, LaptopOutlined, SendOutlined, UploadOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import AccessDenied from "../components/AccessDenied";
import { hasAnyPermission, hasPermission } from "../utils/permissions";
import {
  approveRequest,
  completeRequest,
  createRequest,
  deleteRequest,
  listRequests,
  rejectRequest,
  submitRequest,
  updateRequest,
  verifyRequest,
} from "../api/requests";
import { listBudgetOptions } from "../api/budgets";
import { listRevenueHeads } from "../api/internalRevenue";
import "./BudgetManagement.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

const requestTypeOptions = [
  { value: "budget", label: "Government Grant" },
  { value: "resource", label: "Internal Revenue" },
  { value: "payroll", label: "Payroll" },
];

const requestTypeLabels = requestTypeOptions.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {}
);

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

const capFirst = (value) =>
  value ? `${String(value).charAt(0).toUpperCase()}${String(value).slice(1)}` : value;

const statusColors = {
  draft: "default",
  submitted: "processing",
  verified: "blue",
  approved: "green",
  completed: "purple",
  rejected: "red",
};

const requestTypeIcons = {
  budget: <BankOutlined />,
  resource: <LaptopOutlined />,
  payroll: <FileTextOutlined />,
  general: <FileTextOutlined />,
};

const isHeadOfInstitute = (user) => user?.role === "head_of_institute";

const getActionFlag = (record, key, fallback = false) =>
  typeof record.actions?.[key] === "boolean" ? record.actions[key] : fallback;

const canSubmitRecord = (record) => getActionFlag(record, "can_submit", record.status === "draft");
const canEditRecord = (record) => getActionFlag(record, "can_edit", record.status === "draft");
const canVerifyRecord = (record) => getActionFlag(record, "can_verify", record.status === "submitted");
const canApproveRecord = (record) => getActionFlag(record, "can_approve", record.status === "verified");
const canRejectRecord = (record) => getActionFlag(record, "can_reject", ["submitted", "verified"].includes(record.status));

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Requests = () => {
  const { token, user: currentUser } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [revenueHeads, setRevenueHeads] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [auditPreview, setAuditPreview] = useState({ open: false, title: "", entries: [] });

  const canViewRequests = hasAnyPermission(currentUser, ["view_requests"]) || isHeadOfInstitute(currentUser);
  const canCreateRequests = hasPermission(currentUser, "create_requests");
  const canUpdateRequests = hasPermission(currentUser, "update_requests");
  const canVerifyRequests = hasPermission(currentUser, "verify_requests");
  const canApproveRequests = hasPermission(currentUser, "approve_requests") || isHeadOfInstitute(currentUser);
  const budgetOptions = useMemo(
    () =>
      budgets.map((budget) => ({
        value: budget.id,
        label: `${budget.name} - PKR ${new Intl.NumberFormat("en-PK").format(
          Number(budget.remaining_amount ?? budget.amount ?? 0)
        )} left`,
      })),
    [budgets]
  );

  const counts = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        },
        { draft: 0, submitted: 0, verified: 0, approved: 0, completed: 0, rejected: 0 }
      ),
    [items]
  );

  const loadRequests = async () => {
    setLoading(true);
    try {
      const payload = await listRequests(token, statusFilter);
      setItems(payload.requests || []);
    } catch (err) {
      message.error(err.message || "Could not load requests");
    } finally {
      setLoading(false);
    }
  };

  const loadBudgets = async () => {
    try {
      const payload = await listBudgetOptions(token);
      setBudgets(payload.budgets || []);
    } catch (err) {
      message.error(err.message || "Could not load budgets");
    }
  };

  useEffect(() => {
    if (token && canViewRequests) {
      loadRequests();
      if (canCreateRequests) {
        loadBudgets();
        listRevenueHeads(token).then((payload) => setRevenueHeads(payload.revenue_heads || [])).catch((error) => message.error(error.message));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canViewRequests, canCreateRequests, statusFilter]);

  const resetForm = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      request_type: "resource",
      priority: "normal",
      amount: 0,
      attachment: undefined,
      attachment_data: null,
      attachment_name: null,
      budget_id: undefined,
    });
  };

  useEffect(() => {
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!canViewRequests) {
    return <AccessDenied title="Requests & Approvals" />;
  }

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      title: record.title,
      request_type: record.request_type,
      department: record.department,
      requested_by: record.requested_by,
      priority: record.priority,
      amount: record.amount,
      quantity: record.quantity,
      revenue_head_id: record.revenue_head_id || undefined,
      details: record.details,
      attachment_data: record.attachment_data || null,
      attachment_name: record.attachment_name || null,
      attachment: undefined,
      budget_id: record.budget_id || undefined,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (form.isFieldsTouched()) {
      setDiscardModalOpen(true);
      return;
    }

    setModalOpen(false);
    resetForm();
  };

  const submitForm = async (values) => {
    setSaving(true);
    const selectedFile = values.attachment?.[0]?.originFileObj;
    const attachment_data = selectedFile ? await fileToDataUrl(selectedFile) : values.attachment_data || null;
    const payload = {
      title: values.title?.trim(),
      request_type: values.request_type,
      department: values.department?.trim(),
      requested_by: values.requested_by?.trim(),
      priority: values.priority,
      amount: values.amount || 0,
      quantity: values.quantity || null,
      details: values.details?.trim(),
      attachment_name: selectedFile?.name || values.attachment_name || null,
      attachment_data,
      budget_id: values.request_type === "budget" ? values.budget_id || null : null,
      revenue_head_id: values.request_type === "resource" ? values.revenue_head_id || null : null,
    };

    try {
      if (editingId) {
        await updateRequest(token, editingId, payload);
        message.success("Request updated");
      } else {
        await createRequest(token, payload);
        message.success("Request created");
      }
      setModalOpen(false);
      setDiscardModalOpen(false);
      resetForm();
      loadRequests();
    } catch (err) {
      message.error(err.message || "Could not save request");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action, id, note) => {
    setSaving(true);
    try {
      await action(token, id, note);
      message.success("Request updated");
      loadRequests();
    } catch (err) {
      message.error(err.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const actionButtons = (record) => {
    const canManageBeforeSubmit = ["draft", "rejected"].includes(record.status) && canCreateRequests;
    const canReviewSubmitted = record.status === "submitted" && canVerifyRequests;
    const canFinalizeVerified = record.status === "verified" && canApproveRequests;
    const actions = [
      canManageBeforeSubmit && canUpdateRequests && canEditRecord(record) && (
        <Button key="edit" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
          Edit
        </Button>
      ),
      record.actions?.can_complete && (
        <Button key="handover" size="small" onClick={() => {
          Modal.confirm({
            title: "Complete resource handover",
            content: <Input.TextArea id="handover-details" placeholder="Recipient, quantity and handover details" />,
            onOk: () => runAction(completeRequest, record.id, document.getElementById("handover-details")?.value),
          });
        }}>Record handover</Button>
      ),
      canManageBeforeSubmit && canSubmitRecord(record) && (
        <Button key="submit" size="small" type="primary" icon={<SendOutlined />} onClick={() => runAction(submitRequest, record.id)}>
          Submit
        </Button>
      ),
      Array.isArray(record.audit_entries) && record.audit_entries.length > 0 && (
        <Button
          key="audit"
          size="small"
          icon={<HistoryOutlined />}
          onClick={() => {
            setAuditPreview({
              open: true,
              title: record.title,
              entries: record.audit_entries || [],
            });
          }}
        >
          Audit
        </Button>
      ),
      canReviewSubmitted && canVerifyRecord(record) && (
        <Button
          key="verify"
          size="small"
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => {
            Modal.confirm({
              title: "Verify request?",
              content: "This will move the request to verified.",
              okText: "Verify",
              onOk: () => runAction(verifyRequest, record.id, "Verified by Admin Officer"),
            });
          }}
        >
          Verify
        </Button>
      ),
      canReviewSubmitted && canRejectRecord(record) && (
        <Button
          key="reject-submitted"
          danger
          size="small"
          icon={<CloseCircleOutlined />}
          onClick={() => {
            Modal.confirm({
              title: "Reject request?",
              content: "This will mark the request as rejected.",
              okText: "Reject",
              okButtonProps: { danger: true },
              onOk: () => runAction(rejectRequest, record.id, "Rejected during admin review"),
            });
          }}
        >
          Reject
        </Button>
      ),
      canFinalizeVerified && canApproveRecord(record) && (
        <Button
          key="approve"
          size="small"
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => {
            Modal.confirm({
              title: "Approve request?",
              content: "This will finalize the request.",
              okText: "Approve",
              type: "primary",
              onOk: () => runAction(approveRequest, record.id, "Approved by HOI"),
            });
          }}
        >
          Approve
        </Button>
      ),
      canFinalizeVerified && canRejectRecord(record) && (
        <Button
          key="reject-verified"
          danger
          size="small"
          icon={<CloseCircleOutlined />}
          onClick={() => {
            Modal.confirm({
              title: "Reject request?",
              content: "This will mark the request as rejected.",
              okText: "Reject",
              okButtonProps: { danger: true },
              onOk: () => runAction(rejectRequest, record.id, "Rejected by HOI"),
            });
          }}
        >
          Reject
        </Button>
      ),
      canManageBeforeSubmit && canUpdateRequests && canEditRecord(record) && (
        <Button
          key="delete"
          aria-label="Delete"
          title="Delete"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => {
            Modal.confirm({
              title: "Delete request?",
              content: `Delete ${record.title}?`,
              okText: "Delete",
              okButtonProps: { danger: true },
              onOk: async () => {
                await runAction(deleteRequest, record.id);
              },
            });
          }}
        />
      ),
    ].filter(Boolean);

    return actions.length > 0 ? (
      <Space size={6} wrap className="request-action-buttons">
        {actions}
      </Space>
    ) : (
      <Text type="secondary">No actions</Text>
    );
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 160,
      ellipsis: true,
      render: (title, record) => (
        <Space size={8} className="request-title-cell">
          <span className={`request-title-icon request-title-icon-${record.request_type || "general"}`}>
            {requestTypeIcons[record.request_type] || requestTypeIcons.general}
          </span>
          <Text ellipsis title={title} className="request-title-text">
            {title}
          </Text>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "request_type",
      key: "request_type",
      width: 160,
      render: (value) => requestTypeLabels[value] || capFirst(value),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      width: 140,
      ellipsis: true,
    },
    {
      title: "Requested By",
      dataIndex: "requested_by",
      key: "requested_by",
      width: 130,
      ellipsis: true,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => (
        <Tag color={priority === "high" ? "red" : priority === "low" ? "green" : "blue"}>
          {capFirst(priority)}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount) => `PKR ${new Intl.NumberFormat("en-PK").format(Number(amount || 0))}`,
    },
    {
      title: "Government Grant",
      dataIndex: "budget",
      key: "budget",
      width: 220,
      render: (budget) =>
        budget ? (
          <div className="request-budget-cell" title={`${budget.name} ${budget.budget_head || ""} ${budget.budget_category || ""}`}>
            <Text className="request-budget-name" strong>
              {budget.name}
            </Text>
            <Text type="secondary" className="request-budget-meta">
              {budget.budget_head || "No head"}
              {budget.budget_category ? ` • ${budget.budget_category}` : ""}
            </Text>
          </div>
        ) : (
          <Text type="secondary">None</Text>
        ),
    },
    {
      title: "Attachment",
      dataIndex: "attachment_name",
      key: "attachment_name",
      width: 220,
      ellipsis: true,
      render: (value) =>
        value ? (
          <Tag color="purple" className="request-attachment-tag" title={value}>
            {value}
          </Tag>
        ) : (
          <Text type="secondary">None</Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status) => <Tag color={statusColors[status] || "default"}>{capFirst(status)}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 260,
      render: (_, record) => actionButtons(record),
    },
  ];

  return (
    <div className="budget-page">
      <div className="budget-header requests-header">
        <div className="requests-heading-stack">
          <div className="requests-title-block">
            <Title level={3}>Requests & Approvals</Title>
            {canCreateRequests ? (
              <Button type="primary" size="small" className="budget-add-button requests-new-button" onClick={openCreate}>
                New Request
              </Button>
            ) : null}
          </div>
          <Text type="secondary">Office Assistant enters requests, Admin Officer verifies, and HOI approves.</Text>
        </div>
        <Space className="requests-header-actions">
          <Select
            allowClear
            className="requests-status-filter"
            suffixIcon={<FilterOutlined />}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Filter status"
            options={[
              { value: "draft", label: "Draft" },
              { value: "submitted", label: "Submitted" },
              { value: "verified", label: "Verified" },
              { value: "approved", label: "Approved" },
              { value: "completed", label: "Completed" },
              { value: "rejected", label: "Rejected" },
            ]}
          />
        </Space>
      </div>

      <Row gutter={[16, 16]} className="requests-status-row">
        {Object.entries(counts).map(([key, value]) => (
          <Col xs={12} sm={8} lg={4} key={key}>
            <Card bordered={false} className={`request-stat-card request-stat-card-${key}`}>
              <Text type="secondary" className="request-stat-label">
                {capFirst(key)}
              </Text>
              <Title level={3} style={{ marginBottom: 0 }} className="request-stat-value">
                {value}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 16 }} className="requests-table-card">
        <div className="requests-table-shell">
          <Table
            className="requests-table"
            loading={loading}
            columns={columns}
            dataSource={items}
            rowKey="id"
            pagination={{ pageSize: 6, size: "small", showSizeChanger: false, position: ["bottomRight"] }}
            tableLayout="fixed"
            scroll={{ x: 1370 }}
          />
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit request" : "New request"}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
        width={760}
      >
        <Form form={form} layout="vertical" onFinish={submitForm}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Title" name="title" rules={[{ required: true, message: "Enter title" }]}>
                <Input placeholder="Request title" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Request Type"
                name="request_type"
                rules={[{ required: true, message: "Select type" }]}
              >
                <Select options={requestTypeOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Department" name="department" rules={[{ required: true, message: "Enter department" }]}>
                <Input placeholder="Department" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Requested By"
                name="requested_by"
                rules={[{ required: true, message: "Enter requester" }]}
              >
                <Input placeholder="Staff / HOD name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Priority" name="priority" rules={[{ required: true, message: "Select priority" }]}>
                <Select options={priorityOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Amount" name="amount">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, next) => prev.request_type !== next.request_type}>
                {({ getFieldValue }) => getFieldValue("request_type") === "resource" ? (
                  <Form.Item label="Resource quantity" name="quantity" rules={[{ required: true, message: "Enter resource quantity" }]}>
                    <InputNumber min={1} precision={0} style={{ width: "100%" }} />
                  </Form.Item>
                ) : null}
              </Form.Item>
            </Col>
          </Row>
          <Form.Item noStyle shouldUpdate={(prev, next) => prev.request_type !== next.request_type}>
            {({ getFieldValue }) =>
              getFieldValue("request_type") === "budget" ? (
                <Form.Item
                  label="Select Government Grant"
                  name="budget_id"
                  rules={[{ required: true, message: "Choose the government grant for this request" }]}
                >
                  <Select placeholder="Choose government grant" options={budgetOptions} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, next) => prev.request_type !== next.request_type}>
            {({ getFieldValue }) => getFieldValue("request_type") === "resource" ? (
              <Form.Item label="Internal revenue head" name="revenue_head_id" rules={[{ required: true, message: "Choose a revenue head" }]}>
                <Select options={revenueHeads.filter((head) => head.active).map((head) => ({ value: head.id, label: `${head.name} — PKR ${head.balance} available` }))} />
              </Form.Item>
            ) : null}
          </Form.Item>
          <Form.Item label="Attachment" name="attachment" valuePropName="fileList" getValueFromEvent={(event) => event?.fileList}>
            <Upload accept="*/*" beforeUpload={() => false} maxCount={1} listType="text">
              <Button icon={<UploadOutlined />}>Upload file</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="Details" name="details">
            <TextArea rows={4} placeholder="Write request details" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editingId ? "Update" : "Create"}
            </Button>
            <Button onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        open={discardModalOpen}
        title="Discard changes?"
        onCancel={() => setDiscardModalOpen(false)}
        footer={[
          <Button key="keep" onClick={() => setDiscardModalOpen(false)}>
            Keep editing
          </Button>,
          <Button key="discard" danger type="primary" onClick={() => {
            setDiscardModalOpen(false);
            setModalOpen(false);
            resetForm();
          }}>
            Discard
          </Button>,
        ]}
      >
        <Text type="secondary">You have unsaved changes in this request form.</Text>
      </Modal>

      <Modal
        open={auditPreview.open}
        title={`Audit history: ${auditPreview.title}`}
        footer={null}
        onCancel={() => setAuditPreview({ open: false, title: "", entries: [] })}
        width={720}
      >
        <Timeline
          items={(auditPreview.entries || []).map((entry) => ({
            children: (
              <div>
                <Text strong>{entry.action}</Text>
                <div>
                  {entry.by} ({entry.role})
                </div>
                {entry.note ? <Text type="secondary">{entry.note}</Text> : null}
                <div>
                  <Text type="secondary">{entry.at}</Text>
                </div>
              </div>
            ),
          }))}
        />
      </Modal>

    </div>
  );
};

export default Requests;

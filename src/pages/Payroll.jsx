import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popover,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, MoreOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import AccessDenied from "../components/AccessDenied";
import { hasAnyPermission, hasPermission } from "../utils/permissions";
import {
  approvePayrollRun,
  createPayrollRun,
  deletePayrollRun,
  generatePayrollRun,
  listPayrollRuns,
  rejectPayrollRun,
  updatePayrollRun,
} from "../api/payrolls";

const { Title, Text } = Typography;
const { TextArea } = Input;

const monthOptions = [
  "January","February","March","April","May","June","July","August","September","October","November","December",
].map((month) => ({ value: month, label: month }));

const statusColors = {
  draft: "default",
  generated: "processing",
  approved: "green",
  rejected: "red",
};

const Payroll = () => {
  const { token, user: currentUser } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [popoverOpenId, setPopoverOpenId] = useState(null);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);

  const canViewPayroll = hasAnyPermission(currentUser, ["view_payroll"]);
  const canGeneratePayroll = hasPermission(currentUser, "generate_payroll");
  const canApprovePayroll = hasPermission(currentUser, "approve_payroll");

  const stats = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          acc.total += Number(item.total_amount || 0);
          return acc;
        },
        { draft: 0, generated: 0, approved: 0, rejected: 0, total: 0 }
      ),
    [items]
  );

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      const payload = await listPayrollRuns(token);
      setItems(payload.payroll_runs || []);
    } catch (err) {
      message.error(err.message || "Could not load payroll");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && canViewPayroll) {
      loadPayrolls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canViewPayroll]);

  const resetForm = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      month: monthOptions[new Date().getMonth()].value,
      year: new Date().getFullYear(),
      employee_count: 0,
      total_amount: 0,
    });
  };

  useEffect(() => {
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!canViewPayroll) {
    return <AccessDenied title="Payroll Management" />;
  }

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      month: record.month,
      year: record.year,
      employee_count: record.employee_count,
      total_amount: record.total_amount,
      notes: record.notes,
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
    const payload = {
      month: values.month,
      year: values.year,
      employee_count: values.employee_count,
      total_amount: values.total_amount || 0,
      notes: values.notes?.trim(),
    };

    try {
      if (editingId) {
        await updatePayrollRun(token, editingId, payload);
        message.success("Payroll updated");
      } else {
        await createPayrollRun(token, payload);
        message.success("Payroll created");
      }
      setModalOpen(false);
      setDiscardModalOpen(false);
      resetForm();
      loadPayrolls();
    } catch (err) {
      message.error(err.message || "Could not save payroll");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action, id, note) => {
    setSaving(true);
    try {
      await action(token, id, note);
      loadPayrolls();
      message.success("Payroll updated");
    } catch (err) {
      message.error(err.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const actionMenu = (record) => (
    <Space direction="vertical" style={{ width: 160 }}>
      <Button
        type="text"
        icon={<EditOutlined />}
        disabled={record.status !== "draft"}
        onClick={() => {
          setPopoverOpenId(null);
          openEdit(record);
        }}
      >
        Edit
      </Button>
      <Button
        type="text"
        disabled={record.status !== "draft" || !canGeneratePayroll}
        onClick={() => {
          setPopoverOpenId(null);
          runAction(generatePayrollRun, record.id);
        }}
      >
        Generate
      </Button>
      <Button
        type="text"
        disabled={record.status !== "generated" || !canApprovePayroll}
        onClick={() => {
          setPopoverOpenId(null);
          Modal.confirm({
            title: "Approve payroll?",
            okText: "Approve",
            onOk: () => runAction(approvePayrollRun, record.id, "Approved by HOI"),
          });
        }}
      >
        Approve
      </Button>
      <Button
        danger
        type="text"
        disabled={!canApprovePayroll || record.status === "approved"}
        onClick={() => {
          setPopoverOpenId(null);
          Modal.confirm({
            title: "Reject payroll?",
            okText: "Reject",
            okButtonProps: { danger: true },
            onOk: () => runAction(rejectPayrollRun, record.id, "Rejected by reviewer"),
          });
        }}
      >
        Reject
      </Button>
      <Button
        danger
        type="text"
        icon={<DeleteOutlined />}
        disabled={record.status !== "draft"}
        onClick={() => {
          setPopoverOpenId(null);
          Modal.confirm({
            title: "Delete payroll run?",
            okText: "Delete",
            okButtonProps: { danger: true },
            onOk: async () => {
              await runAction(deletePayrollRun, record.id);
            },
          });
        }}
      >
        Delete
      </Button>
    </Space>
  );

  const columns = [
    { title: "Month", dataIndex: "month", key: "month" },
    { title: "Year", dataIndex: "year", key: "year" },
    { title: "Employees", dataIndex: "employee_count", key: "employee_count" },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (value) => `PKR ${new Intl.NumberFormat("en-PK").format(Number(value || 0))}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={statusColors[status] || "default"}>{status}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Popover
          trigger="click"
          placement="bottomRight"
          open={popoverOpenId === record.id}
          onOpenChange={(open) => setPopoverOpenId(open ? record.id : null)}
          content={actionMenu(record)}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Popover>
      ),
    },
  ];

  return (
    <div className="budget-page">
      <div className="budget-header">
        <div>
          <Title level={3}>Payroll Management</Title>
          <Text type="secondary">Accountant prepares payroll, HOI approves it, and records stay internal.</Text>
        </div>
        {canGeneratePayroll ? (
          <Button type="primary" size="small" className="budget-add-button" onClick={openCreate}>
            New Payroll
          </Button>
        ) : null}
      </div>

      <Row gutter={[16, 16]}>
        {[
          ["draft", stats.draft],
          ["generated", stats.generated],
          ["approved", stats.approved],
          ["rejected", stats.rejected],
        ].map(([label, value]) => (
          <Col xs={12} sm={6} key={label}>
            <Card bordered={false}>
              <Text type="secondary">{label}</Text>
              <Title level={3} style={{ marginBottom: 0 }}>{value}</Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">Total payroll amount</Text>
          <Title level={4} style={{ marginTop: 4 }}>PKR {new Intl.NumberFormat("en-PK").format(stats.total)}</Title>
        </div>
        <Table loading={loading} columns={columns} dataSource={items} rowKey="id" pagination={{ pageSize: 8 }} />
      </Card>

      <Modal open={modalOpen} title={editingId ? "Edit payroll" : "New payroll"} onCancel={closeModal} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={submitForm}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Month" name="month" rules={[{ required: true }]}>
                <Select options={monthOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Year" name="year" rules={[{ required: true }]}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Employees" name="employee_count" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Total Amount" name="total_amount" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Notes" name="notes">
            <TextArea rows={4} placeholder="Internal payroll notes" />
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
          <Button key="keep" onClick={() => setDiscardModalOpen(false)}>Keep editing</Button>,
          <Button
            key="discard"
            danger
            type="primary"
            onClick={() => {
              setDiscardModalOpen(false);
              setModalOpen(false);
              resetForm();
            }}
          >
            Discard
          </Button>,
        ]}
      >
        <Text type="secondary">Unsaved payroll changes will be lost.</Text>
      </Modal>
    </div>
  );
};

export default Payroll;

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
  Empty,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  DollarOutlined,
} from "@ant-design/icons";
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
import {
  createPayrollStaff,
  deletePayrollStaff,
  updatePayrollStaff,
} from "../api/payrollStaffs";
import { updatePayrollRunItem } from "../api/payrollRunItems";
import "./Payroll.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((month) => ({ value: month, label: month }));

const employmentTypeOptions = [
  { value: "regular", label: "Regular" },
  { value: "contract", label: "Contract" },
  { value: "contact", label: "Contact" },
  { value: "part_time", label: "Part Time" },
  { value: "temporary", label: "Temporary" },
];

const fallbackStaffCategoryOptions = [
  { value: "teaching", label: "Teaching" },
  { value: "non_teaching", label: "Non Teaching" },
  { value: "administrative", label: "Administrative" },
  { value: "technical", label: "Technical" },
  { value: "support", label: "Support" },
  { value: "contract_based", label: "Contract Based" },
  { value: "contact_based", label: "Contact Based" },
  { value: "part_time", label: "Part Time" },
  { value: "temporary", label: "Temporary" },
];

const paymentStatusColors = {
  pending: "default",
  partial: "gold",
  paid: "green",
  hold: "red",
};

const runStatusColors = {
  draft: "default",
  generated: "processing",
  approved: "blue",
  paid: "green",
  rejected: "red",
};

const toTitle = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const money = (value) => `PKR ${new Intl.NumberFormat("en-PK").format(Number(value || 0))}`;

const sumValues = (values = {}) =>
  Object.values(values).reduce((total, value) => total + Number(value || 0), 0);

const Payroll = () => {
  const { token, user: currentUser } = useSelector((state) => state.auth);
  const [runForm] = Form.useForm();
  const [staffForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const watchedMonthlyBasicPay = Form.useWatch("monthly_basic_pay", staffForm) || 0;
  const watchedHra = Form.useWatch("hra", staffForm) || 0;
  const watchedConveyance = Form.useWatch("conveyance", staffForm) || 0;
  const watchedMedical = Form.useWatch("medical", staffForm) || 0;
  const watchedIntegratedAllowance = Form.useWatch("integrated_allowance", staffForm) || 0;
  const watchedAdhocAllowance = Form.useWatch("adhoc_allowance", staffForm) || 0;
  const watchedDraAllowance = Form.useWatch("dra_allowance", staffForm) || 0;
  const watchedTeachingAllowance = Form.useWatch("teaching_allowance", staffForm) || 0;
  const watchedDeductionAmount = Form.useWatch("deduction_amount", staffForm) || 0;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [summary, setSummary] = useState({});
  const [payrollMeta, setPayrollMeta] = useState({
    staff_categories: [],
    staff_category_counts: {},
    employment_types: [],
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [discardRunModalOpen, setDiscardRunModalOpen] = useState(false);
  const [discardStaffModalOpen, setDiscardStaffModalOpen] = useState(false);
  const [editingRunId, setEditingRunId] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [selectedRunSnapshot, setSelectedRunSnapshot] = useState(null);
  const [selectedRunRecord, setSelectedRunRecord] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canViewPayroll = hasAnyPermission(currentUser, ["view_payroll"]);
  const canManagePayroll = hasPermission(currentUser, "generate_payroll");
  const canApprovePayroll = hasPermission(currentUser, "approve_payroll");

  const selectedRun = useMemo(
    () =>
      payrollRuns.find((run) => String(run.id) === String(selectedRunId)) ||
      (selectedRunSnapshot && String(selectedRunSnapshot.id) === String(selectedRunId)
        ? selectedRunSnapshot
        : null) ||
      selectedRunRecord ||
      null,
    [payrollRuns, selectedRunId, selectedRunSnapshot, selectedRunRecord]
  );

  const visibleRunStats = useMemo(() => {
    const base = { draft: 0, generated: 0, approved: 0, paid: 0, rejected: 0 };
    payrollRuns.forEach((run) => {
      base[run.status] = (base[run.status] || 0) + 1;
    });
    return base;
  }, [payrollRuns]);

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const payload = await listPayrollRuns(token);
      setPayrollRuns(payload.payroll_runs || []);
      setSummary(payload.summary || {});
      setPayrollMeta(
        payload.meta || {
          staff_categories: [],
          staff_category_counts: {},
          employment_types: [],
        }
      );
      setStaffMembers(payload.staff_members || []);
      if (!selectedRunId && (payload.payroll_runs || []).length > 0) {
        setSelectedRunId(payload.payroll_runs[0].id);
        setSelectedRunSnapshot(payload.payroll_runs[0]);
        setSelectedRunRecord(payload.payroll_runs[0]);
      }
    } catch (err) {
      message.error(err.message || "Could not load payroll data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && canViewPayroll) {
      loadPayrollData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canViewPayroll]);

  useEffect(() => {
    runForm.setFieldsValue({
      month: monthOptions[new Date().getMonth()].value,
      year: new Date().getFullYear(),
      notes: "",
      staff_category: "non_teaching",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    staffForm.setFieldsValue({
      active: true,
      monthly_basic_pay: 0,
      hra: 0,
      conveyance: 0,
      medical: 0,
      integrated_allowance: 0,
      adhoc_allowance: 0,
      dra_allowance: 0,
      teaching_allowance: 0,
      deduction_amount: 0,
      increment_rate: 0,
      employment_type: "regular",
      staff_category: "non_teaching",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeRunModal = () => {
    if (runForm.isFieldsTouched()) {
      setDiscardRunModalOpen(true);
      return;
    }
    setRunModalOpen(false);
    setEditingRunId(null);
    runForm.resetFields();
  };

  const closeStaffModal = () => {
    if (staffForm.isFieldsTouched()) {
      setDiscardStaffModalOpen(true);
      return;
    }
    setStaffModalOpen(false);
    setEditingStaffId(null);
    staffForm.resetFields();
  };

  const resetRunForm = () => {
    setEditingRunId(null);
    runForm.resetFields();
    runForm.setFieldsValue({
      month: monthOptions[new Date().getMonth()].value,
      year: new Date().getFullYear(),
      notes: "",
    });
  };

  const resetStaffForm = () => {
    setEditingStaffId(null);
    staffForm.resetFields();
    staffForm.setFieldsValue({
      active: true,
      monthly_basic_pay: 0,
      hra: 0,
      conveyance: 0,
      medical: 0,
      integrated_allowance: 0,
      adhoc_allowance: 0,
      dra_allowance: 0,
      teaching_allowance: 0,
      deduction_amount: 0,
      increment_rate: 0,
      employment_type: "regular",
      staff_category: "non_teaching",
    });
  };

  const openNewRun = () => {
    resetRunForm();
    setRunModalOpen(true);
  };

  const openEditRun = (record) => {
    setEditingRunId(record.id);
    setSelectedRunId(record.id);
    setSelectedRunSnapshot(record);
    setSelectedRunRecord(record);
    runForm.setFieldsValue({
      month: record.month,
      year: record.year,
      notes: record.notes,
    });
    setRunModalOpen(true);
  };

  const openRunDetails = (record) => {
    setSelectedRunId(record.id);
    setSelectedRunSnapshot(record);
    setSelectedRunRecord(record);
    setDrawerOpen(false);
    setTimeout(() => setDrawerOpen(true), 0);
  };

  const openNewStaff = () => {
    resetStaffForm();
    setStaffModalOpen(true);
  };

  const openEditStaff = (record) => {
    setEditingStaffId(record.id);
    staffForm.setFieldsValue({
      ...record,
      active: Boolean(record.active),
    });
    setStaffModalOpen(true);
  };

  const submitRun = async (values) => {
    setSaving(true);
    try {
      const payload = {
        month: values.month,
        year: values.year,
        notes: values.notes?.trim(),
      };

      if (editingRunId) {
        await updatePayrollRun(token, editingRunId, payload);
        message.success("Payroll cycle updated");
      } else {
        await createPayrollRun(token, payload);
        message.success("Payroll cycle created");
      }

      setRunModalOpen(false);
      setDiscardRunModalOpen(false);
      resetRunForm();
      await loadPayrollData();
    } catch (err) {
      message.error(err.message || "Could not save payroll cycle");
    } finally {
      setSaving(false);
    }
  };

  const submitStaff = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        active: Boolean(values.active),
        staff_category: values.staff_category,
        monthly_basic_pay: values.monthly_basic_pay || 0,
        hra: values.hra || 0,
        conveyance: values.conveyance || 0,
        medical: values.medical || 0,
        integrated_allowance: values.integrated_allowance || 0,
        adhoc_allowance: values.adhoc_allowance || 0,
        dra_allowance: values.dra_allowance || 0,
        teaching_allowance: values.teaching_allowance || 0,
        deduction_amount: values.deduction_amount || 0,
        increment_rate: values.increment_rate || 0,
      };

      if (editingStaffId) {
        await updatePayrollStaff(token, editingStaffId, payload);
        message.success("Payroll staff updated");
      } else {
        await createPayrollStaff(token, payload);
        message.success("Payroll staff created");
      }

      setStaffModalOpen(false);
      setDiscardStaffModalOpen(false);
      resetStaffForm();
      await loadPayrollData();
    } catch (err) {
      message.error(err.message || "Could not save payroll staff");
    } finally {
      setSaving(false);
    }
  };

  const runPayrollAction = async (action, id, note, successMessage = "Payroll updated") => {
    setSaving(true);
    try {
      await action(token, id, note);
      await loadPayrollData();
      message.success(successMessage);
    } catch (err) {
      message.error(err.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const submitPayment = async (values) => {
    if (!selectedItem) {
      return;
    }

    setSaving(true);
    try {
      await updatePayrollRunItem(token, selectedItem.id, {
        payment_status: values.payment_status,
        paid_amount: values.paid_amount,
        payment_date: values.payment_date,
        payment_reference: values.payment_reference?.trim(),
        payment_note: values.payment_note?.trim(),
      });
      message.success("Payment status updated");
      setPaymentModalOpen(false);
      setSelectedItem(null);
      await loadPayrollData();
      setDrawerOpen(true);
    } catch (err) {
      message.error(err.message || "Could not update payment");
    } finally {
      setSaving(false);
    }
  };

  if (!canViewPayroll) {
    return <AccessDenied title="Payroll Management" />;
  }

  const cycleActionItems = (record) => [
    {
      key: "view",
      label: "View details",
      icon: <EyeOutlined />,
      onClick: () => openRunDetails(record),
    },
    {
      key: "edit",
      label: "Edit cycle",
      icon: <EditOutlined />,
      disabled: record.status !== "draft" || !canManagePayroll,
      onClick: () => openEditRun(record),
    },
    {
      key: "generate",
      label: "Generate cycle",
      icon: <DollarOutlined />,
      disabled: record.status !== "draft" || !canManagePayroll,
      onClick: () => runPayrollAction(generatePayrollRun, record.id),
    },
    {
      key: "approve",
      label: "Approve cycle",
      icon: <CheckOutlined />,
      disabled: record.status !== "generated" || !canApprovePayroll,
      onClick: () =>
        Modal.confirm({
          title: "Approve payroll cycle?",
          okText: "Approve",
          centered: true,
          onOk: () => runPayrollAction(approvePayrollRun, record.id, "Approved by HOI"),
        }),
    },
    {
      key: "reject",
      label: "Reject cycle",
      danger: true,
      disabled: !canApprovePayroll || !["draft", "generated"].includes(record.status),
      onClick: () =>
        Modal.confirm({
          title: "Reject payroll cycle?",
          okText: "Reject",
          okButtonProps: { danger: true },
          centered: true,
          onOk: () => runPayrollAction(rejectPayrollRun, record.id, "Rejected by reviewer"),
        }),
    },
    {
      key: "delete",
      label: "Delete cycle",
      danger: true,
      icon: <DeleteOutlined />,
      disabled: record.status !== "draft" || !canManagePayroll,
      onClick: () =>
        Modal.confirm({
          title: "Delete payroll cycle?",
          okText: "Delete",
          okButtonProps: { danger: true },
          centered: true,
          onOk: () => runPayrollAction(deletePayrollRun, record.id),
        }),
    },
  ];

  const staffActionItems = (record) => [
    {
      key: "edit",
      label: "Edit staff",
      icon: <EditOutlined />,
      onClick: () => openEditStaff(record),
    },
    {
      key: "delete",
      label: "Delete",
      danger: true,
      icon: <DeleteOutlined />,
      onClick: () =>
        Modal.confirm({
          title: "Delete payroll staff?",
          okText: "Delete",
          okButtonProps: { danger: true },
          centered: true,
          onOk: async () => {
            await runPayrollAction(deletePayrollStaff, record.id, undefined, "Payroll staff deleted");
          },
        }),
    },
  ];

  const payrollColumns = [
    { title: "Month", dataIndex: "month", key: "month" },
    { title: "Year", dataIndex: "year", key: "year" },
    { title: "Employees", dataIndex: "employee_count", key: "employee_count" },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (value) => money(value),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={runStatusColors[status] || "default"}>{toTitle(status)}</Tag>,
    },
    {
      title: "Generated By",
      dataIndex: "generated_by",
      key: "generated_by",
      render: (value) => value?.username || "—",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{
            items: cycleActionItems(record),
            onClick: ({ key }) => {
              if (key === "view") {
                openRunDetails(record);
              }
            },
          }}
        >
          <Button type="text" icon={<MoreOutlined />} onMouseDown={(event) => event.preventDefault()} />
        </Dropdown>
      ),
    },
  ];

  const staffColumns = [
    {
      title: "Employee",
      key: "employee",
      render: (_, record) => (
        <div className="payroll-cell-stack">
          <Text className="payroll-strong">{record.full_name}</Text>
          <Text type="secondary">{record.personnel_no}</Text>
        </div>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (value) => <span className="payroll-cell-compact">{value}</span>,
    },
    {
      title: "Post",
      dataIndex: "post_description",
      key: "post_description",
    },
    {
      title: "Type",
      dataIndex: "employment_type",
      key: "employment_type",
      render: (value) => <Tag color="blue">{toTitle(value)}</Tag>,
    },
    {
      title: "Category",
      dataIndex: "staff_category",
      key: "staff_category",
      render: (value) => <Tag color="cyan">{toTitle(value)}</Tag>,
    },
    {
      title: "Monthly Pay",
      key: "monthly",
      render: (_, record) => money(record.monthly_basic_pay),
    },
    {
      title: "Net Pay",
      key: "net_pay",
      render: (_, record) => money(record.net_pay),
    },
    {
      title: "Active",
      dataIndex: "active",
      key: "active",
      render: (value) => <Tag color={value ? "green" : "red"}>{value ? "Active" : "Inactive"}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{ items: staffActionItems(record) }}
        >
          <Button type="text" icon={<MoreOutlined />} onMouseDown={(event) => event.preventDefault()} />
        </Dropdown>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: "Staff",
      key: "staff",
      render: (_, record) => (
        <div className="payroll-cell-stack">
          <Text className="payroll-strong">{record.full_name}</Text>
          <Text type="secondary">{record.department}</Text>
          <Text type="secondary">{toTitle(record.staff_category)}</Text>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "staff_category",
      key: "staff_category",
      render: (value) => <Tag color="cyan">{toTitle(value)}</Tag>,
    },
    {
      title: "Net Pay",
      key: "net_pay",
      render: (_, record) => money(record.net_pay),
    },
    {
      title: "Paid Amount",
      key: "paid_amount",
      render: (_, record) => money(record.paid_amount),
    },
    {
      title: "Payment Status",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (value) => <Tag color={paymentStatusColors[value] || "default"}>{toTitle(value)}</Tag>,
    },
    {
      title: "Payment Date",
      dataIndex: "payment_date",
      key: "payment_date",
      render: (value) => value || "—",
    },
    {
      title: "Reference",
      dataIndex: "payment_reference",
      key: "payment_reference",
      render: (value) => value || "—",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            disabled={!canManagePayroll || !["approved", "paid"].includes(selectedRun?.status)}
            onClick={() => {
              setSelectedItem(record);
              paymentForm.setFieldsValue({
                payment_status: record.payment_status || "paid",
                paid_amount: record.paid_amount || record.net_pay,
                payment_date: record.payment_date || new Date().toISOString().slice(0, 10),
                payment_reference: record.payment_reference,
                payment_note: record.payment_note,
              });
              setPaymentModalOpen(true);
            }}
          >
            Record payment
          </Button>
        </Space>
      ),
    },
  ];

  const overviewCards = [
    { label: "Staff Members", value: summary.staff_count ?? staffMembers.length, color: "cyan" },
    { label: "Active Staff", value: summary.active_staff_count ?? staffMembers.filter((item) => item.active).length, color: "green" },
    { label: "Draft Cycles", value: visibleRunStats.draft, color: "default" },
    { label: "Approved Cycles", value: visibleRunStats.approved, color: "blue" },
    { label: "Paid Cycles", value: visibleRunStats.paid, color: "gold" },
    { label: "Total Paid", value: money(summary.total_paid_amount || 0), color: "purple" },
  ];

  const staffCategoryOptions =
    payrollMeta.staff_categories?.length > 0 ? payrollMeta.staff_categories : fallbackStaffCategoryOptions;
  const staffCategoryBreakdown = Object.entries(payrollMeta.staff_category_counts || {}).filter(([, count]) => Number(count) > 0);

  const allowanceTotal = sumValues({
    hra: watchedHra,
    conveyance: watchedConveyance,
    medical: watchedMedical,
    integrated_allowance: watchedIntegratedAllowance,
    adhoc_allowance: watchedAdhocAllowance,
    dra_allowance: watchedDraAllowance,
    teaching_allowance: watchedTeachingAllowance,
  });
  const basicPay = Number(watchedMonthlyBasicPay || 0);
  const deductions = Number(watchedDeductionAmount || 0);
  const grossPay = basicPay + allowanceTotal;
  const netPay = Math.max(grossPay - deductions, 0);

  const overviewTab = (
    <div className="payroll-stack">
      <Row gutter={[14, 14]}>
        {overviewCards.map((card) => (
          <Col xs={12} lg={8} key={card.label}>
            <Card bordered={false} className={`payroll-summary-card payroll-summary-${card.color}`}>
              <Text type="secondary" className="payroll-summary-label">
                {card.label}
              </Text>
              <Title level={3} className="payroll-summary-value">
                {card.value}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="payroll-panel" title="Recent payroll cycles">
        <Table
          loading={loading}
          columns={payrollColumns}
          dataSource={payrollRuns.slice(0, 5)}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 900 }}
        />
      </Card>

      {canManagePayroll ? (
      <Card bordered={false} className="payroll-panel" title="Recent staff records">
          <Table
            loading={loading}
            columns={staffColumns}
            dataSource={staffMembers.slice(0, 5)}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 1100 }}
          />
        </Card>
      ) : null}
    </div>
  );

  const runsTab = (
    <Card bordered={false} className="payroll-panel">
      <div className="payroll-toolbar">
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Payroll cycles</Title>
          <Text type="secondary">Generate, approve, and mark monthly payroll payments.</Text>
        </div>
        <Space wrap>
          {canManagePayroll ? (
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openNewRun}>
              New payroll cycle
            </Button>
          ) : null}
        </Space>
      </div>

      <Table
        className="payroll-table"
        loading={loading}
        columns={payrollColumns}
        dataSource={payrollRuns}
        rowKey="id"
        size="small"
        scroll={{ x: 900 }}
        pagination={{ pageSize: 8, size: "small" }}
      />
    </Card>
  );

  const staffTab = (
    <Card bordered={false} className="payroll-panel">
      <div className="payroll-toolbar">
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Staff master</Title>
          <Text type="secondary">Maintain employee records, allowances, deductions, and bank details.</Text>
        </div>
        {canManagePayroll ? (
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openNewStaff}>
            Add staff
          </Button>
        ) : null}
      </div>

      {staffCategoryBreakdown.length > 0 ? (
        <Row gutter={[10, 10]} style={{ marginBottom: 12 }}>
          {staffCategoryBreakdown.map(([category, count]) => (
            <Col key={category}>
              <Tag color="cyan">{`${toTitle(category)}: ${count}`}</Tag>
            </Col>
          ))}
        </Row>
      ) : null}

      <Table
        className="payroll-table"
        loading={loading}
        columns={staffColumns}
        dataSource={staffMembers}
        rowKey="id"
        size="small"
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 8, size: "small" }}
        locale={{
          emptyText: <Empty description="No payroll staff yet" />,
        }}
      />
    </Card>
  );

  const payrollTabs = [
    { key: "overview", label: "Overview", children: overviewTab },
    { key: "runs", label: "Payroll Cycles", children: runsTab },
    ...(canManagePayroll ? [{ key: "staff", label: "Staff Master", children: staffTab }] : []),
  ];

  return (
    <div className="payroll-page">
      <div className="payroll-hero">
        <div>
          <Text type="secondary" className="page-kicker">
            PAYROLL MANAGEMENT
          </Text>
          <div className="payroll-title-row">
            <Title level={2} className="page-title">
              Payroll
            </Title>
            <Tag color="green" className="status-tag">
              Live
            </Tag>
          </div>
          <Text className="page-subtitle">
            Accountant maintains staff pay, HOI approves cycles, and payments are tracked month by month.
          </Text>
        </div>
        <Space wrap>
          {canManagePayroll ? (
            <Button type="primary" size="small" className="payroll-action-button" icon={<PlusOutlined />} onClick={openNewStaff}>
              Add staff
            </Button>
          ) : null}
          {canManagePayroll ? (
            <Button type="primary" size="small" className="payroll-action-button" icon={<DollarOutlined />} onClick={openNewRun}>
              New payroll cycle
            </Button>
          ) : null}
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={payrollTabs} className="payroll-tabs" />

      <Drawer
        open={drawerOpen}
        width={960}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedRunSnapshot(null);
          setSelectedRunRecord(null);
        }}
        title={selectedRun ? `${selectedRun.month} ${selectedRun.year} payroll cycle` : "Payroll details"}
        className="payroll-drawer"
        extra={
          selectedRun ? <Tag color={runStatusColors[selectedRun.status] || "default"}>{toTitle(selectedRun.status)}</Tag> : null
        }
      >
        {selectedRun ? (
          <div className="payroll-drawer-body">
            <Descriptions size="small" bordered column={3} className="payroll-descriptions">
              <Descriptions.Item label="Employees">{selectedRun.employee_count}</Descriptions.Item>
              <Descriptions.Item label="Total amount">{money(selectedRun.total_amount)}</Descriptions.Item>
              <Descriptions.Item label="Approved by">{selectedRun.approved_by?.username || "—"}</Descriptions.Item>
              <Descriptions.Item label="Generated by">{selectedRun.generated_by?.username || "—"}</Descriptions.Item>
              <Descriptions.Item label="Rejected by">{selectedRun.rejected_by?.username || "—"}</Descriptions.Item>
              <Descriptions.Item label="Notes">{selectedRun.notes || "—"}</Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "16px 0" }} />

            <Table
              className="payroll-table"
              columns={paymentColumns}
              dataSource={selectedRun.items || []}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 1100 }}
              locale={{
                emptyText: <Empty description="No payroll items generated yet" />,
              }}
            />

            <Divider />

            <div className="payroll-audit">
              <Title level={5} style={{ marginBottom: 8 }}>Audit trail</Title>
              {(selectedRun.audit_entries || []).length > 0 ? (
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  {(selectedRun.audit_entries || []).map((entry, index) => (
                    <Card key={`${entry.at}-${index}`} size="small" className="payroll-audit-card">
                      <Text className="payroll-strong">{toTitle(entry.action)}</Text>
                      <div className="payroll-muted">
                        {entry.by} · {entry.role} · {entry.at}
                      </div>
                      {entry.note ? <div className="payroll-muted">{entry.note}</div> : null}
                    </Card>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No audit events recorded yet.</Text>
              )}
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal open={runModalOpen} title={editingRunId ? "Edit payroll cycle" : "New payroll cycle"} onCancel={closeRunModal} footer={null} destroyOnClose>
        <Form form={runForm} layout="vertical" onFinish={submitRun}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Month" name="month" rules={[{ required: true, message: "Select a month" }]}>
                <Select options={monthOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Year" name="year" rules={[{ required: true, message: "Enter year" }]}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Internal notes" name="notes">
            <TextArea rows={4} placeholder="Internal remarks for this payroll cycle" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editingRunId ? "Update" : "Create"}
            </Button>
            <Button onClick={closeRunModal} disabled={saving}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal open={staffModalOpen} title={editingStaffId ? "Edit staff record" : "Add payroll staff"} onCancel={closeStaffModal} footer={null} width={1040} destroyOnClose>
        <Form form={staffForm} layout="vertical" onFinish={submitStaff}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Full name" name="full_name" rules={[{ required: true, message: "Enter staff name" }]}>
                <Input placeholder="Employee name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Father name" name="father_name">
                <Input placeholder="Father name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="CNIC" name="cnic" rules={[{ required: true, message: "Enter CNIC" }]}>
                <Input placeholder="35202-1234567-1" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Personnel no." name="personnel_no" rules={[{ required: true, message: "Enter personnel number" }]}>
                <Input placeholder="PR-001" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Post description" name="post_description" rules={[{ required: true, message: "Enter post description" }]}>
                <Input placeholder="Senior Clerk" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Department" name="department" rules={[{ required: true, message: "Enter department" }]}>
                <Input placeholder="Finance" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Employment type" name="employment_type" rules={[{ required: true }]}>
                <Select options={employmentTypeOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Staff category" name="staff_category" rules={[{ required: true, message: "Select staff category" }]}>
                <Select options={staffCategoryOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="BPS" name="bps">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Gender" name="gender">
                <Select
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Contact number" name="contact_number">
                <Input placeholder="+92..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Email" name="email">
                <Input placeholder="staff@college.edu.pk" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Bank name" name="bank_name">
                <Input placeholder="Bank name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Account number" name="account_number">
                <Input placeholder="Account / IBAN" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Next increment date" name="next_increment_date">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Increment rate" name="increment_rate">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Pay structure</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Monthly basic pay" name="monthly_basic_pay" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="HRA" name="hra">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Conveyance" name="conveyance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Medical" name="medical">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Integrated allowance" name="integrated_allowance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Adhoc allowance" name="adhoc_allowance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="DRA allowance" name="dra_allowance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Teaching allowance" name="teaching_allowance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Deduction amount" name="deduction_amount">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Active" name="active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Internal payroll notes" />
          </Form.Item>

          <Card bordered={false} className="payroll-preview-card">
            <Title level={5} style={{ marginBottom: 12 }}>Pay preview</Title>
            <Row gutter={12}>
              <Col xs={24} md={6}>
                <div className="payroll-preview-tile">
                  <Text type="secondary">Basic</Text>
                  <div className="payroll-preview-value">{money(basicPay)}</div>
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div className="payroll-preview-tile">
                  <Text type="secondary">Allowances</Text>
                  <div className="payroll-preview-value">{money(allowanceTotal)}</div>
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div className="payroll-preview-tile">
                  <Text type="secondary">Deductions</Text>
                  <div className="payroll-preview-value">{money(deductions)}</div>
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div className="payroll-preview-tile">
                  <Text type="secondary">Net pay</Text>
                  <div className="payroll-preview-value">{money(netPay)}</div>
                </div>
              </Col>
            </Row>
          </Card>

          <Space className="payroll-modal-actions">
            <Button type="primary" htmlType="submit" loading={saving}>
              {editingStaffId ? "Update staff" : "Save staff"}
            </Button>
            <Button onClick={closeStaffModal} disabled={saving}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal open={paymentModalOpen} title="Update payment status" onCancel={() => setPaymentModalOpen(false)} footer={null} destroyOnClose>
        <Form form={paymentForm} layout="vertical" onFinish={submitPayment}>
          <Form.Item label="Payment status" name="payment_status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "pending", label: "Pending" },
                { value: "partial", label: "Partial" },
                { value: "paid", label: "Paid" },
                { value: "hold", label: "Hold" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Paid amount" name="paid_amount" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Payment date" name="payment_date" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Reference" name="payment_reference">
                <Input placeholder="Transaction reference" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Note" name="payment_note">
            <TextArea rows={3} placeholder="Optional note" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save payment
            </Button>
            <Button onClick={() => setPaymentModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        open={discardRunModalOpen}
        title="Discard changes?"
        onCancel={() => setDiscardRunModalOpen(false)}
        footer={[
          <Button key="keep" onClick={() => setDiscardRunModalOpen(false)}>
            Keep editing
          </Button>,
          <Button
            key="discard"
            danger
            type="primary"
            onClick={() => {
              setDiscardRunModalOpen(false);
              setRunModalOpen(false);
              resetRunForm();
            }}
          >
            Discard
          </Button>,
        ]}
      >
        <Text type="secondary">Unsaved payroll cycle changes will be lost.</Text>
      </Modal>

      <Modal
        open={discardStaffModalOpen}
        title="Discard changes?"
        onCancel={() => setDiscardStaffModalOpen(false)}
        footer={[
          <Button key="keep" onClick={() => setDiscardStaffModalOpen(false)}>
            Keep editing
          </Button>,
          <Button
            key="discard"
            danger
            type="primary"
            onClick={() => {
              setDiscardStaffModalOpen(false);
              setStaffModalOpen(false);
              resetStaffForm();
            }}
          >
            Discard
          </Button>,
        ]}
      >
        <Text type="secondary">Unsaved staff changes will be lost.</Text>
      </Modal>
    </div>
  );
};

export default Payroll;

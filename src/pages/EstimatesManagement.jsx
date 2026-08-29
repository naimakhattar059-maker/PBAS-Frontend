import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CalculatorOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import AccessDenied from "../components/AccessDenied";
import { hasAnyPermission, hasPermission } from "../utils/permissions";
import {
  createPayrollEstimate,
  deletePayrollEstimate,
  listPayrollEstimates,
} from "../api/payrollEstimates";
import { calculatePayrollEstimate, money } from "../utils/payrollEstimates";
import "./EstimatesManagement.css";

const { Title, Text } = Typography;
const currentYear = new Date().getFullYear();

const EstimatesManagement = () => {
  const [form] = Form.useForm();
  const { token, user } = useSelector((state) => state.auth);
  const canViewPayroll = hasAnyPermission(user, ["view_payroll"]);
  const canManagePayroll = hasPermission(user, "generate_payroll");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estimates, setEstimates] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [summary, setSummary] = useState({});
  const [filterYear, setFilterYear] = useState(currentYear);

  const watchedStaffId = Form.useWatch("payroll_staff_id", form);
  const watchedYear = Form.useWatch("year", form) || currentYear;

  const loadEstimates = async (year = filterYear) => {
    if (!token || !canViewPayroll) return;

    setLoading(true);
    try {
      const payload = await listPayrollEstimates(token, year);
      setEstimates(payload.payroll_estimates || []);
      setStaffMembers(payload.staff_members || []);
      setSummary(payload.summary || {});
    } catch (err) {
      message.error(err.message || "Failed to load payroll estimates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({ year: currentYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadEstimates(filterYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canViewPayroll, filterYear]);

  const selectedStaff = useMemo(
    () => staffMembers.find((staff) => String(staff.id) === String(watchedStaffId)) || null,
    [staffMembers, watchedStaffId]
  );

  const estimatePreview = useMemo(
    () => calculatePayrollEstimate(selectedStaff, watchedYear),
    [selectedStaff, watchedYear]
  );

  const staffOptions = staffMembers
    .filter((staff) => staff.active)
    .map((staff) => ({
      value: staff.id,
      label: String(staff.full_name || "Staff") + " - BPS " + String(staff.bps || "N/A") + " - " + String(staff.post_description || "Staff"),
      searchText: [staff.full_name, staff.bps, staff.post_description, staff.department].filter(Boolean).join(" "),
    }));

  const yearOptions = Array.from(
    new Set([currentYear, ...estimates.map((estimate) => Number(estimate.year)).filter(Boolean), ...Object.keys(summary).map(Number)])
  )
    .sort((a, b) => b - a)
    .map((year) => ({ value: year, label: String(year) }));

  const selectedYearTotal = estimates.reduce(
    (sum, estimate) => sum + Number(estimate.total_estimated_salary || 0),
    0
  );
  const highestEstimate = estimates.reduce(
    (max, estimate) => Math.max(max, Number(estimate.total_estimated_salary || 0)),
    0
  );

  const saveEstimate = async () => {
    if (!canManagePayroll) return;

    try {
      const values = await form.validateFields();
      setSaving(true);
      await createPayrollEstimate(token, {
        payroll_staff_id: values.payroll_staff_id,
        year: values.year,
        notes: values.notes || "",
      });
      message.success("Payroll estimate saved");
      form.setFieldsValue({ payroll_staff_id: undefined, notes: "", year: values.year });
      setFilterYear(values.year);
      await loadEstimates(values.year);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.message || "Could not save payroll estimate");
    } finally {
      setSaving(false);
    }
  };

  const removeEstimate = async (record) => {
    setSaving(true);
    try {
      await deletePayrollEstimate(token, record.id);
      message.success("Payroll estimate deleted");
      await loadEstimates(filterYear);
    } catch (err) {
      message.error(err.message || "Could not delete payroll estimate");
    } finally {
      setSaving(false);
    }
  };

  if (!canViewPayroll) {
    return <AccessDenied title="Payroll access required" />;
  }

  const columns = [
    {
      title: "Staff",
      key: "staff",
      render: (_, record) => (
        <div className="estimate-cell-stack">
          <Text strong>{record.full_name}</Text>
          <Text type="secondary">{record.personnel_no || "No personnel no"} - BPS {record.bps || "N/A"}</Text>
          <Text type="secondary">{record.post_description || "Staff"}</Text>
        </div>
      ),
    },
    { title: "Year", dataIndex: "year", key: "year", width: 90 },
    { title: "Basic Pay", dataIndex: "basic_pay", key: "basic_pay", render: money },
    { title: "First 4 Months", dataIndex: "first_four_months", key: "first_four_months", render: money },
    { title: "Next 8 Months", dataIndex: "next_eight_months", key: "next_eight_months", render: money },
    {
      title: "Increment",
      key: "increment",
      render: (_, record) => (
        <div className="estimate-cell-stack">
          <Text>{money(record.increment_six_months)}</Text>
          <Text type="secondary">{money(record.increment_rate)} x 6</Text>
          <Text type="secondary">{record.increment_date || "Date not set"}</Text>
        </div>
      ),
    },
    { title: "Total Estimate", dataIndex: "total_estimated_salary", key: "total_estimated_salary", render: money },
    {
      title: "Status",
      key: "status",
      render: () => <Tag color="blue">Saved</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        canManagePayroll ? (
          <Popconfirm title="Delete this payroll estimate?" onConfirm={() => removeEstimate(record)}>
            <Button size="small" danger icon={<DeleteOutlined />} loading={saving}>
              Delete
            </Button>
          </Popconfirm>
        ) : (
          <Tag color="default">View only</Tag>
        ),
    },
  ];

  return (
    <div className="estimates-page">
      <div className="estimates-hero">
        <div>
          <Text type="secondary" className="page-kicker">ESTIMATES MANAGEMENT</Text>
          <Title level={2} className="page-title">Payroll Estimates</Title>
          <Text type="secondary">
            Payroll staff data is fetched from Staff Master and saved here as estimated payroll budget.
          </Text>
        </div>
        <Space wrap>
          <Select value={filterYear} onChange={setFilterYear} options={yearOptions} style={{ width: 130 }} />
          <Button icon={<ReloadOutlined />} onClick={() => loadEstimates(filterYear)} loading={loading}>
            Refresh
          </Button>
        </Space>
      </div>

      <Row gutter={[14, 14]}>
        <Col xs={12} lg={6}>
          <Card bordered={false} className="estimate-summary-card estimate-summary-blue">
            <Text type="secondary">Selected Year Total</Text>
            <Title level={3}>{money(selectedYearTotal || summary[filterYear] || 0)}</Title>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} className="estimate-summary-card estimate-summary-green">
            <Text type="secondary">Saved Estimates</Text>
            <Title level={3}>{estimates.length}</Title>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} className="estimate-summary-card estimate-summary-gold">
            <Text type="secondary">Available Staff</Text>
            <Title level={3}>{staffMembers.length}</Title>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} className="estimate-summary-card estimate-summary-purple">
            <Text type="secondary">Highest Estimate</Text>
            <Title level={3}>{money(highestEstimate)}</Title>
          </Card>
        </Col>
      </Row>

      {canManagePayroll ? (
        <Card bordered={false} className="estimate-panel estimate-entry-panel">
          <div className="estimate-toolbar">
            <div>
              <Title level={4}>Create payroll estimate</Title>
              <Text type="secondary">Select staff once; basic pay and yearly increment are calculated automatically.</Text>
            </div>
            <Button type="primary" icon={<SaveOutlined />} onClick={saveEstimate} loading={saving} disabled={!selectedStaff}>
              Save Estimate
            </Button>
          </div>

          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} lg={14}>
                <Form.Item label="Staff member" name="payroll_staff_id" rules={[{ required: true, message: "Select staff member" }]}>
                  <Select
                    showSearch
                    allowClear
                    placeholder="Search by name, BPS, post, or department"
                    optionFilterProp="searchText"
                    options={staffOptions}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8} lg={4}>
                <Form.Item label="Estimate year" name="year" rules={[{ required: true, message: "Enter year" }]}>
                  <InputNumber min={2000} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={16} lg={6}>
                <Form.Item label="Notes" name="notes">
                  <Input placeholder="Optional notes" />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={6}>
              <div className="estimate-preview-tile">
                <Text type="secondary">Basic pay x 4 months</Text>
                <div>{money(estimatePreview.firstFourMonths)}</div>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div className="estimate-preview-tile">
                <Text type="secondary">Basic pay x next 8 months</Text>
                <div>{money(estimatePreview.nextEightMonths)}</div>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div className="estimate-preview-tile">
                <Text type="secondary">Increment x 6 months</Text>
                <div>{money(estimatePreview.incrementSixMonths)}</div>
                <Text type="secondary">{estimatePreview.incrementDate || "Increment date not set"}</Text>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div className="estimate-preview-tile estimate-preview-total">
                <Text type="secondary">Total estimated salary</Text>
                <div><CalculatorOutlined /> {money(estimatePreview.totalEstimatedSalary)}</div>
              </div>
            </Col>
          </Row>
        </Card>
      ) : null}

      <Card bordered={false} className="estimate-panel" title="Saved payroll estimates">
        <Table
          className="estimate-table"
          loading={loading}
          columns={columns}
          dataSource={estimates}
          rowKey="id"
          size="small"
          scroll={{ x: 1180 }}
          pagination={{ pageSize: 8, size: "small" }}
          locale={{ emptyText: <Empty description="No payroll estimates saved for this year" /> }}
        />
      </Card>
    </div>
  );
};

export default EstimatesManagement;

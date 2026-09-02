import { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, DatePicker, Progress, Row, Segmented, Select, Space, Table, Tag, Typography, message } from "antd";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import AccessDenied from "../components/AccessDenied";
import { hasPermission } from "../utils/permissions";
import { fetchReports } from "../api/reports";
import "./Dashboard.css";
import "./Reports.css";

const { Title, Text } = Typography;

const periodOptions = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const reportTypeOptions = [
  { label: "All reports", value: "all" },
  { label: "Requests", value: "requests" },
  { label: "Payroll", value: "payroll" },
  { label: "Budgets", value: "budgets" },
  { label: "Notifications", value: "notifications" },
];

const periodPickerMap = {
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

const periodFormatMap = {
  weekly: "[Week of] DD MMM YYYY",
  monthly: "MMMM YYYY",
  yearly: "YYYY",
};

const asNumber = (value) => Number(value || 0);
const sumSeries = (items = []) => items.reduce((sum, item) => sum + asNumber(item.value), 0);
const makeRows = (items = [], source) =>
  items.map((item, index) => ({
    key: `${source}-${item.name}-${index}`,
    source,
    metric: item.name,
    value: asNumber(item.value),
  }));

const downloadCsv = (filename, rows) => {
  const header = ["Module", "Metric", "Value"];
  const body = rows.map((row) => [row.source, row.metric, row.value]);
  const csv = [header, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const Reports = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [reportType, setReportType] = useState("all");
  const canViewReports = hasPermission(user, "view_reports");

  const loadReports = async () => {
    setLoading(true);
    try {
      const payload = await fetchReports(token);
      setData(payload);
    } catch (err) {
      message.error(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && canViewReports) {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canViewReports]);

  const requestColumns = useMemo(
    () => [
      { title: "Title", dataIndex: "title", key: "title" },
      { title: "Subtitle", dataIndex: "subtitle", key: "subtitle" },
      { title: "Status", dataIndex: "status", key: "status", render: (value) => <Tag>{value}</Tag> },
      { title: "Path", dataIndex: "path", key: "path" },
    ],
    []
  );

  const payrollColumns = useMemo(
    () => [
      { title: "Title", dataIndex: "title", key: "title" },
      { title: "Subtitle", dataIndex: "subtitle", key: "subtitle" },
      { title: "Status", dataIndex: "status", key: "status", render: (value) => <Tag>{value}</Tag> },
      { title: "Path", dataIndex: "path", key: "path" },
    ],
    []
  );

  const notificationColumns = useMemo(
    () => [
      { title: "Title", dataIndex: "title", key: "title" },
      { title: "Body", dataIndex: "subtitle", key: "subtitle" },
      { title: "Status", dataIndex: "status", key: "status", render: (value) => <Tag color={value === "read" ? "green" : "orange"}>{value}</Tag> },
      { title: "Path", dataIndex: "path", key: "path" },
    ],
    []
  );

  const reportRows = useMemo(() => {
    const rows = [
      ...makeRows(data?.request_statuses || [], "Requests"),
      ...makeRows(data?.payroll_statuses || [], "Payroll"),
      ...makeRows(data?.budget_types || [], "Budgets"),
      ...makeRows(data?.notification_statuses || [], "Notifications"),
    ];

    if (reportType === "all") {
      return rows;
    }

    return rows.filter((row) => row.source.toLowerCase() === reportType);
  }, [data, reportType]);

  const chartSeries = useMemo(
    () => [
      { label: "Requests", value: sumSeries(data?.request_statuses), color: "blue" },
      { label: "Payroll", value: sumSeries(data?.payroll_statuses), color: "green" },
      { label: "Budgets", value: sumSeries(data?.budget_types), color: "purple" },
      { label: "Notifications", value: asNumber(data?.notification_summary?.total || data?.overview?.notifications), color: "orange" },
    ],
    [data]
  );

  const maxChartValue = Math.max(...chartSeries.map((item) => item.value), 1);
  const periodLabel = selectedDate ? selectedDate.format(periodFormatMap[period]) : "Current period";

  const generatedColumns = useMemo(
    () => [
      { title: "Module", dataIndex: "source", key: "source" },
      { title: "Metric", dataIndex: "metric", key: "metric", render: (value) => <Tag>{value}</Tag> },
      { title: "Value", dataIndex: "value", key: "value", align: "right" },
    ],
    []
  );

  if (!canViewReports) {
    return <AccessDenied title="Reports" />;
  }

  const overview = data?.overview || {};
  const budgetStructure = data?.budget_structure || {};
  const notificationSummary = data?.notification_summary || {};

  return (
    <div className="dashboard-page reports-page">
      <div className="dashboard-shell reports-shell">
        <div className="dashboard-hero reports-hero">
          <div>
            <Text className="eyebrow">Reports</Text>
            <div className="title-row">
              <Title level={2}>Live analytics</Title>
              <Tag color="blue">Real data</Tag>
            </div>
            <Text className="subtitle">Generate weekly, monthly, and yearly reports from live budget, request, payroll, and notification data.</Text>
          </div>
          <Space wrap className="report-controls">
            <Segmented options={periodOptions} value={period} onChange={setPeriod} />
            <DatePicker
              picker={periodPickerMap[period]}
              value={selectedDate}
              onChange={(value) => setSelectedDate(value || dayjs())}
              allowClear={false}
            />
            <Select value={reportType} onChange={setReportType} options={reportTypeOptions} style={{ width: 150 }} />
            <Button className="reports-soft-button" icon={<ReloadOutlined />} onClick={loadReports} loading={loading}>
              Refresh
            </Button>
            <Button className="reports-action-button" icon={<DownloadOutlined />} onClick={() => downloadCsv(`reports-${period}-${selectedDate.format("YYYY-MM-DD")}.csv`, reportRows)}>
              Export
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} className="stat-row">
          {[
            ["Users", overview.users],
            ["Budgets", overview.budgets],
            ["Requests", overview.requests],
            ["Payrolls", overview.payrolls],
            ["Unread notifications", notificationSummary.unread],
            ["Budget heads", budgetStructure.budget_heads],
          ].map(([label, value], index) => (
            <Col xs={24} sm={12} lg={8} key={label}>
              <Card className={`stat-card reports-stat-card reports-stat-${index % 4}`} loading={loading} bordered={false}>
                <Text className="stat-label">{label}</Text>
                <div className="stat-value">{value ?? (loading ? "…" : "—")}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={10}>
          <Card className="panel-card" title={`${periodLabel} chart view`} loading={loading}>
            <div className="report-chart">
              {chartSeries.map((item) => (
                <div className="report-chart-row" key={item.label}>
                  <div className="report-chart-label">
                    <Text>{item.label}</Text>
                    <Text strong>{item.value}</Text>
                  </div>
                  <div className="report-chart-track">
                    <div className={`report-chart-fill report-chart-${item.color}`} style={{ width: `${Math.max((item.value / maxChartValue) * 100, item.value ? 8 : 0)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card className="panel-card" title={`${periodLabel} generated report`} loading={loading}>
            <Table
              size="small"
              columns={generatedColumns}
              dataSource={reportRows}
              rowKey="key"
              pagination={reportRows.length > 8 ? { pageSize: 8, showSizeChanger: false } : false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card className="panel-card" title="Workflow requests" loading={loading}>
            <Table
              size="small"
              columns={requestColumns}
              dataSource={data?.recent_requests || []}
              rowKey={(row, index) => `${row.title}-${index}`}
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card className="panel-card" title="Status breakdown" loading={loading}>
            <Space direction="vertical" style={{ width: "100%" }} size={16}>
              <div>
                <Text type="secondary">Requests</Text>
                <div style={{ marginTop: 8 }}>
                  {(data?.request_statuses || []).map((item) => (
                    <Tag key={item.name} color="blue">
                      {item.name}: {item.value}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <Text type="secondary">Payrolls</Text>
                <div style={{ marginTop: 8 }}>
                  {(data?.payroll_statuses || []).map((item) => (
                    <Tag key={item.name} color="green">
                      {item.name}: {item.value}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <Text type="secondary">Budget types</Text>
                <div style={{ marginTop: 8 }}>
                  {(data?.budget_types || []).map((item) => (
                    <Tag key={item.name} color="purple">
                      {item.name}: {item.value}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <Text type="secondary">Budget structure</Text>
                <Progress percent={budgetStructure.budget_heads ? Math.round((budgetStructure.active_heads / budgetStructure.budget_heads) * 100) : 0} />
                <Text type="secondary">
                  {budgetStructure.active_heads || 0} of {budgetStructure.budget_heads || 0} heads active
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={12}>
          <Card className="panel-card" title="Payroll records" loading={loading}>
            <Table
              size="small"
              columns={payrollColumns}
              dataSource={data?.recent_payrolls || []}
              rowKey={(row, index) => `${row.title}-${index}`}
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="panel-card" title="Notifications" loading={loading}>
            <Table
              size="small"
              columns={notificationColumns}
              dataSource={data?.recent_notifications || []}
              rowKey={(row, index) => `${row.title}-${index}`}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;

import { useEffect, useMemo, useState } from "react";
import { Card, Col, Progress, Row, Space, Table, Tag, Typography, message } from "antd";
import { useSelector } from "react-redux";
import AccessDenied from "../components/AccessDenied";
import { hasPermission } from "../utils/permissions";
import { fetchReports } from "../api/reports";
import "./Dashboard.css";

const { Title, Text } = Typography;

const Reports = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const canViewReports = hasPermission(user, "view_reports");

  useEffect(() => {
    if (!token || !canViewReports) return;

    const load = async () => {
      try {
        const payload = await fetchReports(token);
        setData(payload);
      } catch (err) {
        message.error(err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    load();
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

  if (!canViewReports) {
    return <AccessDenied title="Reports" />;
  }

  const overview = data?.overview || {};
  const budgetStructure = data?.budget_structure || {};
  const notificationSummary = data?.notification_summary || {};

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-hero">
          <div>
            <Text className="eyebrow">Reports</Text>
            <div className="title-row">
              <Title level={2}>Live analytics</Title>
              <Tag color="blue">Real data</Tag>
            </div>
            <Text className="subtitle">Budget, request, payroll, and notification summaries pulled from the database.</Text>
          </div>
        </div>

        <Row gutter={[16, 16]} className="stat-row">
          {[
            ["Users", overview.users],
            ["Budgets", overview.budgets],
            ["Requests", overview.requests],
            ["Payrolls", overview.payrolls],
            ["Unread notifications", notificationSummary.unread],
            ["Budget heads", budgetStructure.budget_heads],
          ].map(([label, value]) => (
            <Col xs={24} sm={12} lg={8} key={label}>
              <Card className="stat-card" loading={loading} bordered={false}>
                <Text className="stat-label">{label}</Text>
                <div className="stat-value">{value ?? (loading ? "…" : "—")}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

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

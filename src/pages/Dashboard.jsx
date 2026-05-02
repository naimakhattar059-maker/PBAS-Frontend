import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Col,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  Button,
  message,
} from "antd";
import { useSelector } from "react-redux";
import { fetchDashboard } from "../api/dashboard";
import "./Dashboard.css";

const { Title, Text } = Typography;

const statusTag = (status) => {
  const colors = {
    read: "green",
    unread: "orange",
    approved: "green",
    rejected: "red",
    generated: "blue",
    verified: "cyan",
    submitted: "gold",
    draft: "default",
  };

  return <Tag color={colors[status] || "blue"}>{status}</Tag>;
};

const Dashboard = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const payload = await fetchDashboard(token);
        setData(payload);
      } catch (err) {
        message.error(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const activityColumns = useMemo(
    () => [
      { title: "Title", dataIndex: "title", key: "title" },
      { title: "Subtitle", dataIndex: "subtitle", key: "subtitle" },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => statusTag(status),
      },
    ],
    []
  );

  const quickActions = data?.quick_actions || [];
  const formatValue = (key, value) => {
    if (value == null) return "—";
    if (key === "budget_available" || key === "expense_this_month") {
      return value;
    }
    return value;
  };

  const liveSignals = useMemo(() => {
    const requestStatuses = data?.charts?.request_statuses || [];
    const payrollStatuses = data?.charts?.payroll_statuses || [];
    const budgetTypes = data?.charts?.budget_types || [];
    const mostCommon = (items) =>
      items.reduce(
        (best, item) => (!best || item.value > best.value ? item : best),
        null
      );

    const topRequest = mostCommon(requestStatuses);
    const topPayroll = mostCommon(payrollStatuses);
    const topBudgetType = mostCommon(budgetTypes);

    return [
      topRequest
        ? {
            label: "Top request status",
            value: `${topRequest.name}: ${topRequest.value}`,
            tone: "blue",
          }
        : null,
      topPayroll
        ? {
            label: "Top payroll status",
            value: `${topPayroll.name}: ${topPayroll.value}`,
            tone: "violet",
          }
        : null,
      topBudgetType
        ? {
            label: "Budget mix",
            value: `${topBudgetType.name}: ${topBudgetType.value}`,
            tone: "amber",
          }
        : null,
      {
        label: "Unread notifications",
        value: `${data?.system_health?.unread_notifications ?? 0}`,
        tone: "mint",
      },
    ].filter(Boolean);
  }, [data]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-hero">
          <div>
            <Text className="eyebrow">Dashboard</Text>
            <div className="title-row">
              <Title level={2}>Overview</Title>
              <Tag color="green">Live</Tag>
            </div>
            <Text className="subtitle">
              Hi {user?.username || "there"}, here’s the current snapshot of your institution.
            </Text>
          </div>
        </div>

        <Row gutter={[18, 18]} className="stat-row">
      {[
            { key: "users", label: "Users", accent: "aqua" },
            { key: "pending_approvals", label: "Pending Approvals", accent: "violet" },
            { key: "budget_available", label: "Budget Available", accent: "amber" },
            { key: "expense_this_month", label: "Expense This Month", accent: "mint" },
          ].map(({ key, label, accent }) => (
            <Col xs={24} sm={12} lg={6} key={key}>
              <Card className={`stat-card stat-card-${accent}`} loading={loading} bordered={false}>
                <Text className="stat-label">{label}</Text>
                <div className="stat-value">
                  {formatValue(key, data?.totals?.[key] || (loading ? "…" : "—"))}
                </div>
                <Text type="secondary">Updated just now</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={16}>
          <Card className="panel-card panel-card-wide" title="Recent Activities" loading={loading}>
            <Table
              size="small"
              columns={activityColumns}
              dataSource={data?.recent_activities || []}
              rowKey={(row, idx) => `${row.title}-${idx}`}
              pagination={false}
            />
          </Card>
          <Row gutter={[18, 18]}>
            <Col xs={24} md={12}>
              <Card className="panel-card panel-card-tight" title="Live signals" loading={loading}>
                <div className="signals-list">
                  {liveSignals.map((signal) => (
                    <div className={`signal-card signal-${signal.tone}`} key={signal.label}>
                      <div className="signal-row">
                        <span className="signal-dot" />
                        <div>
                          <Text className="signal-label">{signal.label}</Text>
                          <div className="signal-value">{signal.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card className="panel-card panel-card-tight" title="Quick actions" loading={loading}>
                <Space wrap size={8} className="quick-actions">
                  {(quickActions.length ? quickActions : [{ label: "New user" }, { label: "Export report" }]).map(
                    (action) => (
                      <Button key={action.label} type="primary" ghost>
                        {action.label}
                      </Button>
                    )
                  )}
                </Space>
              </Card>
            </Col>
          </Row>
        </Col>

        <Col xs={24} xl={8}>
          <Card className="panel-card panel-card-stretch" title="Activity mix" loading={loading}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <div>
                <Text type="secondary">Request statuses</Text>
                <div style={{ marginTop: 8 }}>
                  {(data?.charts?.request_statuses || []).map((item) => (
                    <Tag key={item.name} color="blue">
                      {item.name}: {item.value}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <Text type="secondary">Payroll statuses</Text>
                <div style={{ marginTop: 8 }}>
                  {(data?.charts?.payroll_statuses || []).map((item) => (
                    <Tag key={item.name} color="green">
                      {item.name}: {item.value}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <Text type="secondary">Budget types</Text>
                <div style={{ marginTop: 8 }}>
                  {(data?.charts?.budget_types || []).map((item) => (
                    <Tag key={item.name} color="purple">
                      {item.name}: {item.value}
                    </Tag>
                  ))}
                </div>
              </div>
            </Space>
          </Card>

          <Card className="panel-card panel-card-stretch" title="System health" loading={loading}>
            <div className="health-grid">
              <div>
                <Text type="secondary">API uptime</Text>
                <div className="health-value">{data?.system_health?.api_uptime || "99.9%"}</div>
              </div>
              <div>
                <Text type="secondary">Avg response</Text>
                <div className="health-value">
                  {data?.system_health?.avg_response_time_ms
                    ? `${data.system_health.avg_response_time_ms} ms`
                    : "240 ms"}
                </div>
              </div>
              <div>
                <Text type="secondary">Unread notifications</Text>
                <div className="health-value">{data?.system_health?.unread_notifications ?? 0}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

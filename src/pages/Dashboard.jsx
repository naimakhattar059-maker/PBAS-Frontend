import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Col,
  Progress,
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
  const color = status === "Completed" ? "green" : status === "Pending" ? "orange" : "blue";
  return <Tag color={color}>{status}</Tag>;
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
      { title: "Date", dataIndex: "date", key: "date", width: 110 },
      { title: "Time", dataIndex: "time", key: "time", width: 90 },
      { title: "User", dataIndex: "user", key: "user" },
      { title: "Activity", dataIndex: "activity", key: "activity" },
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

        <Row gutter={[16, 16]} className="stat-row">
          {["users", "pending_approvals", "budget_available", "expense_this_month"].map((key) => (
            <Col xs={24} sm={12} lg={6} key={key}>
              <Card className="stat-card" loading={loading} bordered={false}>
                <Text className="stat-label">{key.replace(/_/g, " ")}</Text>
                <div className="stat-value">
                  {data?.totals?.[key] || (loading ? "…" : "—")}
                </div>
                <Text type="secondary">Updated just now</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card className="panel-card" title="Recent Activities" loading={loading}>
            <Table
              size="small"
              columns={activityColumns}
              dataSource={data?.recent_activities || []}
              rowKey={(row, idx) => `${row.user}-${idx}`}
              pagination={false}
            />
          </Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card className="panel-card" title="Upcoming cutoffs" loading={loading}>
                <ul className="bullets">
                  <li>Payroll freeze on 27 Nov</li>
                  <li>Department budget review on 30 Nov</li>
                  <li>Fee reminder email batch on 01 Dec</li>
                </ul>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card className="panel-card" title="Quick actions" loading={loading}>
                <Space wrap size={8}>
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
          <Card className="panel-card" title="Fee collection & cashflow" loading={loading}>
            <div className="chart-row">
              <Progress
                type="dashboard"
                percent={data?.charts?.fee_collection?.paid_percentage || 0}
                strokeColor="#2f89ff"
              />
              <div className="chart-meta">
                <Title level={4}>
                  {data?.charts?.fee_collection?.paid_percentage
                    ? `${data.charts.fee_collection.paid_percentage}%`
                    : loading
                    ? "…"
                    : "—"}
                </Title>
                <Text type="secondary">Paid of total fees</Text>
                <Tag color="green">{data?.charts?.fee_collection?.month_delta || "+12%"}</Tag>
              </div>
            </div>
          </Card>

          <Card className="panel-card" title="System health" loading={loading}>
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
                <Text type="secondary">Incidents</Text>
                <div className="health-value">{data?.system_health?.open_incidents || "1 minor"}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

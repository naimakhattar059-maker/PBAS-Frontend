import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { fetchDashboard } from "../api/dashboard";
import "./Dashboard.css";

const { Title, Text } = Typography;

const BUDGET_CHART_COLORS = {
  remaining: "#18c4b8",
  utilized: "#8b5cf6",
};

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
  const [showAllActivities, setShowAllActivities] = useState(false);

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

  const recentActivities = data?.recent_activities || [];
  const visibleActivities = showAllActivities ? recentActivities : recentActivities.slice(0, 4);
  const budgetOverview = data?.charts?.budget_overview || {};
  const budgetChartItems = [
    {
      key: "remaining",
      label: "Remaining Budget",
      value: Number(budgetOverview.remaining_budget || 0),
      formatted: budgetOverview.formatted?.remaining_budget || "PKR 0",
      color: BUDGET_CHART_COLORS.remaining,
    },
    {
      key: "utilized",
      label: "Utilized Budget",
      value: Number(budgetOverview.utilized_budget || 0),
      formatted: budgetOverview.formatted?.utilized_budget || "PKR 0",
      color: BUDGET_CHART_COLORS.utilized,
    },
  ];
  const budgetChartTotal = budgetChartItems.reduce((sum, item) => sum + item.value, 0);
  const budgetFullAmount = budgetOverview.formatted?.full_budget || "PKR 0";
  const budgetSegments = budgetChartItems.reduce(
    (segments, item) => {
      if (budgetChartTotal <= 0 || item.value <= 0) return segments;
      const percent = (item.value / budgetChartTotal) * 100;
      const midPercent = segments.runningTotal + percent / 2;
      const labelAngle = (midPercent / 100) * 360 - 90;
      const labelRadius = 12.5;
      const segment = {
        ...item,
        percent,
        offset: 25 - segments.runningTotal,
        labelX: 21 + labelRadius * Math.cos((labelAngle * Math.PI) / 180),
        labelY: 21 + labelRadius * Math.sin((labelAngle * Math.PI) / 180),
      };
      return {
        runningTotal: segments.runningTotal + percent,
        items: [...segments.items, segment],
      };
    },
    { runningTotal: 0, items: [] }
  ).items;
  const remainingPercent = budgetChartTotal
    ? Math.round((Number(budgetOverview.remaining_budget || 0) / budgetChartTotal) * 100)
    : 0;
  const utilizedPercent = budgetChartTotal
    ? Math.round((Number(budgetOverview.utilized_budget || 0) / budgetChartTotal) * 100)
    : 0;

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
        <Col xs={24}>
          <Card className="panel-card panel-card-budget budget-chart-card" title="Budget Overview" loading={loading}>
            <div className="budget-chart-layout">
              <div className="budget-donut-wrap" aria-label="Budget overview chart">
                <svg className="budget-donut" viewBox="0 0 42 42" role="img">
                  <circle className="budget-donut-bg" cx="21" cy="21" r="15.915" />
                  {budgetSegments.length > 0 ? (
                    budgetSegments.map((segment) => (
                      <circle
                        key={segment.key}
                        className="budget-donut-segment"
                        cx="21"
                        cy="21"
                        r="15.915"
                        stroke={segment.color}
                        strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
                        strokeDashoffset={segment.offset}
                      />
                    ))
                  ) : (
                    <circle
                      className="budget-donut-segment"
                      cx="21"
                      cy="21"
                      r="15.915"
                      stroke="#ffd5d8"
                      strokeDasharray="100 0"
                      strokeDashoffset="25"
                    />
                  )}
                  {budgetSegments
                    .filter((segment) => segment.percent >= 3)
                    .map((segment) => (
                      <text
                        key={`${segment.key}-percent`}
                        className="budget-donut-percent"
                        x={segment.labelX}
                        y={segment.labelY}
                      >
                        {Math.round(segment.percent)}%
                      </text>
                    ))}
                </svg>
              </div>

              <div className="budget-chart-legend">
                <div className="budget-legend-heading">
                  <span>Budget</span>
                  <span>Amount</span>
                  <span>Share</span>
                </div>
                <div className="budget-legend-row budget-legend-total">
                  <span className="budget-legend-label">
                    <span className="budget-legend-dot budget-legend-dot-total" />
                    Full Budget
                  </span>
                  <strong>{budgetFullAmount}</strong>
                  <small>100%</small>
                </div>
                <div className="budget-legend-row">
                  <span className="budget-legend-label">
                    <span className="budget-legend-dot" style={{ backgroundColor: BUDGET_CHART_COLORS.remaining }} />
                    Remaining Budget
                  </span>
                  <strong>{budgetOverview.formatted?.remaining_budget || "PKR 0"}</strong>
                  <small>{remainingPercent}%</small>
                </div>
                <div className="budget-legend-row">
                  <span className="budget-legend-label">
                    <span className="budget-legend-dot" style={{ backgroundColor: BUDGET_CHART_COLORS.utilized }} />
                    Utilized Budget
                  </span>
                  <strong>{budgetOverview.formatted?.utilized_budget || "PKR 0"}</strong>
                  <small>{utilizedPercent}%</small>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            className="panel-card panel-card-wide panel-card-activities"
            title="Recent Activities"
            loading={loading}
            extra={
              <Tooltip title={showAllActivities ? "Show latest activities only" : "View all activities"}>
                <Button
                  type="text"
                  icon={showAllActivities ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setShowAllActivities((current) => !current)}
                  aria-label={showAllActivities ? "Show latest activities only" : "View all activities"}
                >
                  {showAllActivities ? "Show less" : "View all"}
                </Button>
              </Tooltip>
            }
          >
            <Table
              size="small"
              columns={activityColumns}
              dataSource={visibleActivities}
              rowKey={(row, idx) => `${row.title}-${idx}`}
              pagination={showAllActivities && recentActivities.length > 8 ? { pageSize: 8, showSizeChanger: false } : false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={12}>
          <Card className="panel-card panel-card-tight panel-card-signals" title="Live signals" loading={loading}>
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

        <Col xs={24} xl={12}>
          <Card className="panel-card panel-card-stretch panel-card-mix" title="Activity mix" loading={loading}>
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
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

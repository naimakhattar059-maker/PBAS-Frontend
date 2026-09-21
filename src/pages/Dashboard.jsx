import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Row,
  Select,
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
const currentYear = new Date().getFullYear();

const BUDGET_CHART_COLORS = {
  remaining: "#18c4b8",
  utilized: "#8b5cf6",
};

const REVENUE_CHART_COLORS = {
  remaining: "#0f766e",
  utilized: "#e11d48",
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
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [showAllActivities, setShowAllActivities] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const payload = await fetchDashboard(token, selectedYear);
        setData(payload);
      } catch (err) {
        message.error(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedYear, token]);

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

  const getFirstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

  const formatValue = (value) => {
    if (value == null) return "—";
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
            label: "Budget Head",
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
  const dashboardYear = data?.year || selectedYear;
  const yearOptions = (data?.available_years?.length ? data.available_years : [selectedYear]).map((year) => ({
    value: year,
    label: String(year),
  }));
  const budgetOverview = data?.charts?.budget_overview || {};
  const internalRevenueOverview = data?.charts?.internal_revenue_overview || data?.internal_revenue || {};
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
  const buildChartSegments = (items, total) =>
    items.reduce(
    (segments, item) => {
      if (total <= 0 || item.value <= 0) return segments;
      const percent = (item.value / total) * 100;
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
  const budgetSegments = buildChartSegments(budgetChartItems, budgetChartTotal);
  const remainingPercent = budgetChartTotal
    ? Math.round((Number(budgetOverview.remaining_budget || 0) / budgetChartTotal) * 100)
    : 0;
  const utilizedPercent = budgetChartTotal
    ? Math.round((Number(budgetOverview.utilized_budget || 0) / budgetChartTotal) * 100)
    : 0;
  const revenueTotal = Number(internalRevenueOverview.total || 0);
  const revenueRemaining = Number(internalRevenueOverview.remaining || 0);
  const revenueUtilized = Number(internalRevenueOverview.utilized || 0);
  const revenueChartItems = [
    {
      key: "remaining-revenue",
      label: "Remaining Revenue",
      value: Math.max(revenueRemaining, 0),
      formatted: internalRevenueOverview.formatted?.remaining || "PKR 0",
      color: REVENUE_CHART_COLORS.remaining,
    },
    {
      key: "utilized-revenue",
      label: "Utilized Revenue",
      value: Math.max(revenueUtilized, 0),
      formatted: internalRevenueOverview.formatted?.utilized || "PKR 0",
      color: REVENUE_CHART_COLORS.utilized,
    },
  ];
  const revenueChartTotal = revenueTotal > 0 ? revenueTotal : revenueChartItems.reduce((sum, item) => sum + item.value, 0);
  const revenueSegments = buildChartSegments(revenueChartItems, revenueChartTotal);
  const remainingRevenuePercent = revenueChartTotal ? Math.round((Math.max(revenueRemaining, 0) / revenueChartTotal) * 100) : 0;
  const utilizedRevenuePercent = revenueChartTotal ? Math.round((Math.max(revenueUtilized, 0) / revenueChartTotal) * 100) : 0;
  const revenueFullAmount = internalRevenueOverview.formatted?.total || "PKR 0";
  const totals = data?.totals || {};
  const formattedBudget = budgetOverview.formatted || {};
  const totalBudgetValue = getFirstValue(
    formattedBudget.full_budget,
    totals.total_budget,
    totals.full_budget,
    totals.budget_total
  );
  const remainingBudgetValue = getFirstValue(
    formattedBudget.remaining_budget,
    totals.remaining_amount,
    totals.remaining_budget,
    totals.budget_available
  );
  const utilizedBudgetValue = getFirstValue(
    formattedBudget.utilized_budget,
    totals.utilization,
    totals.utilized_budget,
    totals.expense_this_month
  );
  const totalRevenueValue = getFirstValue(
    totals.total_internal_revenue,
    totals.internal_revenue_total,
    totals.total_revenue,
    data?.internal_revenue?.total,
    data?.internal_revenue?.formatted?.total
  );
  const remainingRevenueValue = getFirstValue(
    totals.remaining_internal_revenue,
    totals.internal_revenue_remaining,
    totals.remaining_revenue,
    data?.internal_revenue?.remaining,
    data?.internal_revenue?.formatted?.remaining
  );
  const utilizedRevenueValue = getFirstValue(
    totals.utilized_internal_revenue,
    totals.internal_revenue_utilized,
    totals.utilized_revenue,
    data?.internal_revenue?.utilized,
    data?.internal_revenue?.formatted?.utilized
  );
  const internalRevenueUtilizationRate =
    data?.internal_revenue?.formatted?.utilization_rate ||
    (totals.internal_revenue_utilization_rate != null ? `${totals.internal_revenue_utilization_rate}%` : null);
  const topStats = [
    {
      key: "total-budget",
      label: "Total Budget",
      value: totalBudgetValue,
      accent: "aqua",
    },
    {
      key: "remaining-budget",
      label: "Remaining Amount",
      value: remainingBudgetValue,
      accent: "mint",
    },
    {
      key: "utilization",
      label: "Utilization",
      value: utilizedBudgetValue,
      note: `${utilizedPercent}% utilized`,
      accent: "violet",
    },
    {
      key: "pending-approvals",
      label: "Pending Approvals",
      value: totals.pending_approvals,
      accent: "amber",
    },
    {
      key: "total-revenue",
      label: "Total Internal Revenue",
      value: totalRevenueValue,
      accent: "blue",
    },
    {
      key: "remaining-revenue",
      label: "Remaining Revenue",
      value: remainingRevenueValue,
      accent: "teal",
    },
    {
      key: "utilized-revenue",
      label: "Utilized Revenue",
      value: utilizedRevenueValue,
      note: internalRevenueUtilizationRate ? `${internalRevenueUtilizationRate} utilized` : undefined,
      accent: "rose",
    },
  ];

  const renderOverviewChart = ({ title, totalLabel, totalAmount, rows, segments, fallbackColor = "#ffd5d8" }) => (
    <div className="budget-chart-layout">
      <div className="budget-donut-wrap" aria-label={`${title} chart`}>
        <svg className="budget-donut" viewBox="0 0 42 42" role="img">
          <circle className="budget-donut-bg" cx="21" cy="21" r="15.915" />
          {segments.length > 0 ? (
            segments.map((segment) => (
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
              stroke={fallbackColor}
              strokeDasharray="100 0"
              strokeDashoffset="25"
            />
          )}
          {segments
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
          <span>{title}</span>
          <span>Amount</span>
          <span>Share</span>
        </div>
        <div className="budget-legend-row budget-legend-total">
          <span className="budget-legend-label">
            <span className="budget-legend-dot budget-legend-dot-total" />
            {totalLabel}
          </span>
          <strong>{totalAmount}</strong>
          <small>100%</small>
        </div>
        {rows.map((row) => (
          <div className="budget-legend-row" key={row.key}>
            <span className="budget-legend-label">
              <span className="budget-legend-dot" style={{ backgroundColor: row.color }} />
              {row.label}
            </span>
            <strong>{row.formatted}</strong>
            <small>{row.percent}%</small>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-hero">
          <div>
            <Text className="eyebrow">Dashboard</Text>
            <div className="title-row">
              <Title level={2}>Overview</Title>
              <Tag color="green">Live</Tag>
              <Tag color="blue">Year {dashboardYear}</Tag>
            </div>
            <Text className="subtitle">
              Hi {user?.username || "there"}, here’s the {dashboardYear} snapshot of your institution.
            </Text>
          </div>
          <div className="dashboard-year-filter">
            <Text className="dashboard-year-label">Year</Text>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={yearOptions}
              style={{ width: 130 }}
            />
          </div>
        </div>

        <Row gutter={[18, 18]} className="stat-row">
          {topStats.map(({ key, label, value, note, accent }) => (
            <Col xs={24} sm={12} lg={6} key={key}>
              <Card className={`stat-card stat-card-${accent}`} loading={loading} bordered={false}>
                <Text className="stat-label">{label}</Text>
                <div className="stat-value">
                  {formatValue(getFirstValue(value, loading ? "…" : "—"))}
                </div>
                <Text type="secondary">{note || "Updated just now"}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Row gutter={[18, 18]}>
        <Col xs={24}>
          <Card className="panel-card panel-card-budget budget-chart-card" title="Budget Overview" loading={loading}>
            {renderOverviewChart({
              title: "Budget",
              totalLabel: "Full Budget",
              totalAmount: budgetFullAmount,
              segments: budgetSegments,
              rows: [
                {
                  key: "remaining-budget",
                  label: "Remaining Budget",
                  formatted: budgetOverview.formatted?.remaining_budget || "PKR 0",
                  percent: remainingPercent,
                  color: BUDGET_CHART_COLORS.remaining,
                },
                {
                  key: "utilized-budget",
                  label: "Utilized Budget",
                  formatted: budgetOverview.formatted?.utilized_budget || "PKR 0",
                  percent: utilizedPercent,
                  color: BUDGET_CHART_COLORS.utilized,
                },
              ],
            })}
          </Card>
        </Col>

        <Col xs={24}>
          <Card className="panel-card panel-card-revenue budget-chart-card" title="Internal Revenue Overview" loading={loading}>
            {renderOverviewChart({
              title: "Revenue",
              totalLabel: "Total Revenue",
              totalAmount: revenueFullAmount,
              segments: revenueSegments,
              fallbackColor: "#ccfbf1",
              rows: [
                {
                  key: "remaining-revenue",
                  label: "Remaining Revenue",
                  formatted: internalRevenueOverview.formatted?.remaining || "PKR 0",
                  percent: remainingRevenuePercent,
                  color: REVENUE_CHART_COLORS.remaining,
                },
                {
                  key: "utilized-revenue",
                  label: "Utilized Revenue",
                  formatted: internalRevenueOverview.formatted?.utilized || "PKR 0",
                  percent: utilizedRevenuePercent,
                  color: REVENUE_CHART_COLORS.utilized,
                },
              ],
            })}
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
        <Col xs={24} lg={12}>
          <Card className="panel-card panel-card-tight panel-card-system" title="System Summary" loading={loading}>
            <div className="system-summary-card">
              <Text className="stat-label">Users</Text>
              <div className="stat-value">{formatValue(getFirstValue(totals.users, loading ? "…" : "—"))}</div>
              <Text type="secondary">Registered system users</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
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
      </Row>
    </div>
  );
};

export default Dashboard;

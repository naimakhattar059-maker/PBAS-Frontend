import { useEffect, useMemo, useState } from "react";
import { Button, Card, DatePicker, Empty, Input, Select, Space, Table, Tag, Typography } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { listAuditLogs } from "../api/auditLogs";
import AccessDenied from "../components/AccessDenied";
import { hasAnyPermission } from "../utils/permissions";
import "./Dashboard.css";
import "./AuditLogs.css";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const actionColors = {
  create: "green",
  update: "blue",
  delete: "red",
  approve: "cyan",
  reject: "volcano",
  submit: "purple",
  verify: "geekblue",
  generate: "gold",
  login: "lime",
  logout: "default",
  bulk_upsert: "magenta",
  activation: "orange",
  password: "red",
};

const moduleLabels = {
  audit_logs: "Audit Logs",
  budget_categories: "Budget Categories",
  budget_heads: "Budget Heads",
  budgets: "Budgets",
  internal_revenue_cells: "Internal Revenue",
  notifications: "Notifications",
  payroll_run_items: "Payroll Items",
  payroll_staffs: "Payroll Staff",
  payrolls: "Payroll",
  profiles: "Profile",
  requests: "Resource Requests",
  sessions: "Sessions",
  users: "Users",
};

const actionLabels = {
  activation: "Changed account status",
  approve: "Approved",
  bulk_upsert: "Saved spreadsheet",
  create: "Created",
  delete: "Deleted",
  generate: "Generated",
  login: "Logged in",
  logout: "Logged out",
  mark_all_read: "Marked notifications read",
  password: "Changed password",
  reject: "Rejected",
  submit: "Submitted",
  update: "Updated",
  verify: "Verified",
};

const canViewAllLogs = (user) => ["admin", "head_of_institute", "superadmin"].includes(user?.role);

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.audit_logs)) return payload.audit_logs;
  if (Array.isArray(payload?.logs)) return payload.logs;
  return [];
};

const formatActor = (record) =>
  record.user?.username || record.user?.email || record.actor || record.by || record.username || "System";

const formatRole = (record) => record.user?.role || record.role || "-";

const formatModule = (value) => moduleLabels[value] || value || "-";
const formatAction = (value) => actionLabels[value] || String(value || "Action").replaceAll("_", " ");

const formatPeriod = (period) => {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) return period;
  const date = new Date(`${period}-01T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" }).replace(" ", "-");
};

const formatCellPosition = (cell) => `row ${Number(cell.row_index) + 1}, column ${Number(cell.column_index) + 1}`;

const formatCellPreview = (cells = []) =>
  cells
    .slice(0, 3)
    .map((cell) => `${formatCellPosition(cell)} = ${String(cell.value ?? "").trim() || "blank"}`)
    .join("; ");

const getSpreadsheetDetails = (record, params) => {
  const period = params.period || record.entity_id;
  const cellCount = Number(params.changed_cell_count || params.cells?.length || 0);
  const preview = Array.isArray(params.cells) ? formatCellPreview(params.cells) : "";
  const periodText = period ? ` for ${formatPeriod(period)}` : "";
  const previewText = preview ? `: ${preview}${cellCount > 3 ? "; ..." : ""}` : "";

  if (params.replace && cellCount > 100) return `Saved full Internal Revenue sheet${periodText} (${cellCount} cells)${previewText}`;
  if (params.replace) return `Restored Internal Revenue sheet${periodText}${cellCount ? ` (${cellCount} cells)` : ""}${previewText}`;
  if (cellCount === 1) return `Edited one Internal Revenue cell${periodText}${previewText}`;
  if (cellCount > 1) return `Updated ${cellCount} Internal Revenue cells${periodText}${previewText}`;

  return `Saved Internal Revenue spreadsheet${periodText}`;
};

const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const stringifyMetadata = (metadata) => {
  if (!metadata) return "";
  if (typeof metadata === "string") return metadata;
  return JSON.stringify(metadata, null, 2);
};

const getDetails = (record) => {
  const metadata = record.metadata || {};
  if (metadata.details) return metadata.details;
  if (metadata.reason) return metadata.reason;

  const params = metadata.params || {};
  const moduleName = formatModule(record.entity_type);

  if (record.action === "login") return metadata.result === "failed" ? "Login failed" : "Login successful";
  if (record.action === "logout") return "User logged out";
  if (record.action === "bulk_upsert" && record.entity_type === "internal_revenue_cells") {
    return getSpreadsheetDetails(record, params);
  }
  if (record.action === "activation") return "Changed user active status";
  if (record.action === "password") return "Changed account password";
  if (["approve", "reject", "submit", "verify"].includes(record.action)) return `${formatAction(record.action)} ${moduleName} record`;
  if (["create", "update", "delete", "generate"].includes(record.action)) return `${formatAction(record.action)} ${moduleName} record`;

  return "-";
};

const AuditLogs = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const canViewAuditLogs = hasAnyPermission(user, ["view_audit_logs", "view_reports"]);
  const canViewAll = canViewAllLogs(user);

  const loadAuditLogs = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const filters = {
        entity_type: entityFilter === "all" ? "" : entityFilter,
        audit_action: actionFilter === "all" ? "" : actionFilter,
        user_id: canViewAll && userFilter !== "all" ? userFilter : "",
        from: dateRange?.[0]?.format("YYYY-MM-DD") || "",
        to: dateRange?.[1]?.format("YYYY-MM-DD") || "",
        limit: 500,
      };
      const payload = await listAuditLogs(token, filters);
      setLogs(asArray(payload));
    } catch (err) {
      setLoadError(err.message || "Audit log service is not available");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && canViewAuditLogs) {
      loadAuditLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canViewAuditLogs]);

  const entityOptions = useMemo(() => {
    const entities = Array.from(new Set(logs.map((log) => log.entity_type || log.module).filter(Boolean))).sort();
    return [{ value: "all", label: "All modules" }, ...entities.map((entity) => ({ value: entity, label: formatModule(entity) }))];
  }, [logs]);

  const actionOptions = useMemo(() => {
    const actions = Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).sort();
    return [{ value: "all", label: "All actions" }, ...actions.map((action) => ({ value: action, label: formatAction(action) }))];
  }, [logs]);

  const userOptions = useMemo(() => {
    const users = logs
      .map((log) => log.user)
      .filter(Boolean)
      .reduce((acc, logUser) => acc.set(logUser.id, logUser), new Map());

    return [
      { value: "all", label: "All users" },
      ...Array.from(users.values()).map((logUser) => ({
        value: String(logUser.id),
        label: `${logUser.username || logUser.email} (${logUser.role})`,
      })),
    ];
  }, [logs]);

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(logs.map((log) => log.user?.role).filter(Boolean))).sort();
    return [{ value: "all", label: "All roles" }, ...roles.map((role) => ({ value: role, label: role }))];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return logs.filter((log) => {
      const entity = log.entity_type || log.module || "";
      const role = log.user?.role || "";
      const metadata = stringifyMetadata(log.metadata || log.changes);
      const haystack = [
        log.action,
        entity,
        formatModule(entity),
        log.entity_id,
        formatActor(log),
        role,
        log.ip_address,
        getDetails(log),
        metadata,
        log.created_at,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      return (
        (roleFilter === "all" || role === roleFilter) &&
        (entityFilter === "all" || entity === entityFilter) &&
        (actionFilter === "all" || log.action === actionFilter) &&
        (!normalizedSearch || haystack.includes(normalizedSearch))
      );
    });
  }, [actionFilter, entityFilter, logs, roleFilter, searchText]);

  const columns = [
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 140,
      render: (value = "action", record) => {
        const result = record.metadata?.result;
        const color = result === "failed" ? "red" : actionColors[value] || "blue";
        return <Tag color={color}>{formatAction(value)}</Tag>;
      },
    },
    {
      title: "Module",
      key: "entity_type",
      width: 170,
      render: (_, record) => formatModule(record.entity_type || record.module),
    },
    {
      title: "Record",
      key: "entity_id",
      width: 120,
      render: (_, record) => record.entity_id || record.record_id || "-",
    },
    {
      title: "Performed By",
      key: "actor",
      width: 190,
      render: (_, record) => formatActor(record),
    },
    {
      title: "Role",
      key: "role",
      width: 150,
      render: (_, record) => formatRole(record),
    },
    {
      title: "Details",
      key: "details",
      width: 260,
      render: (_, record) => getDetails(record),
    },
    {
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
      width: 150,
      render: (value) => value || "-",
    },
    {
      title: "Time",
      key: "created_at",
      width: 210,
      render: (_, record) => formatTime(record.created_at || record.occurred_at || record.at),
    },
  ];

  if (!canViewAuditLogs) {
    return <AccessDenied title="Audit Logs" />;
  }

  return (
    <div className="dashboard-page audit-page">
      <div className="dashboard-shell audit-shell">
        <div className="dashboard-hero audit-hero">
          <div>
            <Text className="eyebrow">Audit Logs</Text>
            <div className="title-row">
              <Title level={2}>{canViewAll ? "Security Activity" : "My Activity"}</Title>
              <Tag color="blue">Read only</Tag>
            </div>
            <Text className="subtitle">
              {canViewAll
                ? "Track every user action across protected modules."
                : "Track the actions you performed and when they happened."}
            </Text>
          </div>
        </div>

        <Card className="panel-card audit-filter-card" bordered={false}>
          <Space className="audit-toolbar" wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search action, module, user, record, IP, or details"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              style={{ width: 360, maxWidth: "100%" }}
            />
            <Select value={entityFilter} onChange={setEntityFilter} options={entityOptions} style={{ width: 180 }} />
            <Select value={actionFilter} onChange={setActionFilter} options={actionOptions} style={{ width: 160 }} />
            {canViewAll && <Select value={userFilter} onChange={setUserFilter} options={userOptions} style={{ width: 240 }} />}
            {canViewAll && <Select value={roleFilter} onChange={setRoleFilter} options={roleOptions} style={{ width: 160 }} />}
            <RangePicker value={dateRange} onChange={setDateRange} />
            <Button className="audit-refresh-button" icon={<ReloadOutlined />} onClick={loadAuditLogs} loading={loading}>
              Refresh
            </Button>
          </Space>
        </Card>
      </div>

      <Card className="panel-card audit-table-card" style={{ marginTop: 16 }} bordered={false}>
        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey={(record, index) => record.id || `${record.action}-${record.entity_type}-${record.created_at}-${index}`}
          loading={loading}
          scroll={{ x: 1390 }}
          locale={{ emptyText: <Empty description={loadError || "No audit logs found"} /> }}
          expandable={{
            expandedRowRender: (record) => {
              const metadata = stringifyMetadata(record.metadata || record.changes);
              const details = getDetails(record);
              return metadata ? (
                <div>
                  <Text strong>{details}</Text>
                  <pre className="audit-metadata">{metadata}</pre>
                </div>
              ) : (
                <Text type="secondary">No metadata recorded.</Text>
              );
            },
          }}
          pagination={{ pageSize: 12, showSizeChanger: false }}
        />
      </Card>
    </div>
  );
};

export default AuditLogs;

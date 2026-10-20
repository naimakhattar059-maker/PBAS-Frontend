import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Popover,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
} from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { approveBudget, archiveBudget, createBudget, deleteBudget, listBudgets, updateBudget } from "../api/budgets";
import AccessDenied from "../components/AccessDenied";
import { hasAnyPermission, hasPermission } from "../utils/permissions";
import "./BudgetManagement.css";

const { Title, Text } = Typography;

const typeOptions = [
  { value: "normal", label: "Normal" },
  { value: "supplementary", label: "Supplementary" },
];
const MAX_BUDGET_WHOLE_DIGITS = 13;
const MAX_BUDGET_DECIMALS = 2;

const currentYear = new Date().getFullYear();

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const titleCase = (value = "") => value.charAt(0).toUpperCase() + value.slice(1);
const toYearNumber = (value) => {
  if (!value) {
    return undefined;
  }

  return typeof value.year === "function" ? value.year() : Number(value);
};
const toStartDatePickerValue = (year) => (year ? dayjs(`${Number(year)}-01-01`) : null);
const toEndDatePickerValue = (year) => (year ? dayjs(`${Number(year)}-12-31`) : null);
const normalizeBudgetCategory = (category) => String(category || "").trim().toLowerCase();
const isBudgetArchived = (budget) => Boolean(budget.archived) || Number(budget.end_year || budget.start_year) < currentYear;
const rangesOverlap = (startA, endA, startB, endB) => Number(startA) <= Number(endB) && Number(startB) <= Number(endA);
const sanitizeAmountInput = (value) => {
  const sanitized = String(value || "").replace(/[^\d.]/g, "");
  const [whole = "", ...decimalParts] = sanitized.split(".");
  const limitedWhole = whole.slice(0, MAX_BUDGET_WHOLE_DIGITS);
  const decimals = decimalParts.join("").slice(0, MAX_BUDGET_DECIMALS);

  return decimals.length ? `${limitedWhole}.${decimals}` : limitedWhole;
};

const handleAmountKeyDown = (event) => {
  const allowedKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
  ];

  if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
    return;
  }

  const isDigit = /^\d$/.test(event.key);
  const isDecimal = event.key === "." && !event.currentTarget.value.includes(".");

  if (!isDigit && !isDecimal) {
    event.preventDefault();
  }
};

const getBudgetYear = (budget) => Number(budget.start_year || currentYear);
const getBudgetEndYear = (budget) => Number(budget.end_year || budget.start_year || currentYear);
const getBudgetYearRange = (budget) => {
  const start = getBudgetYear(budget);
  const end = getBudgetEndYear(budget);

  return `${start} to ${end}`;
};
const matchesSelectedYear = (budget, selectedYear) => {
  if (!selectedYear || selectedYear === "all") {
    return true;
  }

  const year = Number(selectedYear);
  const start = Number(budget.start_year);
  const end = Number(budget.end_year || budget.start_year);

  return year >= start && year <= end;
};

const getBudgetSearchText = (budget) =>
  [
    budget.name,
    budget.start_year,
    budget.end_year,
    budget.amount,
    budget.remaining_amount,
    budget.spent_amount,
    budget.budget_type,
    budget.budget_head,
    budget.budget_category,
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLowerCase();

const BudgetManagement = () => {
  const { token, user: currentUser } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [popoverOpenId, setPopoverOpenId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [auditPreview, setAuditPreview] = useState({ open: false, title: "", entries: [] });
  const [searchText, setSearchText] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const startYear = Form.useWatch("start_year", form);
  const canViewBudgets = hasAnyPermission(currentUser, ["view_budgets"]);
  const canCreateBudgets = currentUser?.role === "admin_officer" && hasPermission(currentUser, "create_budgets");
  const canApproveBudgets = currentUser?.role === "admin" && hasPermission(currentUser, "approve_budgets");
  const canUpdateBudgets = currentUser?.role === "admin_officer" && hasPermission(currentUser, "update_budgets");
  const canDeleteBudgets = currentUser?.role === "admin_officer" && hasPermission(currentUser, "delete_budgets");
  const canManageBudgetActions = canUpdateBudgets || canDeleteBudgets || canApproveBudgets;

  const isEditing = Boolean(editingId);

  const totalBudgetAmount = useMemo(
    () => budgets.reduce((sum, budget) => sum + Number(budget.amount || 0), 0),
    [budgets]
  );
  const totalRemainingAmount = useMemo(
    () => budgets.reduce((sum, budget) => sum + Number(budget.remaining_amount ?? budget.amount ?? 0), 0),
    [budgets]
  );
  const totalUtilizedAmount = useMemo(
    () => budgets.reduce((sum, budget) => sum + Number(budget.spent_amount || 0), 0),
    [budgets]
  );
  const availableYears = useMemo(
    () =>
      Array.from(new Set(budgets.map((budget) => getBudgetYear(budget))))
        .filter(Boolean)
        .sort((a, b) => b - a)
        .map((year) => ({ value: year, label: String(year) })),
    [budgets]
  );
  const filteredBudgets = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return budgets.filter((budget) => {
      const yearMatches = matchesSelectedYear(budget, selectedYear);
      const searchMatches = !normalizedSearch || getBudgetSearchText(budget).includes(normalizedSearch);

      return yearMatches && searchMatches;
    });
  }, [budgets, searchText, selectedYear]);
  const groupedBudgets = useMemo(() => {
    const groups = filteredBudgets.reduce((acc, budget) => {
      const startYearValue = getBudgetYear(budget);
      const endYearValue = getBudgetEndYear(budget);
      const key = `${startYearValue}-${endYearValue}`;
      const existing = acc.get(key) || {
        key,
        startYear: startYearValue,
        endYear: endYearValue,
        label: getBudgetYearRange(budget),
        budgets: [],
      };
      acc.set(key, { ...existing, budgets: [...existing.budgets, budget] });
      return acc;
    }, new Map());

    return Array.from(groups.values())
      .sort((groupA, groupB) => groupB.startYear - groupA.startYear || groupB.endYear - groupA.endYear)
      .map((group) => {
        const yearBudgets = group.budgets;

        return {
        key: group.key,
        year: group.startYear,
        yearLabel: group.label,
        budgets: [...yearBudgets].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
        total: yearBudgets.reduce((sum, budget) => sum + Number(budget.amount || 0), 0),
        remaining: yearBudgets.reduce((sum, budget) => sum + Number(budget.remaining_amount ?? budget.amount ?? 0), 0),
        utilized: yearBudgets.reduce((sum, budget) => sum + Number(budget.spent_amount || 0), 0),
      };
      });
  }, [filteredBudgets]);
  const filteredTotalAmount = useMemo(
    () => filteredBudgets.reduce((sum, budget) => sum + Number(budget.amount || 0), 0),
    [filteredBudgets]
  );
  const filteredRemainingAmount = useMemo(
    () => filteredBudgets.reduce((sum, budget) => sum + Number(budget.remaining_amount ?? budget.amount ?? 0), 0),
    [filteredBudgets]
  );
  const filteredUtilizedAmount = useMemo(
    () => filteredBudgets.reduce((sum, budget) => sum + Number(budget.spent_amount || 0), 0),
    [filteredBudgets]
  );

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const payload = await listBudgets(token);
      setBudgets(payload.budgets || []);
    } catch (err) {
      message.error(err.message || "Could not load budgets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && canViewBudgets) {
      loadBudgets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewBudgets, token]);

  const resetForm = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      name: "",
      budget_type: "normal",
      start_year: toStartDatePickerValue(currentYear),
      end_year: toEndDatePickerValue(currentYear + 1),
      budget_head: "",
      budget_category: "",
    });
  };

  useEffect(() => {
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!canViewBudgets) {
    return <AccessDenied title="Budget Management" />;
  }

  const hasDuplicateBudget = ({ startYear, endYear, category }) =>
    budgets.some((budget) => {
      if (editingId && String(budget.id) === String(editingId)) {
        return false;
      }

      return (
        normalizeBudgetCategory(budget.budget_category) === normalizeBudgetCategory(category) &&
        rangesOverlap(startYear, endYear, budget.start_year, budget.end_year || budget.start_year)
      );
    });

  const handleSubmit = async (values) => {
    const startYearValue = toYearNumber(values.start_year);
    const endYearValue = toYearNumber(values.end_year);
    const payload = {
      name: values.name?.trim(),
      start_year: startYearValue,
      end_year: endYearValue,
      amount: values.amount,
      budget_type: values.budget_type,
      budget_head: values.budget_head?.trim() || null,
      budget_category: values.budget_category?.trim() || null,
    };

    if (hasDuplicateBudget({ startYear: startYearValue, endYear: endYearValue, category: payload.budget_category })) {
      message.error("This category already has a budget in the selected year. Edit the existing budget instead.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateBudget(token, editingId, payload);
        message.success("Budget updated and sent for approval");
      } else {
        await createBudget(token, payload);
        message.success("Budget created and sent for approval");
      }
      setModalOpen(false);
      setDiscardModalOpen(false);
      resetForm();
      loadBudgets();
    } catch (err) {
      message.error(err.message || "Could not save budget");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (budget) => {
    if (isBudgetArchived(budget)) {
      message.warning("Archived previous-year budgets cannot be changed");
      return;
    }

    setPopoverOpenId(null);
    setEditingId(budget.id);
    setModalOpen(true);
    form.setFieldsValue({
      name: budget.name,
      start_year: toStartDatePickerValue(budget.start_year),
      end_year: toEndDatePickerValue(budget.end_year),
      amount: Number(budget.amount),
      budget_type: budget.budget_type,
      budget_head: budget.budget_head || "",
      budget_category: budget.budget_category || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (budget) => {
    if (isBudgetArchived(budget)) {
      message.warning("Archived previous-year budgets cannot be deleted");
      return;
    }

    setPopoverOpenId(null);
    Modal.confirm({
      title: "Delete budget?",
      content: `Are you sure you want to delete the ${budget.start_year}-${budget.end_year} ${budget.budget_type} budget?`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteBudget(token, budget.id);
          message.success("Budget deleted");
          if (editingId === budget.id) {
            resetForm();
          }
          loadBudgets();
        } catch (err) {
          message.error(err.message || "Could not delete budget");
        }
      },
    });
  };

  const handleArchive = (budget) => {
    setPopoverOpenId(null);
    Modal.confirm({
      title: "Archive budget year?",
      content: `Remaining PKR ${formatAmount(budget.remaining_amount ?? budget.amount)} will be surrendered and this budget will be locked.`,
      okText: "Archive",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await archiveBudget(
            token,
            budget.id,
            `Budget ${budget.start_year}-${budget.end_year} closed. Remaining amount surrendered.`
          );
          message.success("Budget archived and remaining amount surrendered");
          loadBudgets();
        } catch (err) {
          message.error(err.message || "Could not archive budget");
        }
      },
    });
  };

  const handleApprove = async (budget) => {
    setPopoverOpenId(null);
    try {
      await approveBudget(token, budget.id);
      message.success("Budget approved");
      loadBudgets();
    } catch (err) {
      message.error(err.message || "Could not approve budget");
    }
  };

  const actionMenu = (budget) => (
    <Space direction="vertical" className="budget-menu">
      {canApproveBudgets && budget.approval_status === "pending_approval" && !budget.archived && (
        <Button type="text" onClick={() => handleApprove(budget)}>Approve budget</Button>
      )}
      {canUpdateBudgets && (
        <Button type="text" icon={<EditOutlined />} disabled={isBudgetArchived(budget)} onClick={() => handleEdit(budget)}>
          Edit
        </Button>
      )}
      {canUpdateBudgets && (
        <Button
          type="text"
          disabled={!Array.isArray(budget.audit_entries) || budget.audit_entries.length === 0}
          onClick={() => {
            setPopoverOpenId(null);
            setAuditPreview({ open: true, title: budget.name, entries: budget.audit_entries || [] });
          }}
        >
          Audit
        </Button>
      )}
      {canUpdateBudgets && (
        <Button danger type="text" disabled={isBudgetArchived(budget)} onClick={() => handleArchive(budget)}>
          Archive/Surrender
        </Button>
      )}
      {canDeleteBudgets && (
        <Button danger type="text" icon={<DeleteOutlined />} disabled={isBudgetArchived(budget)} onClick={() => handleDelete(budget)}>
          Delete
        </Button>
      )}
    </Space>
  );

  const budgetColumns = [
    {
      title: "Budget",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 240,
      render: (value, budget) => (
        <div className="budget-table-title">
          <Text strong>{value}</Text>
          <Text type="secondary">
            {budget.start_year} - {budget.end_year}
          </Text>
        </div>
      ),
    },
    {
      title: "Head / Category",
      key: "classification",
      width: 240,
      render: (_, budget) => (
        <Space size={[6, 6]} wrap>
          <Tag color="cyan">{budget.budget_head || "No head"}</Tag>
          <Tag color="geekblue">{budget.budget_category || "No category"}</Tag>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "budget_type",
      key: "budget_type",
      width: 150,
      render: (value) => (
        <Tag color={value === "supplementary" ? "orange" : "blue"}>{titleCase(value || "normal")}</Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 130,
      render: (_, budget) =>
        isBudgetArchived(budget) ? <Tag color="default">Archived</Tag> :
          budget.approval_status === "pending_approval" ? <Tag color="gold">Awaiting Super Admin</Tag> :
            <Tag color="green">Active</Tag>,
    },
    {
      title: "Budget Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 170,
      render: (value) => <Text strong>PKR {formatAmount(value)}</Text>,
    },
    {
      title: "Utilized Budget",
      dataIndex: "spent_amount",
      key: "spent_amount",
      align: "right",
      width: 150,
      render: (value) => <Text type="secondary">PKR {formatAmount(value || 0)}</Text>,
    },
    {
      title: "Remaining",
      key: "remaining_amount",
      align: "right",
      width: 170,
      render: (_, budget) => <Text>PKR {formatAmount(budget.remaining_amount ?? budget.amount)}</Text>,
    },
    ...(canManageBudgetActions
      ? [
          {
            title: "",
            key: "actions",
            align: "right",
            width: 72,
            render: (_, budget) => {
              if (!canUpdateBudgets && !canDeleteBudgets &&
                  !(canApproveBudgets && budget.approval_status === "pending_approval" && !budget.archived)) return null;

              return (
                <Popover
                  trigger="click"
                  placement="bottomRight"
                  content={actionMenu(budget)}
                  overlayClassName="budget-menu-popover"
                  open={popoverOpenId === budget.id}
                  onOpenChange={(open) => setPopoverOpenId(open ? budget.id : null)}
                >
                  <Button
                    type="text"
                    className="budget-more-button"
                    icon={<MoreOutlined />}
                    aria-label={`Actions for budget ${budget.id}`}
                  />
                </Popover>
              );
            },
          },
        ]
      : []),
  ];

  const openCreateModal = () => {
    resetForm();
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

  const discardChanges = () => {
    setDiscardModalOpen(false);
    setModalOpen(false);
    resetForm();
  };

  return (
    <div className="budget-page">
      <div className="budget-header">
        <div>
          <Title level={3}>Budget Management</Title>
          <Text type="secondary">
            Track budgets, their approval, and remaining balance.
          </Text>
        </div>
        {canCreateBudgets ? (
          <Button type="primary" size="small" className="budget-add-button" onClick={openCreateModal}>
            Add Budget
          </Button>
        ) : null}
      </div>

      <Card className="budget-total-card" bordered={false}>
        <div className="budget-summary-grid">
          <div className="budget-summary-tile budget-summary-tile-total">
            <Text className="budget-total-label">Total Budget</Text>
            <Title level={3}>PKR {formatAmount(totalBudgetAmount)}</Title>
            <Text type="secondary">
              Remaining: PKR {formatAmount(totalRemainingAmount)} - Utilized: PKR {formatAmount(totalUtilizedAmount)}
            </Text>
          </div>
          <div className="budget-summary-tile budget-summary-tile-view">
            <Text className="budget-total-label">Current View</Text>
            <Title level={3}>PKR {formatAmount(filteredTotalAmount)}</Title>
            <Text type="secondary">
              {filteredBudgets.length} record{filteredBudgets.length === 1 ? "" : "s"} - Remaining: PKR{" "}
              {formatAmount(filteredRemainingAmount)} - Utilized: PKR {formatAmount(filteredUtilizedAmount)}
            </Text>
          </div>
          <div className="budget-summary-tile budget-summary-tile-years">
            <Text className="budget-total-label">Budget Years</Text>
            <Title level={3}>{availableYears.length}</Title>
            <Text type="secondary">Grouped into separate yearly tables</Text>
          </div>
        </div>
      </Card>

      <Card className="budget-filter-card" bordered={false}>
        <div className="budget-filter-row">
          <Input
            allowClear
            className="budget-search-input"
            prefix={<SearchOutlined />}
            placeholder="Search name, head, category, type, year, or amount"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Select
            className="budget-year-filter"
            value={selectedYear}
            onChange={setSelectedYear}
            options={[{ value: "all", label: "All years" }, ...availableYears]}
          />
        </div>
      </Card>

      <div className="budget-year-sections">
        {budgets.length === 0 && !loading ? (
          <Card className="budget-empty-card">
            <Empty description="No budgets added yet" />
          </Card>
        ) : groupedBudgets.length === 0 && !loading ? (
          <Card className="budget-empty-card">
            <Empty description="No budgets match your search" />
          </Card>
        ) : (
          groupedBudgets.map((group) => (
            <Card
              key={group.key}
              className="budget-year-card"
              loading={loading}
              bordered={false}
              title={
                <div className="budget-year-title">
                  <div>
                    <Text className="budget-year-badge">Budget Year</Text>
                    <Title level={4}>{group.yearLabel}</Title>
                    <Text type="secondary">
                      {group.budgets.length} record{group.budgets.length === 1 ? "" : "s"} in this year
                    </Text>
                  </div>
                  <div className="budget-year-total">
                    <Text className="budget-total-label">Year Total</Text>
                    <Text strong>PKR {formatAmount(group.total)}</Text>
                    <Text type="secondary">
                      Remaining: PKR {formatAmount(group.remaining)} - Utilized: PKR {formatAmount(group.utilized)}
                    </Text>
                  </div>
                </div>
              }
            >
              <div className="budget-table-shell">
                <Table
                  className="budget-year-table"
                  columns={budgetColumns}
                  dataSource={group.budgets}
                  rowKey="id"
                  size="middle"
                  scroll={{ x: 1120 }}
                  pagination={group.budgets.length > 8 ? { pageSize: 8, showSizeChanger: false } : false}
                />
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={modalOpen}
        title={isEditing ? "Edit budget" : "Add budget"}
        onCancel={closeModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Budget name"
            name="name"
            rules={[{ required: true, message: "Enter the budget name" }]}
          >
            <Input placeholder="Enter budget name" maxLength={120} />
          </Form.Item>

          <Form.Item
            label="Start date"
            name="start_year"
            rules={[{ required: true, message: "Select the start date" }]}
          >
            <DatePicker
              format="DD MMM YYYY"
              className="budget-year-picker"
              suffixIcon={<CalendarOutlined />}
              placeholder="Select start date"
            />
          </Form.Item>

          <Form.Item
            label="End date"
            name="end_year"
            dependencies={["start_year"]}
            rules={[
              { required: true, message: "Select the end date" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const selectedStartDate = getFieldValue("start_year");

                  if (!value || !selectedStartDate || value.isSame(selectedStartDate, "day") || value.isAfter(selectedStartDate, "day")) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("End date must be after or equal to start date"));
                },
              }),
            ]}
          >
            <DatePicker
              format="DD MMM YYYY"
              className="budget-year-picker"
              suffixIcon={<CalendarOutlined />}
              placeholder="Select end date"
              disabledDate={(date) => {
                return Boolean(startYear && date.isBefore(startYear, "day"));
              }}
            />
          </Form.Item>

          <Form.Item
            label="Budget amount"
            name="amount"
            getValueFromEvent={(event) => sanitizeAmountInput(event.target.value)}
            rules={[
              { required: true, message: "Enter the budget amount" },
              {
                validator(_, value) {
                  if (!value || /^\d{1,13}(\.\d{1,2})?$/.test(value)) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error("Amount must be numbers only and stay within 13 digits"));
                },
              },
            ]}
          >
            <Input
              className="budget-amount-input"
              placeholder="Enter amount"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              onKeyDown={handleAmountKeyDown}
            />
          </Form.Item>

          <Form.Item
            label="Budget type"
            name="budget_type"
            rules={[{ required: true, message: "Select the budget type" }]}
          >
            <Select options={typeOptions} placeholder="Select budget type" />
          </Form.Item>

          <Form.Item label="Budget head" name="budget_head">
            <Input placeholder="e.g. Primary budget head" maxLength={120} />
          </Form.Item>

          <Form.Item
            label="Budget category"
            name="budget_category"
            rules={[{ required: true, message: "Enter the budget category" }]}
          >
            <Input placeholder="e.g. Supplementary category" maxLength={120} />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {isEditing ? "Update budget" : "Create budget"}
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
          <Button key="keep" onClick={() => setDiscardModalOpen(false)}>
            Keep editing
          </Button>,
          <Button key="discard" danger type="primary" onClick={discardChanges}>
            Discard
          </Button>,
        ]}
      >
        <Text type="secondary">You have unsaved budget changes. Closing now will lose them.</Text>
      </Modal>

      <Modal
        open={auditPreview.open}
        title={`Audit history: ${auditPreview.title}`}
        footer={null}
        onCancel={() => setAuditPreview({ open: false, title: "", entries: [] })}
        width={720}
      >
        <Timeline
          items={(auditPreview.entries || []).map((entry, index) => ({
            key: `${entry.at || "audit"}-${index}`,
            children: (
              <div>
                <Text strong>{entry.action || "Budget changed"}</Text>
                {entry.by || entry.role ? (
                  <div>
                    {entry.by || "Unknown user"}
                    {entry.role ? ` (${entry.role})` : ""}
                  </div>
                ) : null}
                {entry.note ? <Text type="secondary">{entry.note}</Text> : null}
                {entry.at ? (
                  <div>
                    <Text type="secondary">{entry.at}</Text>
                  </div>
                ) : null}
              </div>
            ),
          }))}
        />
      </Modal>
    </div>
  );
};

export default BudgetManagement;

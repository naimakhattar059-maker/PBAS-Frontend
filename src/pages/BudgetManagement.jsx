import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popover,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { createBudget, deleteBudget, listBudgets, updateBudget } from "../api/budgets";
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
const yearOptions = Array.from({ length: 21 }, (_, index) => {
  const year = currentYear - 5 + index;
  return { value: year, label: String(year) };
});

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);
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
  const startYear = Form.useWatch("start_year", form);
  const canViewBudgets = hasAnyPermission(currentUser, ["view_budgets"]);
  const canCreateBudgets = hasPermission(currentUser, "create_budgets");
  const canUpdateBudgets = hasPermission(currentUser, "update_budgets");
  const canDeleteBudgets = hasPermission(currentUser, "delete_budgets");
  const canManageBudgetActions = canUpdateBudgets || canDeleteBudgets;

  const isEditing = Boolean(editingId);

  const endYearOptions = useMemo(
    () => yearOptions.filter((option) => !startYear || option.value >= startYear),
    [startYear]
  );
  const totalBudgetAmount = useMemo(
    () => budgets.reduce((sum, budget) => sum + Number(budget.amount || 0), 0),
    [budgets]
  );
  const totalRemainingAmount = useMemo(
    () => budgets.reduce((sum, budget) => sum + Number(budget.remaining_amount ?? budget.amount ?? 0), 0),
    [budgets]
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
      start_year: currentYear,
      end_year: currentYear + 1,
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

  const handleSubmit = async (values) => {
    setSaving(true);
    const payload = {
      name: values.name?.trim(),
      start_year: values.start_year,
      end_year: values.end_year,
      amount: values.amount,
      budget_type: values.budget_type,
      budget_head: values.budget_head?.trim() || null,
      budget_category: values.budget_category?.trim() || null,
    };

    try {
      if (editingId) {
        await updateBudget(token, editingId, payload);
        message.success("Budget updated");
      } else {
        await createBudget(token, payload);
        message.success("Budget created");
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
    setPopoverOpenId(null);
    setEditingId(budget.id);
    setModalOpen(true);
    form.setFieldsValue({
      name: budget.name,
      start_year: budget.start_year,
      end_year: budget.end_year,
      amount: Number(budget.amount),
      budget_type: budget.budget_type,
      budget_head: budget.budget_head || "",
      budget_category: budget.budget_category || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (budget) => {
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

  const actionMenu = (budget) => (
    <Space direction="vertical" className="budget-menu">
      <Button type="text" icon={<EditOutlined />} disabled={!canUpdateBudgets} onClick={() => handleEdit(budget)}>
        Edit
      </Button>
      <Button
        danger
        type="text"
        icon={<DeleteOutlined />}
        disabled={!canDeleteBudgets}
        onClick={() => handleDelete(budget)}
      >
        Delete
      </Button>
    </Space>
  );

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
            Create budgets, tag them with head/category, and track remaining balance after approvals.
          </Text>
        </div>
        {canCreateBudgets ? (
          <Button type="primary" size="small" className="budget-add-button" onClick={openCreateModal}>
            Add Budget
          </Button>
        ) : null}
      </div>

      <Card className="budget-total-card" bordered={false}>
        <Text className="budget-total-label">Total Budget</Text>
        <Title level={3}>PKR {formatAmount(totalBudgetAmount)}</Title>
        <Text type="secondary">Remaining: PKR {formatAmount(totalRemainingAmount)}</Text>
      </Card>

      <div className="budget-grid-shell">
        {budgets.length === 0 && !loading ? (
          <Card className="budget-empty-card">
            <Empty description="No budgets added yet" />
          </Card>
        ) : (
          <div className="budget-grid">
            {budgets.map((budget) => (
              <Card key={budget.id} className="budget-card" loading={loading} bordered={false}>
                <div className="budget-card-top">
                  <div>
                    <Text className="budget-card-label">Budget</Text>
                    <Title level={4}>{budget.name}</Title>
                    <Text type="secondary" className="budget-card-years">
                      {budget.start_year} - {budget.end_year}
                    </Text>
                  </div>
                  {canManageBudgetActions ? (
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
                  ) : (
                    <Tag color="default">Read only</Tag>
                  )}
                </div>

                <div className="budget-amount-row">
                  <span>PKR {formatAmount(budget.amount)}</span>
                </div>

                <div className="budget-meta-row">
                  <div className="budget-meta-item">
                    <CalendarOutlined />
                    <Text>{budget.start_year} to {budget.end_year}</Text>
                  </div>
                  <Tag color={budget.budget_type === "supplementary" ? "orange" : "blue"}>
                    {titleCase(budget.budget_type)}
                  </Tag>
                </div>

                <div className="budget-meta-row">
                  <Tag color="cyan">{budget.budget_head || "No head"}</Tag>
                  <Tag color="geekblue">{budget.budget_category || "No category"}</Tag>
                </div>

                <div className="budget-meta-row">
                  <Text type="secondary">Remaining: PKR {formatAmount(budget.remaining_amount ?? budget.amount)}</Text>
                  <Text type="secondary">Spent: PKR {formatAmount(budget.spent_amount || 0)}</Text>
                </div>
              </Card>
            ))}
          </div>
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
            label="Start year"
            name="start_year"
            rules={[{ required: true, message: "Select the start year" }]}
          >
            <Select options={yearOptions} placeholder="Select start year" />
          </Form.Item>

          <Form.Item
            label="End year"
            name="end_year"
            dependencies={["start_year"]}
            rules={[
              { required: true, message: "Select the end year" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue("start_year") || value >= getFieldValue("start_year")) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("End year must be after or equal to start year"));
                },
              }),
            ]}
          >
            <Select options={endYearOptions} placeholder="Select end year" />
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

          <Form.Item label="Budget category" name="budget_category">
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
    </div>
  );
};

export default BudgetManagement;

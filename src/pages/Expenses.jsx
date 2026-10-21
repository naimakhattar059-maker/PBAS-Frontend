import { useCallback, useEffect, useState } from "react";
import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Space, Table, Tag, Typography, message } from "antd";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import AccessDenied from "../components/AccessDenied";
import { hasPermission } from "../utils/permissions";
import { listBudgetOptions } from "../api/budgets";
import { approveExpense, createExpense, listExpenses, rejectExpense } from "../api/expenses";

const Expenses = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [rows, setRows] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const canCreate = hasPermission(user, "create_expenses");
  const canApprove = hasPermission(user, "approve_expenses");
  const canView = hasPermission(user, "view_budgets");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [expenseData, budgetData] = await Promise.all([
        listExpenses(token),
        canCreate ? listBudgetOptions(token) : Promise.resolve({ budgets: [] }),
      ]);
      setRows(expenseData.expenses || []);
      setBudgets(budgetData.budgets || []);
    } catch (error) {
      message.error(error.message || "Could not load expenses");
    } finally {
      setLoading(false);
    }
  }, [token, canCreate]);

  useEffect(() => { if (token && canView) load(); }, [token, canView, load]);

  const submit = async (values) => {
    try {
      await createExpense(token, { ...values, incurred_on: values.incurred_on.format("YYYY-MM-DD") });
      form.resetFields();
      message.success("Expense sent to HOI for approval");
      load();
    } catch (error) { message.error(error.message); }
  };

  const decide = async (row, action) => {
    try {
      await (action === "approve" ? approveExpense(token, row.id) : rejectExpense(token, row.id));
      message.success(`Expense ${action === "approve" ? "approved" : "rejected"}`);
      load();
    } catch (error) { message.error(error.message); }
  };

  if (!canView) return <AccessDenied />;
  return <div className="budget-page">
    <Typography.Title level={2}>Expense Management</Typography.Title>
    {canCreate && <Card title="Record an expense" style={{ marginBottom: 20 }}>
      <Form form={form} layout="vertical" onFinish={submit} initialValues={{ incurred_on: dayjs() }}>
        <Form.Item label="Approved budget" name="budget_id" rules={[{ required: true }]}>
          <Select options={budgets.map((budget) => ({ value: budget.id, label: `${budget.name} — PKR ${budget.remaining_amount} remaining` }))} />
        </Form.Item>
        <Form.Item label="Title" name="title" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label="Amount (PKR)" name="amount" rules={[{ required: true }]}><InputNumber min={0.01} precision={2} style={{ width: "100%" }} /></Form.Item>
        <Form.Item label="Date" name="incurred_on" rules={[{ required: true }]}><DatePicker /></Form.Item>
        <Form.Item label="Description" name="description"><Input.TextArea rows={2} /></Form.Item>
        <Button type="primary" htmlType="submit">Submit expense</Button>
      </Form>
    </Card>}
    <Card title="Expenses">
      <Table rowKey="id" loading={loading} dataSource={rows} columns={[
        { title: "Title", dataIndex: "title" },
        { title: "Budget", dataIndex: "budget_name" },
        { title: "Amount", dataIndex: "amount", render: (value) => `PKR ${Number(value).toLocaleString()}` },
        { title: "Date", dataIndex: "incurred_on" },
        { title: "Status", dataIndex: "status", render: (value) => <Tag color={value === "approved" ? "green" : value === "rejected" ? "red" : "blue"}>{value}</Tag> },
        { title: "Action", render: (_, row) => canApprove && row.status === "submitted" ? <Space><Button onClick={() => decide(row, "approve")}>Approve</Button><Button danger onClick={() => decide(row, "reject")}>Reject</Button></Space> : null },
      ]} />
    </Card>
  </div>;
};

export default Expenses;

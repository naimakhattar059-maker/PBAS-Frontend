import { useEffect, useState } from "react";
import { Button, Card, Form, Input, InputNumber, Modal, Space, Table, Tag, Typography, message } from "antd";
import { useSelector } from "react-redux";
import {
  approveBudgetHead,
  createBudgetHead,
  listBudgetHeads,
  requestBudgetHeadChanges,
  requestNewBudgetHead,
  reviewBudgetHead,
  updateBudgetHead,
} from "../api/budgetHeads";
import AccessDenied from "../components/AccessDenied";
import { hasPermission } from "../utils/permissions";
import "./BudgetHeads.css";

const { Title, Text } = Typography;
const statusLabels = {
  pending_hoi: ["Awaiting HOI review", "gold"],
  changes_requested: ["Changes requested", "orange"],
  pending_admin: ["Awaiting Super Admin", "blue"],
  approved: ["Approved", "green"],
};

const BudgetHeads = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingHead, setEditingHead] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [correctionHead, setCorrectionHead] = useState(null);
  const [correctionNote, setCorrectionNote] = useState("");
  const [newHeadRequestOpen, setNewHeadRequestOpen] = useState(false);
  const [newHeadNote, setNewHeadNote] = useState("");
  const canView = hasPermission(user, "view_budget_heads");
  const canManage = hasPermission(user, "manage_budget_heads");
  const canReview = hasPermission(user, "review_budget_heads");
  const canApprove = hasPermission(user, "approve_budget_heads");

  const loadHeads = async () => {
    if (!token || !canView) return;
    setLoading(true);
    try {
      const payload = await listBudgetHeads(token);
      setHeads(payload.budget_heads || []);
    } catch (error) {
      message.error(error.message || "Could not load budget heads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeads();
    // The page loads again after each successful action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canView]);

  if (!canView) return <AccessDenied title="Budget Heads" />;

  const openForm = (head = null) => {
    setEditingHead(head);
    form.setFieldsValue(head ? {
      name: head.name,
      code: head.code,
      description: head.description,
      allocated_amount: head.allocated_amount,
    } : { name: "", code: "", description: "", allocated_amount: null });
    setFormOpen(true);
  };

  const saveHead = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingHead) {
        await updateBudgetHead(token, editingHead.id, values);
        message.success("Budget head sent back to HOI for review");
      } else {
        await createBudgetHead(token, values);
        message.success("Budget head sent to HOI for review");
      }
      setFormOpen(false);
      form.resetFields();
      await loadHeads();
    } catch (error) {
      if (!error?.errorFields) message.error(error.message || "Could not save budget head");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action, successMessage) => {
    try {
      setSaving(true);
      await action();
      message.success(successMessage);
      await loadHeads();
      return true;
    } catch (error) {
      message.error(error.message || "Could not update budget head");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: "Code", dataIndex: "code", key: "code" },
    { title: "Budget head", dataIndex: "name", key: "name" },
    { title: "Allocated amount", dataIndex: "allocated_amount", key: "allocated_amount", render: (amount) => `PKR ${Number(amount || 0).toLocaleString("en-PK")}` },
    { title: "Status", dataIndex: "status", key: "status", render: (status) => {
      const [label, color] = statusLabels[status] || [status, "default"];
      return <Tag color={color}>{label}</Tag>;
    } },
    { title: "Review note", dataIndex: "review_note", key: "review_note", render: (note) => note || "—" },
    { title: "Actions", key: "actions", render: (_, head) => (
      <Space wrap>
        {canManage && ["pending_hoi", "changes_requested"].includes(head.status) && (
          <Button onClick={() => openForm(head)}>Edit</Button>
        )}
        {canReview && head.status === "pending_hoi" && (
          <>
            <Button type="primary" loading={saving} onClick={() => runAction(() => reviewBudgetHead(token, head.id), "Sent to Super Admin for approval")}>Review and forward</Button>
            <Button onClick={() => { setCorrectionHead(head); setCorrectionNote(""); }}>Request changes</Button>
          </>
        )}
        {canApprove && head.status === "pending_admin" && (
          <Button type="primary" loading={saving} onClick={() => runAction(() => approveBudgetHead(token, head.id), "Budget head approved")}>Approve</Button>
        )}
        {!((canManage && ["pending_hoi", "changes_requested"].includes(head.status)) ||
          (canReview && head.status === "pending_hoi") ||
          (canApprove && head.status === "pending_admin")) && "—"}
      </Space>
    ) },
  ];

  return (
    <div className="budget-heads-page">
      <div className="budget-heads-header">
        <div>
          <Title level={2}>Budget Heads</Title>
          <Text type="secondary">Admin Officer allocates funds, HOI reviews, and Super Admin gives final approval.</Text>
        </div>
        <Space>
          {canReview && <Button onClick={() => { setNewHeadNote(""); setNewHeadRequestOpen(true); }}>Request new head</Button>}
          {canManage && <Button type="primary" onClick={() => openForm()}>Add budget head</Button>}
        </Space>
      </div>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={heads} loading={loading} scroll={{ x: 900 }} />
      </Card>

      <Modal title={editingHead ? "Update budget head" : "Add budget head"} open={formOpen} onCancel={() => setFormOpen(false)} onOk={saveHead} confirmLoading={saving} okText="Send to HOI" destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Budget head name" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="Code" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
          <Form.Item name="allocated_amount" label="Allocated amount (PKR)" rules={[{ required: true, message: "Enter an allocated amount" }]}><InputNumber min={0} precision={2} className="budget-head-amount" /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Request changes from Admin Officer" open={Boolean(correctionHead)} onCancel={() => setCorrectionHead(null)} onOk={async () => {
        if (!correctionNote.trim()) return message.error("Enter the correction needed");
        const saved = await runAction(() => requestBudgetHeadChanges(token, correctionHead.id, correctionNote.trim()), "Correction request sent to Admin Officer");
        if (saved) setCorrectionHead(null);
      }} confirmLoading={saving} okText="Send request">
        <Input.TextArea rows={4} value={correctionNote} onChange={(event) => setCorrectionNote(event.target.value)} placeholder="Describe what needs to be corrected or which new head is needed" />
      </Modal>

      <Modal title="Request new budget head" open={newHeadRequestOpen} onCancel={() => setNewHeadRequestOpen(false)} onOk={async () => {
        if (!newHeadNote.trim()) return message.error("Describe the new budget head needed");
        const saved = await runAction(() => requestNewBudgetHead(token, newHeadNote.trim()), "Request sent to Admin Officer");
        if (saved) setNewHeadRequestOpen(false);
      }} confirmLoading={saving} okText="Send request">
        <Input.TextArea rows={4} value={newHeadNote} onChange={(event) => setNewHeadNote(event.target.value)} placeholder="Describe the new head and why it is needed" />
      </Modal>
    </div>
  );
};

export default BudgetHeads;

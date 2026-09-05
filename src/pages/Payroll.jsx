import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
  Empty,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import AccessDenied from "../components/AccessDenied";
import { hasAnyPermission, hasPermission } from "../utils/permissions";
import {
  approvePayrollRun,
  createPayrollRun,
  deletePayrollRun,
  generatePayrollRun,
  listPayrollRuns,
  rejectPayrollRun,
  updatePayrollRun,
} from "../api/payrolls";
import {
  createPayrollStaff,
  updatePayrollStaff,
} from "../api/payrollStaffs";
import { updatePayrollRunItem } from "../api/payrollRunItems";
import "./Payroll.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((month) => ({ value: month, label: month }));

const payrollAllowanceFields = [
  { name: "rank_pay", label: "Rank pay" },
  { name: "personal_pay", label: "Personal pay" },
  { name: "hra", label: "House rent allowance (45%)" },
  { name: "conveyance", label: "Conveyance allowance (C.A 2005)" },
  { name: "medical", label: "Medical allowance (15%)" },
  { name: "special_allowance", label: "Special allowance" },
  { name: "orderly_allowance", label: "Orderly allowance" },
  { name: "technical_allowance", label: "Technical allowance" },
  { name: "integrated_allowance", label: "Integrated allowance" },
  { name: "adhoc_2022_allowance", label: "Adhoc relief allowance 2022 (15%)" },
  { name: "adhoc_2023_allowance", label: "Adhoc relief allowance 2023 (30%)" },
  { name: "adhoc_2024_allowance", label: "Adhoc relief allowance 2024 (25%)" },
  { name: "adhoc_2026_allowance", label: "Adhoc relief allowance 2026 (7%)" },
  { name: "dra_2022_allowance", label: "DRA 2022 (15%)" },
  { name: "dra_2023_allowance", label: "DRA 2023 (25%)" },
  { name: "dra_2024_allowance", label: "DRA 2024 (20%)" },
  { name: "dra_2025_allowance", label: "DRA 2025 (30%)" },
  { name: "dra_2026_allowance", label: "DRA 2026 (15%)" },
  { name: "other_allowance_amount", label: "Other allowance amount" },
  { name: "teaching_allowance", label: "Teaching allowance" },
];

const configurableAllowanceFields = [
  { name: "adhoc_allowance", label: "Other adhoc allowance" },
  { name: "dra_allowance", label: "Other DRA allowance" },
];

const totalPayrollAllowanceFields = [...payrollAllowanceFields, ...configurableAllowanceFields];

const otherAllowanceOptions = [
  { value: "phd_allowance", label: "PHD allowance" },
  { value: "mphil_allowance", label: "MPhil allowance" },
  { value: "entertainment_allowance", label: "Entertainment allowance" },
];

const allowanceYears = Array.from({ length: 12 }, (_, index) => 2020 + index);
const allowancePercentages = [5, 7, 10, 15, 20, 25, 30, 35, 45, 50];
const allowanceConfigOptions = allowanceYears.flatMap((year) =>
  allowancePercentages.map((percentage) => ({
    value: `${year}|${percentage}`,
    label: `${year} - ${percentage}%`,
  }))
);

const buildAllowanceConfig = (year, percentage) =>
  year && percentage != null && percentage !== "" ? `${year}|${Number(percentage)}` : undefined;

const parseAllowanceConfig = (config) => {
  const [year, percentage] = String(config || "").split("|");
  return {
    year: year ? Number(year) : null,
    percentage: percentage ? Number(percentage) : null,
  };
};

const allowanceConfigLabel = (config) => {
  const { year, percentage } = parseAllowanceConfig(config);
  return year && percentage != null ? `${year} - ${percentage}%` : "";
};

const payrollAllowanceDefaults = totalPayrollAllowanceFields.reduce(
  (defaults, field) => ({ ...defaults, [field.name]: 0 }),
  {}
);

const paymentStatusColors = {
  pending: "default",
  partial: "gold",
  paid: "green",
  hold: "red",
};

const runStatusColors = {
  draft: "default",
  generated: "processing",
  approved: "blue",
  paid: "green",
  rejected: "red",
};

const toTitle = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const money = (value) => `PKR ${new Intl.NumberFormat("en-PK").format(Number(value || 0))}`;

const currentYear = new Date().getFullYear();
const payrollAllocationStorageKey = "payrollAnnualAllocationsV1";
const payrollArchiveStorageKey = "payrollArchivedYearsV1";

const readAnnualAllocations = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(payrollAllocationStorageKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const readArchivedYears = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(payrollArchiveStorageKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const getRankDeduction = (bps, basicPay = 0) => {
  const rank = Number(bps || 0);
  const basic = Number(basicPay || 0);

  if (rank >= 20) return Math.round(basic * 0.09 + 4500);
  if (rank >= 17) return Math.round(basic * 0.07 + 3000);
  if (rank >= 11) return Math.round(basic * 0.045 + 1800);
  if (rank >= 5) return Math.round(basic * 0.025 + 900);
  if (rank >= 1) return Math.round(basic * 0.01 + 450);
  return 0;
};

const isArchivedYear = (year, archivedYears = {}) => Boolean(archivedYears[Number(year)]);

const runPaidTotal = (run) => {
  const itemPaidTotal = (run.items || []).reduce((sum, item) => sum + Number(item.paid_amount || 0), 0);

  if (itemPaidTotal > 0) return itemPaidTotal;
  if (run.paid_amount) return Number(run.paid_amount || 0);
  return run.status === "paid" ? Number(run.total_amount || 0) : 0;
};

const payrollBasicPay = (record) => Number(record?.basic_pay || record?.monthly_basic_pay || 0);
const payrollAllowanceTotal = (record) =>
  totalPayrollAllowanceFields.reduce(
    (sum, field) => sum + Number(record?.[field.name] || record?.allowance_breakdown?.[field.name] || 0),
    0
  );
const payrollDeductionTotal = (record) =>
  Number(record?.deduction_amount || record?.deductions || getRankDeduction(record?.bps, payrollBasicPay(record)));
const payrollGrossPay = (record) => Number(record?.gross_pay || payrollBasicPay(record) + payrollAllowanceTotal(record));
const payrollNetPay = (record) =>
  Number(record?.net_pay || Math.max(payrollGrossPay(record) - payrollDeductionTotal(record), 0));
const payrollEstimateFourMonths = (record) => Number(record?.estimate_actual_four_months || payrollBasicPay(record) * 4);
const payrollEstimateEightMonths = (record) =>
  Number(record?.estimate_anticipated_eight_months || payrollBasicPay(record) * 8);
const payrollEstimateIncrementAmount = (record) =>
  Number(record?.estimate_increment_amount || Number(record?.increment_rate || 0) * 7);
const payrollTotalRevisedEstimate = (record) =>
  payrollEstimateFourMonths(record) + payrollEstimateEightMonths(record) + payrollEstimateIncrementAmount(record);

const estimateGroupLabel = (value) => {
  if (value === "gazetted") return "Pay of Officers";
  if (value === "non_gazetted") return "Pay of Others";
  return "Regular Payroll";
};

const comparePayrollRank = (a, b) => {
  const groupOrder = { gazetted: 1, non_gazetted: 2 };
  const aGroup = groupOrder[a.estimate_pay_group] || 3;
  const bGroup = groupOrder[b.estimate_pay_group] || 3;

  if (aGroup !== bGroup) return aGroup - bGroup;
  if (Number(b.bps || 0) !== Number(a.bps || 0)) return Number(b.bps || 0) - Number(a.bps || 0);
  return String(a.full_name || "").localeCompare(String(b.full_name || ""));
};

const fiscalYearLabel = (year) => {
  const startYear = Number(year);
  return startYear ? `${startYear}-${startYear + 1}` : "—";
};

const Payroll = () => {
  const { token, user: currentUser } = useSelector((state) => state.auth);
  const [runForm] = Form.useForm();
  const [staffForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const watchedStaffValues = Form.useWatch([], staffForm) || {};
  const watchedMonthlyBasicPay = watchedStaffValues.monthly_basic_pay || 0;
  const watchedDeductionAmount = watchedStaffValues.deduction_amount || 0;
  const watchedBps = watchedStaffValues.bps || 0;
  const watchedEstimateYear = watchedStaffValues.estimate_year || currentYear;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [summary, setSummary] = useState({});
  const [annualAllocations, setAnnualAllocations] = useState(readAnnualAllocations);
  const [archivedPayrollYears, setArchivedPayrollYears] = useState(readArchivedYears);
  const [payrollMeta, setPayrollMeta] = useState({
    staff_categories: [],
    staff_category_counts: {},
    employment_types: [],
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [discardRunModalOpen, setDiscardRunModalOpen] = useState(false);
  const [discardStaffModalOpen, setDiscardStaffModalOpen] = useState(false);
  const [editingRunId, setEditingRunId] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [selectedRunSnapshot, setSelectedRunSnapshot] = useState(null);
  const [selectedRunRecord, setSelectedRunRecord] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [selectedStaffSnapshot, setSelectedStaffSnapshot] = useState(null);
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);

  const canViewPayroll = hasAnyPermission(currentUser, ["view_payroll"]);
  const canManagePayroll = hasPermission(currentUser, "generate_payroll");
  const canApprovePayroll = hasPermission(currentUser, "approve_payroll");

  const selectedRun = useMemo(
    () =>
      payrollRuns.find((run) => String(run.id) === String(selectedRunId)) ||
      (selectedRunSnapshot && String(selectedRunSnapshot.id) === String(selectedRunId)
        ? selectedRunSnapshot
        : null) ||
      selectedRunRecord ||
      null,
    [payrollRuns, selectedRunId, selectedRunSnapshot, selectedRunRecord]
  );
  const selectedRunArchived = selectedRun ? isArchivedYear(selectedRun.year, archivedPayrollYears) : false;
  const selectedStaff =
    staffMembers.find((staff) => String(staff.id) === String(selectedStaffId)) ||
    (selectedStaffSnapshot && String(selectedStaffSnapshot.id) === String(selectedStaffId)
      ? selectedStaffSnapshot
      : null);
  const payrollYears = useMemo(
    () =>
      Array.from(new Set([...payrollRuns.map((run) => Number(run.year)).filter(Boolean), currentYear]))
        .sort((a, b) => b - a),
    [payrollRuns]
  );

  const annualPayrollSummaries = useMemo(
    () =>
      payrollYears.map((year) => {
        const runs = payrollRuns.filter((run) => Number(run.year) === Number(year));
        const allocated = Number(annualAllocations[year] || 0);
        const utilized = runs.reduce((sum, run) => sum + runPaidTotal(run), 0);
        const committed = runs.reduce((sum, run) => sum + Number(run.total_amount || 0), 0);
        const remaining = Math.max(allocated - utilized, 0);
        const archived = isArchivedYear(year, archivedPayrollYears);
        const surrendered = Number(archivedPayrollYears[year]?.surrendered ?? remaining);

        return {
          year,
          allocated,
          utilized,
          committed,
          remaining,
          surrendered: archived ? surrendered : 0,
          archived,
          runs: runs.length,
        };
      }),
    [annualAllocations, archivedPayrollYears, payrollRuns, payrollYears]
  );
  const rankedStaffMembers = useMemo(() => [...staffMembers].sort(comparePayrollRank), [staffMembers]);

  const activeAnnualSummary =
    annualPayrollSummaries.find((item) => item.year === currentYear) || {
      allocated: 0,
      utilized: 0,
      remaining: 0,
      surrendered: 0,
      archived: false,
    };

  const saveAnnualAllocation = (year, value) => {
    if (isArchivedYear(year, archivedPayrollYears)) {
      message.error("Archived payroll years cannot be changed.");
      return;
    }

    const next = { ...annualAllocations, [year]: Number(value || 0) };
    setAnnualAllocations(next);
    localStorage.setItem(payrollAllocationStorageKey, JSON.stringify(next));
  };

  const archivePayrollYear = (record) => {
    Modal.confirm({
      title: `Archive payroll year ${record.year}?`,
      content: `This will lock all payroll data for ${record.year}. The remaining amount ${money(record.remaining)} will be surrendered and no further deductions or edits will be allowed.`,
      okText: "Archive year",
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => {
        const next = {
          ...archivedPayrollYears,
          [record.year]: {
            surrendered: Number(record.remaining || 0),
            archived_at: new Date().toISOString(),
          },
        };
        setArchivedPayrollYears(next);
        localStorage.setItem(payrollArchiveStorageKey, JSON.stringify(next));
        message.success(`${record.year} payroll archived`);
      },
    });
  };

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const payload = await listPayrollRuns(token);
      setPayrollRuns(payload.payroll_runs || []);
      setSummary(payload.summary || {});
      setPayrollMeta(
        payload.meta || {
          staff_categories: [],
          staff_category_counts: {},
          employment_types: [],
        }
      );
      setStaffMembers(payload.staff_members || []);
      if (!selectedRunId && (payload.payroll_runs || []).length > 0) {
        setSelectedRunId(payload.payroll_runs[0].id);
        setSelectedRunSnapshot(payload.payroll_runs[0]);
        setSelectedRunRecord(payload.payroll_runs[0]);
      }
    } catch (err) {
      message.error(err.message || "Could not load payroll data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && canViewPayroll) {
      loadPayrollData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canViewPayroll]);

  useEffect(() => {
    runForm.setFieldsValue({
      month: monthOptions[new Date().getMonth()].value,
      year: new Date().getFullYear(),
      notes: "",
      staff_category: "non_teaching",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    staffForm.setFieldsValue({
      active: true,
      monthly_basic_pay: 0,
      ...payrollAllowanceDefaults,
      other_allowance_type: undefined,
      adhoc_allowance_config: undefined,
      dra_allowance_config: undefined,
      deduction_amount: 0,
      increment_rate: 0,
      estimate_year: 2025,
      estimate_pay_group: undefined,
      estimate_actual_four_months: 0,
      estimate_anticipated_eight_months: 0,
      estimate_increment_amount: 0,
      employment_type: "regular",
      staff_category: "non_teaching",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeRunModal = () => {
    if (runForm.isFieldsTouched()) {
      setDiscardRunModalOpen(true);
      return;
    }
    setRunModalOpen(false);
    setEditingRunId(null);
    runForm.resetFields();
  };

  const closeStaffModal = () => {
    if (staffForm.isFieldsTouched()) {
      setDiscardStaffModalOpen(true);
      return;
    }
    setStaffModalOpen(false);
    setEditingStaffId(null);
    staffForm.resetFields();
  };

  const resetRunForm = () => {
    const defaultYear = new Date().getFullYear();
    setEditingRunId(null);
    runForm.resetFields();
    runForm.setFieldsValue({
      month: monthOptions[new Date().getMonth()].value,
      year: defaultYear,
      notes: "",
      government_allocation: annualAllocations[defaultYear] || 0,
    });
  };

  const resetStaffForm = () => {
    setEditingStaffId(null);
    staffForm.resetFields();
    staffForm.setFieldsValue({
      active: true,
      monthly_basic_pay: 0,
      ...payrollAllowanceDefaults,
      other_allowance_type: undefined,
      adhoc_allowance_config: undefined,
      dra_allowance_config: undefined,
      deduction_amount: 0,
      increment_rate: 0,
      estimate_year: 2025,
      estimate_pay_group: undefined,
      estimate_actual_four_months: 0,
      estimate_anticipated_eight_months: 0,
      estimate_increment_amount: 0,
      employment_type: "regular",
      staff_category: "non_teaching",
    });
  };

  const openNewRun = () => {
    resetRunForm();
    setRunModalOpen(true);
  };

  const openEditRun = (record) => {
    if (isArchivedYear(record.year, archivedPayrollYears)) {
      message.info("This payroll year is archived and cannot be changed.");
      return;
    }

    setEditingRunId(record.id);
    setSelectedRunId(record.id);
    setSelectedRunSnapshot(record);
    setSelectedRunRecord(record);
    runForm.setFieldsValue({
      month: record.month,
      year: record.year,
      notes: record.notes,
      government_allocation: annualAllocations[record.year] || 0,
    });
    setRunModalOpen(true);
  };

  const openRunDetails = (record) => {
    setSelectedRunId(record.id);
    setSelectedRunSnapshot(record);
    setSelectedRunRecord(record);
    setDrawerOpen(false);
    setTimeout(() => setDrawerOpen(true), 0);
  };

  const openNewStaff = () => {
    resetStaffForm();
    setStaffModalOpen(true);
  };

  const openEditStaff = (record) => {
    setEditingStaffId(record.id);
    staffForm.setFieldsValue({
      ...record,
      active: Boolean(record.active),
      adhoc_allowance_config: buildAllowanceConfig(record.adhoc_allowance_year, record.adhoc_allowance_percentage),
      dra_allowance_config: buildAllowanceConfig(record.dra_allowance_year, record.dra_allowance_percentage),
    });
    setStaffModalOpen(true);
  };

  const openStaffDetails = (record) => {
    setSelectedStaffId(record.id);
    setSelectedStaffSnapshot(record);
    setStaffDrawerOpen(true);
  };

  const submitRun = async (values) => {
    if (isArchivedYear(values.year, archivedPayrollYears)) {
      message.error("Archived payroll years cannot be changed.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        month: values.month,
        year: values.year,
        notes: values.notes?.trim(),
      };

      if (editingRunId) {
        await updatePayrollRun(token, editingRunId, payload);
        message.success("Payroll cycle updated");
      } else {
        await createPayrollRun(token, payload);
        message.success("Payroll cycle created");
      }

      if (values.government_allocation != null) {
        saveAnnualAllocation(values.year, values.government_allocation);
      }

      setRunModalOpen(false);
      setDiscardRunModalOpen(false);
      resetRunForm();
      await loadPayrollData();
    } catch (err) {
      message.error(err.message || "Could not save payroll cycle");
    } finally {
      setSaving(false);
    }
  };

  const submitStaff = async (values) => {
    setSaving(true);
    try {
      const adhocConfig = parseAllowanceConfig(values.adhoc_allowance_config);
      const draConfig = parseAllowanceConfig(values.dra_allowance_config);
      const existingStaff = editingStaffId
        ? staffMembers.find((staff) => String(staff.id) === String(editingStaffId))
        : null;
      const generatedPersonnelNo =
        values.personnel_no ||
        existingStaff?.personnel_no ||
        `PR-${Date.now().toString().slice(-8)}`;
      const payload = {
        ...values,
        father_name: values.father_name || existingStaff?.father_name || "",
        personnel_no: generatedPersonnelNo,
        post_description: values.post_description || existingStaff?.post_description || "Staff",
        department: values.department || existingStaff?.department || "General",
        employment_type: values.employment_type || existingStaff?.employment_type || "regular",
        staff_category: values.staff_category || existingStaff?.staff_category || "non_teaching",
        gender: values.gender || existingStaff?.gender || "",
        contact_number: values.contact_number || existingStaff?.contact_number || "",
        email: values.email || existingStaff?.email || "",
        bank_name: values.bank_name || existingStaff?.bank_name || "",
        account_number: values.account_number || existingStaff?.account_number || "",
        active: Boolean(values.active),
        monthly_basic_pay: values.monthly_basic_pay || 0,
        ...totalPayrollAllowanceFields.reduce((payValues, field) => ({ ...payValues, [field.name]: values[field.name] || 0 }), {}),
        adhoc_allowance_year: adhocConfig.year,
        adhoc_allowance_percentage: adhocConfig.percentage,
        dra_allowance_year: draConfig.year,
        dra_allowance_percentage: draConfig.percentage,
        other_allowance_type: values.other_allowance_type || "",
        deduction_amount: values.deduction_amount || 0,
        increment_rate: values.increment_rate || 0,
        estimate_year: values.estimate_year || null,
        estimate_pay_group: values.estimate_pay_group || "",
        estimate_actual_four_months: values.estimate_actual_four_months || 0,
        estimate_anticipated_eight_months: values.estimate_anticipated_eight_months || 0,
        estimate_increment_amount: values.estimate_increment_amount || 0,
      };

      if (editingStaffId) {
        await updatePayrollStaff(token, editingStaffId, payload);
        message.success("Payroll staff updated");
      } else {
        await createPayrollStaff(token, payload);
        message.success("Payroll staff created");
      }

      setStaffModalOpen(false);
      setDiscardStaffModalOpen(false);
      resetStaffForm();
      await loadPayrollData();
    } catch (err) {
      message.error(err.message || "Could not save payroll staff");
    } finally {
      setSaving(false);
    }
  };

  const runPayrollAction = async (action, id, note, successMessage = "Payroll updated") => {
    setSaving(true);
    try {
      await action(token, id, note);
      await loadPayrollData();
      message.success(successMessage);
    } catch (err) {
      message.error(err.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const submitPayment = async (values) => {
    if (!selectedItem) {
      return;
    }

    if (selectedRunArchived) {
      message.error("Archived payroll years cannot be changed.");
      return;
    }

    setSaving(true);
    try {
      await updatePayrollRunItem(token, selectedItem.id, {
        payment_status: values.payment_status,
        paid_amount: values.paid_amount,
        payment_date: values.payment_date,
        payment_reference: values.payment_reference?.trim(),
        payment_note: values.payment_note?.trim(),
      });
      message.success("Payment status updated");
      setPaymentModalOpen(false);
      setSelectedItem(null);
      await loadPayrollData();
      setDrawerOpen(true);
    } catch (err) {
      message.error(err.message || "Could not update payment");
    } finally {
      setSaving(false);
    }
  };

  const applyRankDeductions = () => {
    const nextDeduction = getRankDeduction(watchedBps, watchedMonthlyBasicPay);
    staffForm.setFieldValue("deduction_amount", nextDeduction);
    message.success("Rank-based deduction applied");
  };

  const confirmToggleStaffActive = (record) => {
    Modal.confirm({
      title: record.active ? "Deactivate payroll staff?" : "Activate payroll staff?",
      content: record.active
        ? "Staff data will remain saved in the system, but this staff member will not be included in active payroll processing."
        : "This staff member will become active again and can be included in payroll processing.",
      okText: record.active ? "Deactivate" : "Activate",
      okButtonProps: { danger: record.active },
      centered: true,
      onOk: async () => {
        await runPayrollAction(
          updatePayrollStaff,
          record.id,
          { active: !record.active },
          record.active ? "Payroll staff deactivated" : "Payroll staff activated"
        );
      },
    });
  };

  if (!canViewPayroll) {
    return <AccessDenied title="Payroll Management" />;
  }

  const cycleActionItems = (record) => [
    {
      key: "view",
      label: "View details",
      icon: <EyeOutlined />,
      onClick: () => openRunDetails(record),
    },
    {
      key: "edit",
      label: "Edit cycle",
      icon: <EditOutlined />,
      disabled: isArchivedYear(record.year, archivedPayrollYears) || record.status !== "draft" || !canManagePayroll,
      onClick: () => openEditRun(record),
    },
    {
      key: "generate",
      label: "Generate cycle",
      icon: <DollarOutlined />,
      disabled: isArchivedYear(record.year, archivedPayrollYears) || record.status !== "draft" || !canManagePayroll,
      onClick: () => runPayrollAction(generatePayrollRun, record.id),
    },
    {
      key: "approve",
      label: "Approve cycle",
      icon: <CheckOutlined />,
      disabled: isArchivedYear(record.year, archivedPayrollYears) || record.status !== "generated" || !canApprovePayroll,
      onClick: () =>
        Modal.confirm({
          title: "Approve payroll cycle?",
          okText: "Approve",
          centered: true,
          onOk: () => runPayrollAction(approvePayrollRun, record.id, "Approved by HOI"),
        }),
    },
    {
      key: "reject",
      label: "Reject cycle",
      danger: true,
      disabled: isArchivedYear(record.year, archivedPayrollYears) || !canApprovePayroll || !["draft", "generated"].includes(record.status),
      onClick: () =>
        Modal.confirm({
          title: "Reject payroll cycle?",
          okText: "Reject",
          okButtonProps: { danger: true },
          centered: true,
          onOk: () => runPayrollAction(rejectPayrollRun, record.id, "Rejected by reviewer"),
        }),
    },
    {
      key: "delete",
      label: "Delete cycle",
      danger: true,
      icon: <DeleteOutlined />,
      disabled: isArchivedYear(record.year, archivedPayrollYears) || record.status !== "draft" || !canManagePayroll,
      onClick: () =>
        Modal.confirm({
          title: "Delete payroll cycle?",
          okText: "Delete",
          okButtonProps: { danger: true },
          centered: true,
          onOk: () => runPayrollAction(deletePayrollRun, record.id),
        }),
    },
  ];

  const staffActionItems = (record) => [
    {
      key: "edit",
      label: "Edit staff",
      icon: <EditOutlined />,
      onClick: () => openEditStaff(record),
    },
    {
      key: record.active ? "deactivate" : "activate",
      label: record.active ? "Deactivate staff" : "Activate staff",
      danger: record.active,
      icon: record.active ? <DeleteOutlined /> : <CheckOutlined />,
      onClick: () => confirmToggleStaffActive(record),
    },
  ];

  const payrollColumns = [
    { title: "Month", dataIndex: "month", key: "month" },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      render: (year) => (
        <Space size={6}>
          <span>{year}</span>
          {isArchivedYear(year, archivedPayrollYears) ? <Tag color="default">Archived</Tag> : null}
        </Space>
      ),
    },
    { title: "Employees", dataIndex: "employee_count", key: "employee_count" },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (value) => money(value),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={runStatusColors[status] || "default"}>{toTitle(status)}</Tag>,
    },
    {
      title: "Generated By",
      dataIndex: "generated_by",
      key: "generated_by",
      render: (value) => value?.username || "—",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{
            items: cycleActionItems(record),
            onClick: ({ key }) => {
              if (key === "view") {
                openRunDetails(record);
              }
            },
          }}
        >
          <Button type="text" icon={<MoreOutlined />} onMouseDown={(event) => event.preventDefault()} />
        </Dropdown>
      ),
    },
  ];

  const staffColumns = [
    {
      title: "Employee",
      key: "employee",
      render: (_, record) => (
        <div className="payroll-cell-stack">
          <Text className="payroll-strong">{record.full_name}</Text>
          <Text type="secondary">{record.personnel_no}</Text>
        </div>
      ),
    },
    {
      title: "Rank / BPS",
      dataIndex: "bps",
      key: "bps",
      sorter: (a, b) => Number(a.bps || 0) - Number(b.bps || 0),
      render: (value) => value || "—",
    },
    {
      title: "Estimate Group",
      key: "estimate_group",
      render: (_, record) => (
        <div className="payroll-cell-stack">
          <Tag color={record.estimate_pay_group === "gazetted" ? "blue" : record.estimate_pay_group === "non_gazetted" ? "purple" : "default"}>
            {estimateGroupLabel(record.estimate_pay_group)}
          </Tag>
          <Text type="secondary">{record.estimate_year ? fiscalYearLabel(record.estimate_year) : "No estimate year"}</Text>
        </div>
      ),
    },
    {
      title: "Basic Pay",
      key: "basic_pay",
      render: (_, record) => money(payrollBasicPay(record)),
    },
    {
      title: "4 Months",
      key: "estimate_actual_four_months",
      render: (_, record) => money(payrollEstimateFourMonths(record)),
    },
    {
      title: "8 Months + Increment",
      key: "estimate_eight_months",
      render: (_, record) => (
        <div className="payroll-cell-stack">
          <Text>{money(payrollEstimateEightMonths(record) + payrollEstimateIncrementAmount(record))}</Text>
          <Text type="secondary">Increment {money(payrollEstimateIncrementAmount(record))}</Text>
        </div>
      ),
    },
    {
      title: "Total Revised 2025-2026",
      key: "total_revised_estimate",
      render: (_, record) => money(payrollTotalRevisedEstimate(record)),
    },
    {
      title: "Allowances",
      key: "allowances",
      render: (_, record) => (
        <div className="payroll-cell-stack">
          <Text>{money(payrollAllowanceTotal(record))}</Text>
          <Text type="secondary">{toTitle(record.staff_category)}</Text>
        </div>
      ),
    },
    {
      title: "Gross Pay",
      key: "gross_pay",
      render: (_, record) => money(payrollGrossPay(record)),
    },
    {
      title: "Deductions",
      key: "deductions",
      render: (_, record) => (
        <div className="payroll-cell-stack">
          <Text>{money(payrollDeductionTotal(record))}</Text>
          <Text type="secondary">Rank based</Text>
        </div>
      ),
    },
    {
      title: "Net Pay",
      key: "net_pay",
      render: (_, record) => money(payrollNetPay(record)),
    },
    {
      title: "Active",
      dataIndex: "active",
      key: "active",
      render: (value) => <Tag color={value ? "green" : "red"}>{value ? "Active" : "Inactive"}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{ items: staffActionItems(record) }}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.preventDefault()}
          />
        </Dropdown>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: "Staff",
      key: "staff",
      render: (_, record) => (
        <div className="payroll-cell-stack">
          <Text className="payroll-strong">{record.full_name}</Text>
          <Text type="secondary">{record.department}</Text>
          <Text type="secondary">{toTitle(record.staff_category)}</Text>
        </div>
      ),
    },
    {
      title: "Rank / BPS",
      dataIndex: "bps",
      key: "bps",
      render: (value) => value || "—",
    },
    {
      title: "Basic Pay",
      key: "basic_pay",
      render: (_, record) => money(payrollBasicPay(record)),
    },
    {
      title: "Allowances",
      key: "allowances",
      render: (_, record) => money(payrollAllowanceTotal(record)),
    },
    {
      title: "Deductions",
      key: "deductions",
      render: (_, record) => money(payrollDeductionTotal(record)),
    },
    {
      title: "Net Pay",
      key: "net_pay",
      render: (_, record) => money(payrollNetPay(record)),
    },
    {
      title: "Paid Amount",
      key: "paid_amount",
      render: (_, record) => money(record.paid_amount),
    },
    {
      title: "Payment Status",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (value) => <Tag color={paymentStatusColors[value] || "default"}>{toTitle(value)}</Tag>,
    },
    {
      title: "Payment Date",
      dataIndex: "payment_date",
      key: "payment_date",
      render: (value) => value || "—",
    },
    {
      title: "Reference",
      dataIndex: "payment_reference",
      key: "payment_reference",
      render: (value) => value || "—",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          size="small"
          disabled={selectedRunArchived || !canManagePayroll || !["approved", "paid"].includes(selectedRun?.status)}
          onClick={() => {
            setSelectedItem(record);
            paymentForm.setFieldsValue({
              payment_status: record.payment_status || "paid",
              paid_amount: record.paid_amount || record.net_pay,
              payment_date: record.payment_date || new Date().toISOString().slice(0, 10),
              payment_reference: record.payment_reference,
              payment_note: record.payment_note,
            });
            setPaymentModalOpen(true);
          }}
        >
          Record payment
        </Button>
      ),
    },
  ];

  const overviewCards = [
    { label: "Staff Members", value: summary.staff_count ?? staffMembers.length, color: "cyan" },
    { label: "Active Staff", value: summary.active_staff_count ?? staffMembers.filter((item) => item.active).length, color: "green" },
    { label: "Government Allocation", value: money(activeAnnualSummary.allocated), color: "blue" },
    { label: "Payroll Utilized", value: money(activeAnnualSummary.utilized || summary.total_paid_amount || 0), color: "gold" },
    { label: "Remaining Payroll", value: money(activeAnnualSummary.remaining), color: "default" },
    { label: "Surrendered", value: money(activeAnnualSummary.surrendered), color: "purple" },
  ];

  const staffCategoryBreakdown = Object.entries(payrollMeta.staff_category_counts || {}).filter(([, count]) => Number(count) > 0);
  const annualPayrollColumns = [
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      render: (year, record) => (
        <Space>
          <Text strong>{year}</Text>
          {record.archived ? <Tag color="default">Archived</Tag> : <Tag color="green">Active</Tag>}
        </Space>
      ),
    },
    {
      title: "Govt Allocation",
      dataIndex: "allocated",
      key: "allocated",
      render: (value, record) =>
        record.archived ? (
          money(value)
        ) : (
          <InputNumber
            min={0}
            precision={2}
            value={value}
            onChange={(nextValue) => saveAnnualAllocation(record.year, nextValue)}
            style={{ width: 180 }}
          />
        ),
    },
    { title: "Committed Payroll", dataIndex: "committed", key: "committed", render: money },
    { title: "Utilized/Paid", dataIndex: "utilized", key: "utilized", render: money },
    { title: "Remaining", dataIndex: "remaining", key: "remaining", render: money },
    {
      title: "Year-end Surrender",
      dataIndex: "surrendered",
      key: "surrendered",
      render: (value, record) => (
        <div className="payroll-cell-stack">
          <Text strong>{money(value)}</Text>
          {record.archived ? <Text type="secondary">Locked, no deductions allowed</Text> : <Text type="secondary">Calculated at year end</Text>}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.archived ? (
          <Tag color="default">Locked</Tag>
        ) : (
          <Button
            size="small"
            danger
            disabled={!canManagePayroll}
            onClick={() => archivePayrollYear(record)}
          >
            Archive year
          </Button>
        ),
    },
  ];

  const allowanceTotal = totalPayrollAllowanceFields.reduce(
    (sum, field) => sum + Number(watchedStaffValues[field.name] || 0),
    0
  );
  const basicPay = Number(watchedMonthlyBasicPay || 0);
  const deductions = Number(watchedDeductionAmount || 0);
  const suggestedRankDeduction = getRankDeduction(watchedBps, basicPay);
  const grossPay = basicPay + allowanceTotal;
  const netPay = Math.max(grossPay - deductions, 0);

  const overviewTab = (
    <div className="payroll-stack">
      <Row gutter={[14, 14]}>
        {overviewCards.map((card) => (
          <Col xs={12} lg={8} key={card.label}>
            <Card bordered={false} className={`payroll-summary-card payroll-summary-${card.color}`}>
              <Text type="secondary" className="payroll-summary-label">
                {card.label}
              </Text>
              <Title level={3} className="payroll-summary-value">
                {card.value}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="payroll-panel payroll-panel-annual" title="Annual payroll allocation and archive">
        <Table
          className="payroll-table"
          columns={annualPayrollColumns}
          dataSource={annualPayrollSummaries}
          rowKey="year"
          pagination={false}
          size="small"
          scroll={{ x: 980 }}
        />
      </Card>

      <Card bordered={false} className="payroll-panel payroll-panel-cycles" title="Recent payroll cycles">
        <Table
          loading={loading}
          columns={payrollColumns}
          dataSource={payrollRuns.slice(0, 5)}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 900 }}
        />
      </Card>

      {canManagePayroll ? (
        <Card bordered={false} className="payroll-panel payroll-panel-staff" title="Recent staff records">
          <Table
            loading={loading}
            columns={staffColumns}
            dataSource={rankedStaffMembers.slice(0, 5)}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 1700 }}
            rowClassName="payroll-clickable-row"
            onRow={(record) => ({
              onClick: () => openStaffDetails(record),
            })}
          />
        </Card>
      ) : null}
    </div>
  );

  const runsTab = (
    <Card bordered={false} className="payroll-panel payroll-panel-cycles">
      <div className="payroll-toolbar">
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Payroll cycles</Title>
          <Text type="secondary">Generate, approve, and mark monthly payroll payments.</Text>
        </div>
        <Space wrap>
          {canManagePayroll ? (
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openNewRun}>
              New payroll cycle
            </Button>
          ) : null}
        </Space>
      </div>

      <Table
        className="payroll-table"
        loading={loading}
        columns={payrollColumns}
        dataSource={payrollRuns}
        rowKey="id"
        size="small"
        scroll={{ x: 900 }}
        pagination={{ pageSize: 8, size: "small" }}
      />
    </Card>
  );

  const staffTab = (
    <Card bordered={false} className="payroll-panel payroll-panel-staff">
      <div className="payroll-toolbar">
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>Staff master</Title>
          <Text type="secondary">Maintain employee records, allowances, deductions, and bank details.</Text>
        </div>
        {canManagePayroll ? (
          <Space wrap>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openNewStaff}>
              Add staff
            </Button>
          </Space>
        ) : null}
      </div>

      {staffCategoryBreakdown.length > 0 ? (
        <Row gutter={[10, 10]} style={{ marginBottom: 12 }}>
          {staffCategoryBreakdown.map(([category, count]) => (
            <Col key={category}>
              <Tag color="cyan">{`${toTitle(category)}: ${count}`}</Tag>
            </Col>
          ))}
        </Row>
      ) : null}

      <Table
        className="payroll-table"
        loading={loading}
        columns={staffColumns}
        dataSource={rankedStaffMembers}
        rowKey="id"
        size="small"
        scroll={{ x: 1700 }}
        pagination={{ pageSize: 8, size: "small" }}
        rowClassName="payroll-clickable-row"
        onRow={(record) => ({
          onClick: () => openStaffDetails(record),
        })}
        locale={{
          emptyText: <Empty description="No payroll staff yet" />,
        }}
      />
    </Card>
  );

  const payrollTabs = [
    { key: "overview", label: "Overview", children: overviewTab },
    { key: "runs", label: "Payroll Cycles", children: runsTab },
    ...(canManagePayroll ? [{ key: "staff", label: "Staff Master", children: staffTab }] : []),
  ];

  return (
    <div className="payroll-page">
      <div className="payroll-hero">
        <div>
          <Text type="secondary" className="page-kicker">
            PAYROLL MANAGEMENT
          </Text>
          <div className="payroll-title-row">
            <Title level={2} className="page-title">
              Payroll
            </Title>
            <Tag color="green" className="status-tag">
              Live
            </Tag>
          </div>
          <Text className="page-subtitle">
            Accountant maintains staff pay, HOI approves cycles, and payments are tracked month by month.
          </Text>
        </div>
        <Space wrap>
          {canManagePayroll ? (
            <Button type="primary" size="small" className="payroll-action-button" icon={<PlusOutlined />} onClick={openNewStaff}>
              Add staff
            </Button>
          ) : null}
          {canManagePayroll ? (
            <Button type="primary" size="small" className="payroll-action-button" icon={<DollarOutlined />} onClick={openNewRun}>
              New payroll cycle
            </Button>
          ) : null}
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={payrollTabs} className="payroll-tabs" />

      <Drawer
        open={drawerOpen}
        width={960}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedRunSnapshot(null);
          setSelectedRunRecord(null);
        }}
        title={selectedRun ? `${selectedRun.month} ${selectedRun.year} payroll cycle` : "Payroll details"}
        className="payroll-drawer"
        extra={
          selectedRun ? <Tag color={runStatusColors[selectedRun.status] || "default"}>{toTitle(selectedRun.status)}</Tag> : null
        }
      >
        {selectedRun ? (
          <div className="payroll-drawer-body">
            <Descriptions size="small" bordered column={3} className="payroll-descriptions">
              <Descriptions.Item label="Employees">{selectedRun.employee_count}</Descriptions.Item>
              <Descriptions.Item label="Total amount">{money(selectedRun.total_amount)}</Descriptions.Item>
              <Descriptions.Item label="Approved by">{selectedRun.approved_by?.username || "—"}</Descriptions.Item>
              <Descriptions.Item label="Generated by">{selectedRun.generated_by?.username || "—"}</Descriptions.Item>
              <Descriptions.Item label="Rejected by">{selectedRun.rejected_by?.username || "—"}</Descriptions.Item>
              <Descriptions.Item label="Year allocation">{money(annualAllocations[selectedRun.year] || 0)}</Descriptions.Item>
              <Descriptions.Item label="Archive lock">
                {selectedRunArchived ? <Tag color="default">Archived year, read only</Tag> : <Tag color="green">Editable year</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Notes">{selectedRun.notes || "—"}</Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "16px 0" }} />

            <Table
              className="payroll-table"
              columns={paymentColumns}
              dataSource={selectedRun.items || []}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 1100 }}
              locale={{
                emptyText: <Empty description="No payroll items generated yet" />,
              }}
            />

            <Divider />

            <div className="payroll-audit">
              <Title level={5} style={{ marginBottom: 8 }}>Audit trail</Title>
              {(selectedRun.audit_entries || []).length > 0 ? (
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  {(selectedRun.audit_entries || []).map((entry, index) => (
                    <Card key={`${entry.at}-${index}`} size="small" className="payroll-audit-card">
                      <Text className="payroll-strong">{toTitle(entry.action)}</Text>
                      <div className="payroll-muted">
                        {entry.by} · {entry.role} · {entry.at}
                      </div>
                      {entry.note ? <div className="payroll-muted">{entry.note}</div> : null}
                    </Card>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No audit events recorded yet.</Text>
              )}
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={staffDrawerOpen}
        width={860}
        onClose={() => {
          setStaffDrawerOpen(false);
          setSelectedStaffId(null);
          setSelectedStaffSnapshot(null);
        }}
        title={
          selectedStaff ? (
            <div className="payroll-staff-drawer-title">
              <span className="payroll-staff-avatar">{String(selectedStaff.full_name || "S").charAt(0).toUpperCase()}</span>
              <span>
                <span className="payroll-staff-name">{selectedStaff.full_name}</span>
                <span className="payroll-staff-subtitle">
                  {selectedStaff.post_description || "Staff"} · BPS {selectedStaff.bps || "—"}
                </span>
              </span>
            </div>
          ) : (
            "Staff record"
          )
        }
        className="payroll-drawer payroll-staff-drawer"
        extra={
          selectedStaff ? (
            <Space wrap>
              <Tag color={selectedStaff.active ? "green" : "red"}>{selectedStaff.active ? "Active" : "Inactive"}</Tag>
              {canManagePayroll ? (
                <>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEditStaff(selectedStaff)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    danger={selectedStaff.active}
                    icon={selectedStaff.active ? <DeleteOutlined /> : <CheckOutlined />}
                    onClick={() => confirmToggleStaffActive(selectedStaff)}
                  >
                    {selectedStaff.active ? "Deactivate" : "Activate"}
                  </Button>
                </>
              ) : null}
            </Space>
          ) : null
        }
      >
        {selectedStaff ? (
          <div className="payroll-drawer-body">
            <Descriptions size="small" bordered column={2} className="payroll-descriptions payroll-staff-descriptions">
              <Descriptions.Item label="Personnel No">{selectedStaff.personnel_no || "—"}</Descriptions.Item>
              <Descriptions.Item label="Designation">{selectedStaff.post_description || "—"}</Descriptions.Item>
              <Descriptions.Item label="Rank / BPS">{selectedStaff.bps || "—"}</Descriptions.Item>
              <Descriptions.Item label="Department">{selectedStaff.department || "—"}</Descriptions.Item>
              <Descriptions.Item label="Category">{toTitle(selectedStaff.staff_category)}</Descriptions.Item>
              <Descriptions.Item label="Estimate Group">{estimateGroupLabel(selectedStaff.estimate_pay_group)}</Descriptions.Item>
              <Descriptions.Item label="Estimate Year">
                {selectedStaff.estimate_year ? fiscalYearLabel(selectedStaff.estimate_year) : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Increment Date">{selectedStaff.next_increment_date || "—"}</Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "14px 0" }} />

            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <div className="payroll-preview-tile payroll-estimate-tile payroll-estimate-pay">
                  <Text type="secondary">Pay Actual Being Drawn</Text>
                  <div className="payroll-preview-value">{money(payrollBasicPay(selectedStaff))}</div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="payroll-preview-tile payroll-estimate-tile payroll-estimate-four">
                  <Text type="secondary">Actually Exp 4 Months</Text>
                  <div className="payroll-preview-value">{money(payrollEstimateFourMonths(selectedStaff))}</div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="payroll-preview-tile payroll-estimate-tile payroll-estimate-eight">
                  <Text type="secondary">Anticipated Exp 8 Months</Text>
                  <div className="payroll-preview-value">{money(payrollEstimateEightMonths(selectedStaff))}</div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="payroll-preview-tile payroll-estimate-tile payroll-estimate-rate">
                  <Text type="secondary">Rate of Increment</Text>
                  <div className="payroll-preview-value">{money(selectedStaff.increment_rate)}</div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="payroll-preview-tile payroll-estimate-tile payroll-estimate-increment">
                  <Text type="secondary">Amount of Increment</Text>
                  <div className="payroll-preview-value">{money(payrollEstimateIncrementAmount(selectedStaff))}</div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="payroll-preview-tile payroll-preview-total payroll-estimate-tile">
                  <Text type="secondary">Total Revised Estimate</Text>
                  <div className="payroll-preview-value">{money(payrollTotalRevisedEstimate(selectedStaff))}</div>
                </div>
              </Col>
            </Row>

            <Descriptions size="small" bordered column={2} className="payroll-descriptions payroll-staff-descriptions">
              <Descriptions.Item label="Allowances">{money(payrollAllowanceTotal(selectedStaff))}</Descriptions.Item>
              <Descriptions.Item label="Gross Pay">{money(payrollGrossPay(selectedStaff))}</Descriptions.Item>
              <Descriptions.Item label="Deductions">{money(payrollDeductionTotal(selectedStaff))}</Descriptions.Item>
              <Descriptions.Item label="Net Pay">{money(payrollNetPay(selectedStaff))}</Descriptions.Item>
              <Descriptions.Item label="CNIC">{selectedStaff.cnic || "—"}</Descriptions.Item>
              <Descriptions.Item label="Bank">{selectedStaff.bank_name || "—"}</Descriptions.Item>
              <Descriptions.Item label="Account">{selectedStaff.account_number || "—"}</Descriptions.Item>
              <Descriptions.Item label="Notes">{selectedStaff.notes || "—"}</Descriptions.Item>
            </Descriptions>

            <div className="payroll-year-estimates-panel">
              <div className="payroll-section-heading">
                <Text strong>Saved year estimates</Text>
                <Text type="secondary">Previous revised and next-year proposed data</Text>
              </div>
              <Table
                rowKey={(record) => `${record.fiscal_year_label}-${record.estimate_type}`}
                size="small"
                dataSource={selectedStaff.year_estimates || []}
                pagination={false}
                scroll={{ x: 980 }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No yearly estimate saved" /> }}
                columns={[
                  {
                    title: "Year",
                    dataIndex: "fiscal_year_label",
                    key: "fiscal_year_label",
                    fixed: "left",
                    width: 120,
                    render: (value, record) => (
                      <Space direction="vertical" size={0}>
                        <Text strong>{value}</Text>
                        <Tag color={record.estimate_type === "proposed" ? "blue" : "green"}>
                          {toTitle(record.estimate_type)}
                        </Tag>
                      </Space>
                    ),
                  },
                  { title: "Min Pay", dataIndex: "min_pay", key: "min_pay", render: money },
                  { title: "Max Pay", dataIndex: "max_pay", key: "max_pay", render: money },
                  { title: "Actual Pay", dataIndex: "actual_pay", key: "actual_pay", render: money },
                  { title: "Pay Officers", dataIndex: "pay_officers", key: "pay_officers", render: money },
                  { title: "Pay Others", dataIndex: "pay_others", key: "pay_others", render: money },
                  { title: "HRA", dataIndex: "hra", key: "hra", render: money },
                  { title: "Convy Alce", dataIndex: "conveyance", key: "conveyance", render: money },
                  { title: "Med Alce", dataIndex: "medical", key: "medical", render: money },
                  { title: "Total Allces", dataIndex: "total_allowances", key: "total_allowances", render: money },
                  { title: "Teach Alces", dataIndex: "teaching_allowance", key: "teaching_allowance", render: money },
                  {
                    title: "Grand Total",
                    dataIndex: "grand_total",
                    key: "grand_total",
                    render: (value) => <Text strong>{money(value)}</Text>,
                  },
                ]}
              />
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal open={runModalOpen} title={editingRunId ? "Edit payroll cycle" : "New payroll cycle"} onCancel={closeRunModal} footer={null} destroyOnClose>
        <Form form={runForm} layout="vertical" onFinish={submitRun}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Month" name="month" rules={[{ required: true, message: "Select a month" }]}>
                <Select options={monthOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Year" name="year" rules={[{ required: true, message: "Enter year" }]}>
                <InputNumber min={2000} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Government allocated payroll amount for this year"
            name="government_allocation"
            tooltip="This amount is tracked by year. Paid payroll is deducted from it; archived year-end balance is surrendered."
          >
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Internal notes" name="notes">
            <TextArea rows={4} placeholder="Internal remarks for this payroll cycle" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editingRunId ? "Update" : "Create"}
            </Button>
            <Button onClick={closeRunModal} disabled={saving}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        open={staffModalOpen}
        title={
          <div className="payroll-staff-modal-title">
            <span>{editingStaffId ? "Edit staff record" : "Add payroll staff"}</span>
            <small>{editingStaffId ? "Update payroll and revised estimate details" : "Create payroll and estimate record"}</small>
          </div>
        }
        onCancel={closeStaffModal}
        footer={null}
        width={860}
        destroyOnClose
        className="payroll-staff-modal"
      >
        <Form form={staffForm} layout="vertical" onFinish={submitStaff}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Full name" name="full_name" rules={[{ required: true, message: "Enter staff name" }]}>
                <Input placeholder="Employee name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="CNIC" name="cnic" rules={[{ required: true, message: "Enter CNIC" }]}>
                <Input placeholder="35202-1234567-1" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Designation" name="post_description">
                <Input placeholder="Lecturer / Clerk / Assistant" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="BPS / Time scale / Pay scale" name="bps">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Next increment date" name="next_increment_date">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Increment rate" name="increment_rate">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Revised estimate {fiscalYearLabel(watchedEstimateYear)}</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Estimate year" name="estimate_year">
                <InputNumber min={2000} max={2100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Estimate group" name="estimate_pay_group">
                <Select
                  allowClear
                  placeholder="Select estimate group"
                  options={[
                    { value: "gazetted", label: "Pay of Officers" },
                    { value: "non_gazetted", label: "Pay of Others" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Actual exp 4 months" name="estimate_actual_four_months">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Anticipated exp 8 months" name="estimate_anticipated_eight_months">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Amount of increment 12-25 to 6-26" name="estimate_increment_amount">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Pay structure</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Monthly basic pay" name="monthly_basic_pay" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Other allowance" name="other_allowance_type">
                <Select allowClear placeholder="Select allowance type" options={otherAllowanceOptions} />
              </Form.Item>
            </Col>
            {payrollAllowanceFields.map((field) => (
              <Col xs={24} md={8} key={field.name}>
                <Form.Item label={field.label} name={field.name}>
                  <InputNumber min={0} precision={2} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            ))}
            <Col xs={24} md={8}>
              <Form.Item label="Other adhoc allowance" name="adhoc_allowance_config">
                <Select
                  allowClear
                  showSearch
                  placeholder="Select year and percentage"
                  optionFilterProp="label"
                  options={allowanceConfigOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={`Adhoc amount${allowanceConfigLabel(watchedStaffValues.adhoc_allowance_config) ? ` ${allowanceConfigLabel(watchedStaffValues.adhoc_allowance_config)}` : ""}`}
                name="adhoc_allowance"
              >
                <InputNumber min={0} precision={2} placeholder="Enter amount" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Other DRA allowance" name="dra_allowance_config">
                <Select
                  allowClear
                  showSearch
                  placeholder="Select year and percentage"
                  optionFilterProp="label"
                  options={allowanceConfigOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={`DRA amount${allowanceConfigLabel(watchedStaffValues.dra_allowance_config) ? ` ${allowanceConfigLabel(watchedStaffValues.dra_allowance_config)}` : ""}`}
                name="dra_allowance"
              >
                <InputNumber min={0} precision={2} placeholder="Enter amount" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Deduction amount"
                name="deduction_amount"
                extra={`Suggested for BPS ${watchedBps || "—"}: ${money(suggestedRankDeduction)}`}
              >
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Button size="small" onClick={applyRankDeductions}>
            Apply rank-based deductions
          </Button>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Active" name="active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Internal payroll notes" />
          </Form.Item>

          <Card bordered={false} className="payroll-preview-card">
            <Title level={5} style={{ marginBottom: 12 }}>Pay preview</Title>
            <Row gutter={12}>
              <Col xs={24} md={6}>
                <div className="payroll-preview-tile">
                  <Text type="secondary">Basic</Text>
                  <div className="payroll-preview-value">{money(basicPay)}</div>
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div className="payroll-preview-tile">
                  <Text type="secondary">Allowances</Text>
                  <div className="payroll-preview-value">{money(allowanceTotal)}</div>
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div className="payroll-preview-tile">
                  <Text type="secondary">Deductions</Text>
                  <div className="payroll-preview-value">{money(deductions)}</div>
                  <Text type="secondary">Rank suggestion: {money(suggestedRankDeduction)}</Text>
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div className="payroll-preview-tile">
                  <Text type="secondary">Net pay</Text>
                  <div className="payroll-preview-value">{money(netPay)}</div>
                </div>
              </Col>
            </Row>
          </Card>

          <Space className="payroll-modal-actions">
            <Button type="primary" htmlType="submit" loading={saving}>
              {editingStaffId ? "Update staff" : "Save staff"}
            </Button>
            <Button onClick={closeStaffModal} disabled={saving}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal open={paymentModalOpen} title="Update payment status" onCancel={() => setPaymentModalOpen(false)} footer={null} destroyOnClose>
        <Form form={paymentForm} layout="vertical" onFinish={submitPayment}>
          <Form.Item label="Payment status" name="payment_status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "pending", label: "Pending" },
                { value: "partial", label: "Partial" },
                { value: "paid", label: "Paid" },
                { value: "hold", label: "Hold" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Paid amount" name="paid_amount" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Payment date" name="payment_date" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Reference" name="payment_reference">
                <Input placeholder="Transaction reference" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Note" name="payment_note">
            <TextArea rows={3} placeholder="Optional note" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save payment
            </Button>
            <Button onClick={() => setPaymentModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        open={discardRunModalOpen}
        title="Discard changes?"
        onCancel={() => setDiscardRunModalOpen(false)}
        footer={[
          <Button key="keep" onClick={() => setDiscardRunModalOpen(false)}>
            Keep editing
          </Button>,
          <Button
            key="discard"
            danger
            type="primary"
            onClick={() => {
              setDiscardRunModalOpen(false);
              setRunModalOpen(false);
              resetRunForm();
            }}
          >
            Discard
          </Button>,
        ]}
      >
        <Text type="secondary">Unsaved payroll cycle changes will be lost.</Text>
      </Modal>

      <Modal
        open={discardStaffModalOpen}
        title="Discard changes?"
        onCancel={() => setDiscardStaffModalOpen(false)}
        footer={[
          <Button key="keep" onClick={() => setDiscardStaffModalOpen(false)}>
            Keep editing
          </Button>,
          <Button
            key="discard"
            danger
            type="primary"
            onClick={() => {
              setDiscardStaffModalOpen(false);
              setStaffModalOpen(false);
              resetStaffForm();
            }}
          >
            Discard
          </Button>,
        ]}
      >
        <Text type="secondary">Unsaved staff changes will be lost.</Text>
      </Modal>
    </div>
  );
};

export default Payroll;

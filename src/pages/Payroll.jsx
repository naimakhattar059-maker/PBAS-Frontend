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
  deletePayrollStaff,
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

const employmentTypeOptions = [
  { value: "regular", label: "Regular" },
  { value: "contract", label: "Contract" },
  { value: "contact", label: "Contact" },
  { value: "part_time", label: "Part Time" },
  { value: "temporary", label: "Temporary" },
];

const fallbackStaffCategoryOptions = [
  { value: "teaching", label: "Teaching" },
  { value: "non_teaching", label: "Non Teaching" },
  { value: "administrative", label: "Administrative" },
  { value: "technical", label: "Technical" },
  { value: "support", label: "Support" },
  { value: "contract_based", label: "Contract Based" },
  { value: "contact_based", label: "Contact Based" },
  { value: "part_time", label: "Part Time" },
  { value: "temporary", label: "Temporary" },
];

const payrollSheetStaffRecords = [
  { full_name: "Kousar Jabeen", post_description: "Principal", bps: 20, monthly_basic_pay: 229580, increment_rate: 6690 },
  { full_name: "Sweeta Siddique", post_description: "Associate Prof", bps: 20, monthly_basic_pay: 149300, increment_rate: 6690 },
  { full_name: "Faryal Mansoor", post_description: "Associate Prof", bps: 20, monthly_basic_pay: 149300, increment_rate: 6690 },
  { full_name: "Rabia Siddiqui", post_description: "Associate Prof", bps: 20, monthly_basic_pay: 162680, increment_rate: 6690 },
  { full_name: "Zohra Siddiqui", post_description: "Associate Prof", bps: 20, monthly_basic_pay: 149300, increment_rate: 6690 },
  { full_name: "Afshan Shoukat", post_description: "Associate Prof", bps: 20, monthly_basic_pay: 149300, increment_rate: 6690 },
  { full_name: "Dr Rabia Kamal", post_description: "Associate Prof", bps: 19, monthly_basic_pay: 92370, increment_rate: 4530 },
  { full_name: "Riffat Zia Mains", post_description: "Associate Prof", bps: 20, monthly_basic_pay: 149300, increment_rate: 6690 },
  { full_name: "Samina Khalid", post_description: "Associate Prof", bps: 20, monthly_basic_pay: 149300, increment_rate: 6690 },
  { full_name: "Wajiha Fatima", post_description: "Associate Prof", bps: 20, monthly_basic_pay: 196130, increment_rate: 6690 },
  { full_name: "Munazza Majeed", post_description: "Associate Prof", bps: 19, monthly_basic_pay: 137670, increment_rate: 4530 },
  { full_name: "Farah Imran", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 108000, increment_rate: 4260 },
  { full_name: "Shahida Aslam", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 108000, increment_rate: 4260 },
  { full_name: "Sabreen Ahmed", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 108000, increment_rate: 4260 },
  { full_name: "Amina Talat", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 56880, increment_rate: 4260 },
  { full_name: "Humera Farooq", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 112260, increment_rate: 4260 },
  { full_name: "Nark Panwar", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 116520, increment_rate: 4260 },
  { full_name: "Hina Mustafa", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 56880, increment_rate: 4260 },
  { full_name: "Tasneer Ahmed", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 69650, increment_rate: 4260 },
  { full_name: "Asma Batool", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 103740, increment_rate: 4260 },
  { full_name: "Zahida Shah Zamer", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 82440, increment_rate: 4260 },
  { full_name: "Salma Rubab", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 120780, increment_rate: 4260 },
  { full_name: "Samina", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 120780, increment_rate: 4260 },
  { full_name: "Bushra Yasmin", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 99480, increment_rate: 4260 },
  { full_name: "Shamma Naureen", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 51910, increment_rate: 4260 },
  { full_name: "Naureen Akhtar", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 112260, increment_rate: 4260 },
  { full_name: "Nigeena Touqeer", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 0, increment_rate: 4260 },
  { full_name: "Mrs Tahira Jabeen", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 90960, increment_rate: 4260 },
  { full_name: "Shehzad Amir Afridi", post_description: "Asstt Prof", bps: 18, monthly_basic_pay: 90960, increment_rate: 4260 },
];

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

const sumValues = (values = {}) =>
  Object.values(values).reduce((total, value) => total + Number(value || 0), 0);
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const currentYear = new Date().getFullYear();
const payrollAllocationStorageKey = "payrollAnnualAllocationsV1";
const payrollArchiveStorageKey = "payrollArchivedYearsV1";
const payrollSlipStorageKey = "payrollSavedPayslipsV1";

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

const readSavedPayslips = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(payrollSlipStorageKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
  sumValues({
    hra: record?.hra,
    conveyance: record?.conveyance,
    medical: record?.medical,
    integrated_allowance: record?.integrated_allowance,
    adhoc_allowance: record?.adhoc_allowance,
    dra_allowance: record?.dra_allowance,
    teaching_allowance: record?.teaching_allowance,
  });
const payrollDeductionTotal = (record) =>
  Number(record?.deduction_amount || record?.deductions || getRankDeduction(record?.bps, payrollBasicPay(record)));
const payrollGrossPay = (record) => Number(record?.gross_pay || payrollBasicPay(record) + payrollAllowanceTotal(record));
const payrollNetPay = (record) =>
  Number(record?.net_pay || Math.max(payrollGrossPay(record) - payrollDeductionTotal(record), 0));

const Payroll = () => {
  const { token, user: currentUser } = useSelector((state) => state.auth);
  const [runForm] = Form.useForm();
  const [staffForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [slipForm] = Form.useForm();
  const watchedMonthlyBasicPay = Form.useWatch("monthly_basic_pay", staffForm) || 0;
  const watchedHra = Form.useWatch("hra", staffForm) || 0;
  const watchedConveyance = Form.useWatch("conveyance", staffForm) || 0;
  const watchedMedical = Form.useWatch("medical", staffForm) || 0;
  const watchedIntegratedAllowance = Form.useWatch("integrated_allowance", staffForm) || 0;
  const watchedAdhocAllowance = Form.useWatch("adhoc_allowance", staffForm) || 0;
  const watchedDraAllowance = Form.useWatch("dra_allowance", staffForm) || 0;
  const watchedTeachingAllowance = Form.useWatch("teaching_allowance", staffForm) || 0;
  const watchedDeductionAmount = Form.useWatch("deduction_amount", staffForm) || 0;
  const watchedBps = Form.useWatch("bps", staffForm) || 0;
  const watchedSlipStaffId = Form.useWatch("staff_id", slipForm);

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
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [slipEditMode, setSlipEditMode] = useState(false);
  const [discardRunModalOpen, setDiscardRunModalOpen] = useState(false);
  const [discardStaffModalOpen, setDiscardStaffModalOpen] = useState(false);
  const [editingRunId, setEditingRunId] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [selectedRunSnapshot, setSelectedRunSnapshot] = useState(null);
  const [selectedRunRecord, setSelectedRunRecord] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [savedPayslips, setSavedPayslips] = useState(readSavedPayslips);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      hra: 0,
      conveyance: 0,
      medical: 0,
      integrated_allowance: 0,
      adhoc_allowance: 0,
      dra_allowance: 0,
      teaching_allowance: 0,
      deduction_amount: 0,
      increment_rate: 0,
      employment_type: "regular",
      staff_category: "non_teaching",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!slipModalOpen || !watchedSlipStaffId) return;

    const staff = staffMembers.find((item) => String(item.id) === String(watchedSlipStaffId));
    if (!staff) return;

    slipForm.setFieldsValue({
      full_name: staff.full_name,
      personnel_no: staff.personnel_no,
      department: staff.department,
      post_description: staff.post_description,
      staff_category: staff.staff_category,
      employment_type: staff.employment_type,
      bps: staff.bps,
      bank_name: staff.bank_name,
      account_number: staff.account_number,
      monthly_basic_pay: staff.monthly_basic_pay || 0,
      hra: staff.hra || 0,
      conveyance: staff.conveyance || 0,
      medical: staff.medical || 0,
      integrated_allowance: staff.integrated_allowance || 0,
      adhoc_allowance: staff.adhoc_allowance || 0,
      dra_allowance: staff.dra_allowance || 0,
      teaching_allowance: staff.teaching_allowance || 0,
      deduction_amount: staff.deduction_amount || getRankDeduction(staff.bps, staff.monthly_basic_pay),
      payment_status: "pending",
      paid_amount: 0,
    });
  }, [slipForm, slipModalOpen, staffMembers, watchedSlipStaffId]);

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
      hra: 0,
      conveyance: 0,
      medical: 0,
      integrated_allowance: 0,
      adhoc_allowance: 0,
      dra_allowance: 0,
      teaching_allowance: 0,
      deduction_amount: 0,
      increment_rate: 0,
      employment_type: "regular",
      staff_category: "non_teaching",
    });
  };

  const openNewRun = () => {
    resetRunForm();
    setRunModalOpen(true);
  };

  const openPayslipModal = () => {
    setSlipEditMode(false);
    slipForm.resetFields();
    slipForm.setFieldsValue({
      month: monthOptions[new Date().getMonth()].value,
      year: currentYear,
      payment_status: "pending",
      paid_amount: 0,
    });
    setSlipModalOpen(true);
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
    });
    setStaffModalOpen(true);
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
      const payload = {
        ...values,
        active: Boolean(values.active),
        staff_category: values.staff_category,
        monthly_basic_pay: values.monthly_basic_pay || 0,
        hra: values.hra || 0,
        conveyance: values.conveyance || 0,
        medical: values.medical || 0,
        integrated_allowance: values.integrated_allowance || 0,
        adhoc_allowance: values.adhoc_allowance || 0,
        dra_allowance: values.dra_allowance || 0,
        teaching_allowance: values.teaching_allowance || 0,
        deduction_amount: values.deduction_amount || 0,
        increment_rate: values.increment_rate || 0,
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

  const importPayrollSheetStaff = async () => {
    const existingKeys = new Set(
      staffMembers.map((staff) => String(staff.full_name || "").trim().toLowerCase() + "-" + String(staff.bps || ""))
    );
    const recordsToCreate = payrollSheetStaffRecords.filter(
      (record) => !existingKeys.has(String(record.full_name || "").trim().toLowerCase() + "-" + String(record.bps || ""))
    );

    if (recordsToCreate.length === 0) {
      message.info("Payroll sheet staff already exists in Staff Master");
      return;
    }

    setSaving(true);
    try {
      for (const [index, record] of recordsToCreate.entries()) {
        const sequence = String(index + 1).padStart(3, "0");
        await createPayrollStaff(token, {
          ...record,
          personnel_no: "PAY-2025-" + sequence,
          cnic: "61101-2025" + sequence + "-1",
          department: "Teaching",
          staff_category: "teaching",
          employment_type: "regular",
          next_increment_date: "2025-12-01",
          active: true,
          hra: 0,
          conveyance: 0,
          medical: 0,
          integrated_allowance: 0,
          adhoc_allowance: 0,
          dra_allowance: 0,
          teaching_allowance: 0,
          deduction_amount: 0,
          notes: "Imported from revised estimates sheet 2025-2026",
        });
      }
      await loadPayrollData();
      message.success(String(recordsToCreate.length) + " payroll sheet staff imported");
    } catch (err) {
      message.error(err.message || "Could not import payroll sheet staff");
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

  const submitPayslip = (values) => {
    if (isArchivedYear(values.year, archivedPayrollYears)) {
      message.error("Archived payroll years cannot be changed.");
      return;
    }

    const slip = {
      ...values,
      id: `${Date.now()}-${values.staff_id}`,
      saved_at: new Date().toISOString(),
      payment_status: values.payment_status || "pending",
      paid_amount: values.paid_amount || 0,
    };
    const nextSlips = [slip, ...savedPayslips].slice(0, 100);
    setSavedPayslips(nextSlips);
    localStorage.setItem(payrollSlipStorageKey, JSON.stringify(nextSlips));
    setSlipModalOpen(false);
    setSlipEditMode(false);
    message.success("Payslip saved");
    printPayrollSlip(slip, { month: values.month, year: values.year });
  };

  const printPayrollSlip = (item, runOverride = null) => {
    const activeRun = runOverride || selectedRun;
    if (!activeRun) return;

    const allowances = sumValues({
      hra: item.hra,
      conveyance: item.conveyance,
      medical: item.medical,
      integrated_allowance: item.integrated_allowance,
      adhoc_allowance: item.adhoc_allowance,
      dra_allowance: item.dra_allowance,
      teaching_allowance: item.teaching_allowance,
    });
    const basic = Number(item.basic_pay || item.monthly_basic_pay || 0);
    const deductionsValue = Number(item.deduction_amount || item.deductions || 0);
    const gross = Number(item.gross_pay || basic + allowances);
    const net = Number(item.net_pay || Math.max(gross - deductionsValue, 0));
    const slipWindow = window.open("", "_blank", "noopener,noreferrer");

    if (!slipWindow) {
      message.error("Please allow popups to print the payroll slip.");
      return;
    }

    slipWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Payroll Slip - ${escapeHtml(item.full_name || "Staff")}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            .slip { max-width: 760px; margin: 0 auto; border: 1px solid #94a3b8; padding: 22px; }
            h1 { text-align: center; margin: 0 0 4px; font-size: 22px; }
            h2 { text-align: center; margin: 0 0 20px; font-size: 16px; color: #475569; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; margin-bottom: 18px; }
            .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #cbd5e1; padding: 7px 0; gap: 18px; }
            .label { color: #475569; }
            .value { font-weight: 700; text-align: right; }
            .total { margin-top: 12px; padding-top: 12px; border-top: 2px solid #0f172a; font-size: 18px; }
            @page { size: A4; margin: 14mm; }
          </style>
        </head>
        <body>
          <div class="slip">
            <h1>Payroll Slip</h1>
            <h2>${escapeHtml(activeRun.month)} ${escapeHtml(activeRun.year)}</h2>
            <div class="grid">
              <div class="row"><span class="label">Staff Name</span><span class="value">${escapeHtml(item.full_name)}</span></div>
              <div class="row"><span class="label">Department</span><span class="value">${escapeHtml(item.department)}</span></div>
              <div class="row"><span class="label">Rank/BPS</span><span class="value">${escapeHtml(item.bps || "—")}</span></div>
              <div class="row"><span class="label">Bank</span><span class="value">${escapeHtml(item.bank_name || "—")}</span></div>
              <div class="row"><span class="label">Account</span><span class="value">${escapeHtml(item.account_number || "—")}</span></div>
              <div class="row"><span class="label">Category</span><span class="value">${escapeHtml(toTitle(item.staff_category))}</span></div>
              <div class="row"><span class="label">Payment Status</span><span class="value">${escapeHtml(toTitle(item.payment_status || "pending"))}</span></div>
              <div class="row"><span class="label">Payment Reference</span><span class="value">${escapeHtml(item.payment_reference || "—")}</span></div>
            </div>
            <div class="row"><span class="label">Basic Pay</span><span class="value">${money(basic)}</span></div>
            <div class="row"><span class="label">Allowances</span><span class="value">${money(allowances)}</span></div>
            <div class="row"><span class="label">Gross Pay</span><span class="value">${money(gross)}</span></div>
            <div class="row"><span class="label">Deductions</span><span class="value">${money(deductionsValue)}</span></div>
            <div class="row total"><span class="label">Net Salary</span><span class="value">${money(net)}</span></div>
            <div class="row"><span class="label">Paid Amount</span><span class="value">${money(item.paid_amount || 0)}</span></div>
          </div>
          <script>
            window.onload = () => {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    slipWindow.document.close();
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
      key: "delete",
      label: "Delete",
      danger: true,
      icon: <DeleteOutlined />,
      onClick: () =>
        Modal.confirm({
          title: "Delete payroll staff?",
          okText: "Delete",
          okButtonProps: { danger: true },
          centered: true,
          onOk: async () => {
            await runPayrollAction(deletePayrollStaff, record.id, undefined, "Payroll staff deleted");
          },
        }),
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
          <Button type="text" icon={<MoreOutlined />} onMouseDown={(event) => event.preventDefault()} />
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
        <Space>
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
          <Button size="small" onClick={() => printPayrollSlip(record)}>
            Slip
          </Button>
        </Space>
      ),
    },
  ];

  const savedPayslipColumns = [
    {
      title: "Staff",
      key: "staff",
      render: (_, record) => (
        <div className="payroll-cell-stack">
          <Text className="payroll-strong">{record.full_name}</Text>
          <Text type="secondary">{record.personnel_no || record.department}</Text>
        </div>
      ),
    },
    { title: "Month", dataIndex: "month", key: "month" },
    { title: "Year", dataIndex: "year", key: "year" },
    { title: "Rank / BPS", dataIndex: "bps", key: "bps", render: (value) => value || "—" },
    { title: "Net Pay", key: "net_pay", render: (_, record) => money(payrollNetPay(record)) },
    {
      title: "Payment",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (value) => <Tag color={paymentStatusColors[value] || "default"}>{toTitle(value)}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button size="small" onClick={() => printPayrollSlip(record, { month: record.month, year: record.year })}>
          Print slip
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

  const staffCategoryOptions =
    payrollMeta.staff_categories?.length > 0 ? payrollMeta.staff_categories : fallbackStaffCategoryOptions;
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

  const allowanceTotal = sumValues({
    hra: watchedHra,
    conveyance: watchedConveyance,
    medical: watchedMedical,
    integrated_allowance: watchedIntegratedAllowance,
    adhoc_allowance: watchedAdhocAllowance,
    dra_allowance: watchedDraAllowance,
    teaching_allowance: watchedTeachingAllowance,
  });
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
        <Card bordered={false} className="payroll-panel payroll-panel-cycles" title="Recent generated payslips">
          <Table
            loading={loading}
            columns={savedPayslipColumns}
            dataSource={savedPayslips.slice(0, 6)}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 900 }}
            locale={{
              emptyText: <Empty description="No saved payslips yet" />,
            }}
          />
        </Card>
      ) : null}

      {canManagePayroll ? (
        <Card bordered={false} className="payroll-panel payroll-panel-staff" title="Recent staff records">
          <Table
            loading={loading}
            columns={staffColumns}
            dataSource={staffMembers.slice(0, 5)}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 1100 }}
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
            <Button size="small" onClick={importPayrollSheetStaff} loading={saving}>
              Import payroll sheet staff
            </Button>
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
        dataSource={staffMembers}
        rowKey="id"
        size="small"
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 8, size: "small" }}
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
            <Button type="primary" size="small" className="payroll-action-button" icon={<DollarOutlined />} onClick={openPayslipModal}>
              Generate payslip
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

      <Modal open={staffModalOpen} title={editingStaffId ? "Edit staff record" : "Add payroll staff"} onCancel={closeStaffModal} footer={null} width={1040} destroyOnClose>
        <Form form={staffForm} layout="vertical" onFinish={submitStaff}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Full name" name="full_name" rules={[{ required: true, message: "Enter staff name" }]}>
                <Input placeholder="Employee name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Father name" name="father_name">
                <Input placeholder="Father name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="CNIC" name="cnic" rules={[{ required: true, message: "Enter CNIC" }]}>
                <Input placeholder="35202-1234567-1" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Personnel no." name="personnel_no" rules={[{ required: true, message: "Enter personnel number" }]}>
                <Input placeholder="PR-001" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Post description" name="post_description" rules={[{ required: true, message: "Enter post description" }]}>
                <Input placeholder="Senior Clerk" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Department" name="department" rules={[{ required: true, message: "Enter department" }]}>
                <Input placeholder="Finance" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Employment type" name="employment_type" rules={[{ required: true }]}>
                <Select options={employmentTypeOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Staff category" name="staff_category" rules={[{ required: true, message: "Select staff category" }]}>
                <Select options={staffCategoryOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="BPS" name="bps">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Gender" name="gender">
                <Select
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Contact number" name="contact_number">
                <Input placeholder="+92..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Email" name="email">
                <Input placeholder="staff@college.edu.pk" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Bank name" name="bank_name">
                <Input placeholder="Bank name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Account number" name="account_number">
                <Input placeholder="Account / IBAN" />
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

          <Divider orientation="left">Pay structure</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Monthly basic pay" name="monthly_basic_pay" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="HRA" name="hra">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Conveyance" name="conveyance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Medical" name="medical">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Integrated allowance" name="integrated_allowance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Adhoc allowance" name="adhoc_allowance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="DRA allowance" name="dra_allowance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Teaching allowance" name="teaching_allowance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} />
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
        open={slipModalOpen}
        title="Generate payslip from staff master"
        onCancel={() => {
          setSlipModalOpen(false);
          setSlipEditMode(false);
        }}
        footer={null}
        width={1040}
        destroyOnClose
      >
        <Form form={slipForm} layout="vertical" onFinish={submitPayslip}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Search staff by name, rank, or post" name="staff_id" rules={[{ required: true, message: "Select staff member" }]}>
                <Select
                  showSearch
                  placeholder="Type staff name, BPS/rank, or post"
                  optionFilterProp="searchText"
                  options={staffMembers
                    .filter((staff) => staff.active)
                    .map((staff) => ({
                      value: staff.id,
                      label: `${staff.full_name} - BPS ${staff.bps || "N/A"} - ${staff.post_description || "Staff"}`,
                      searchText: `${staff.full_name} ${staff.bps || ""} ${staff.post_description || ""} ${staff.department || ""}`,
                    }))}
                />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item label="Month" name="month" rules={[{ required: true, message: "Select month" }]}>
                <Select options={monthOptions} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item label="Year" name="year" rules={[{ required: true, message: "Enter year" }]}>
                <InputNumber min={2000} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <div className="payroll-slip-edit-bar">
            <div>
              <Text strong>{slipEditMode ? "Slip details unlocked" : "Slip details locked"}</Text>
              <Text type="secondary">
                Staff master data is reused automatically. Use edit only for small monthly changes like bank account or payment amount.
              </Text>
            </div>
            <Button icon={<EditOutlined />} onClick={() => setSlipEditMode((value) => !value)}>
              {slipEditMode ? "Lock details" : "Edit slip details"}
            </Button>
          </div>

          <Divider orientation="left">Staff details</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Full name" name="full_name" rules={[{ required: true }]}>
                <Input disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Personnel no." name="personnel_no">
                <Input disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Rank / BPS" name="bps">
                <InputNumber min={0} style={{ width: "100%" }} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Department" name="department">
                <Input disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Post description" name="post_description">
                <Input disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Bank name" name="bank_name">
                <Input disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Account number" name="account_number">
                <Input disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Employment type" name="employment_type">
                <Select options={employmentTypeOptions} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Staff category" name="staff_category">
                <Select options={staffCategoryOptions} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Pay and deductions</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Monthly basic pay" name="monthly_basic_pay" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="HRA" name="hra">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Conveyance" name="conveyance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Medical" name="medical">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Integrated allowance" name="integrated_allowance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Adhoc allowance" name="adhoc_allowance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="DRA allowance" name="dra_allowance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Teaching allowance" name="teaching_allowance">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Deduction amount" name="deduction_amount">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Payment status" name="payment_status" rules={[{ required: true }]}>
                <Select
                  disabled={!slipEditMode}
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "partial", label: "Partial" },
                    { value: "paid", label: "Paid" },
                    { value: "hold", label: "Hold" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Paid amount" name="paid_amount">
                <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled={!slipEditMode} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Monthly note" name="payment_note">
            <TextArea rows={3} placeholder="Optional monthly change note" disabled={!slipEditMode} />
          </Form.Item>

          <Space className="payroll-modal-actions">
            <Button type="primary" htmlType="submit" loading={saving}>
              Save payslip
            </Button>
            <Button
              onClick={() => {
                setSlipModalOpen(false);
                setSlipEditMode(false);
              }}
              disabled={saving}
            >
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

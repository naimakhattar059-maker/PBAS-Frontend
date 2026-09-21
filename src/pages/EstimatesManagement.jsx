import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CalculatorOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  EditOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SaveOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import AccessDenied from "../components/AccessDenied";
import { hasAnyPermission } from "../utils/permissions";
import { listPayrollStaffs } from "../api/payrollStaffs";
import { money } from "../utils/payrollEstimates";
import "./EstimatesManagement.css";

const { Title, Text } = Typography;
const { TextArea } = Input;
const currentYear = new Date().getFullYear();
const useDummyEstimateData = false;
const estimatesArchiveStorageKey = "estimatesArchivedYearsV1";

const readArchivedEstimateYears = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(estimatesArchiveStorageKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const isEstimateYearArchived = (year, archivedYears = {}) => Boolean(archivedYears[Number(year)]);
const fiscalYearShortLabel = (year) => {
  const startYear = Number(year);
  return startYear ? `${startYear}-${String(startYear + 1).slice(-2)}` : "—";
};
const fiscalYearFullLabel = (year) => {
  const startYear = Number(year);
  return startYear ? `${startYear}-${startYear + 1}` : "—";
};

const dummyEstimates = [];

const documentPayOfficerRows = [
  { id: "doc-officer-1", name: "Iqra Jabeen", designation: "Principal", bps: 20, presentPay: 229580, actualFourMonths: 918320, anticipatedEightMonths: 1836640, incrementDate: "01.12.25", incrementRate: 6690, incrementAmount: 46830, totalRevised: 2801790 },
  { id: "doc-officer-2", name: "Sweeta Siddique", designation: "Associate Prof", bps: 20, presentPay: 149300, actualFourMonths: 597200, anticipatedEightMonths: 1194400, incrementDate: "01.12.25", incrementRate: 6690, incrementAmount: 46830, totalRevised: 1838430 },
  { id: "doc-officer-3", name: "Faryal Mansoor", designation: "Associate Prof", bps: 20, presentPay: 149300, actualFourMonths: 597200, anticipatedEightMonths: 1194400, incrementDate: "01.12.25", incrementRate: 6690, incrementAmount: 46830, totalRevised: 1838430 },
  { id: "doc-officer-4", name: "Rukhsar Shahnaz (TS)", designation: "Associate Prof", bps: 20, presentPay: 162680, actualFourMonths: 650720, anticipatedEightMonths: 1301440, incrementDate: "01.12.25", incrementRate: 6690, incrementAmount: 46830, totalRevised: 1998990 },
  { id: "doc-officer-5", name: "Zoufia Siddique", designation: "Associate Prof", bps: 20, presentPay: 149300, actualFourMonths: 597200, anticipatedEightMonths: 1194400, incrementDate: "01.12.25", incrementRate: 6690, incrementAmount: 46830, totalRevised: 1838430 },
  { id: "doc-officer-6", name: "Afshan Shoukat (TS)", designation: "Associate Prof", bps: 20, presentPay: 149300, actualFourMonths: 597200, anticipatedEightMonths: 1194400, incrementDate: "01.12.25", incrementRate: 6690, incrementAmount: 46830, totalRevised: 1838430 },
  { id: "doc-officer-7", name: "Dr Rabia Kamal", designation: "Associate Prof", bps: 19, presentPay: 92370, actualFourMonths: 369480, anticipatedEightMonths: 738960, incrementDate: "01.12.25", incrementRate: 6690, incrementAmount: 46830, totalRevised: 1155270 },
  { id: "doc-officer-8", name: "Riffat Zia Maths", designation: "Associate Prof", bps: 20, presentPay: 149300, actualFourMonths: 597200, anticipatedEightMonths: 1194400, incrementDate: "01.12.25", incrementRate: 6690, incrementAmount: 46830, totalRevised: 1838430 },
  { id: "doc-officer-9", name: "Samina Khalid (TS)", designation: "Associate Prof", bps: 20, presentPay: 149300, actualFourMonths: 597200, anticipatedEightMonths: 1194400, incrementDate: "01.12.25", incrementRate: 6690, incrementAmount: 46830, totalRevised: 1838430 },
  { id: "doc-officer-10", name: "Vajiha Fatima (TS)", designation: "Associate Prof", bps: 20, presentPay: 196130, actualFourMonths: 784520, anticipatedEightMonths: 1569040, incrementDate: "01.12.25", incrementRate: 6690, incrementAmount: 46830, totalRevised: 2400390 },
  { id: "doc-officer-11", name: "Munazza Majeed", designation: "Associate Prof", bps: 19, presentPay: 137670, actualFourMonths: 550680, anticipatedEightMonths: 1101360, incrementDate: "01.12.25", incrementRate: 4530, incrementAmount: 31710, totalRevised: 1683750 },
  { id: "doc-officer-12", name: "Farah Irfan", designation: "Asstt Prof", bps: 18, presentPay: 108000, actualFourMonths: 432000, anticipatedEightMonths: 864000, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1325820 },
  { id: "doc-officer-13", name: "Ghania Aslam", designation: "Asstt Prof", bps: 18, presentPay: 108000, actualFourMonths: 432000, anticipatedEightMonths: 864000, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1325820 },
  { id: "doc-officer-14", name: "Sabreen Ahmed", designation: "Asstt Prof", bps: 18, presentPay: 108000, actualFourMonths: 436260, anticipatedEightMonths: 864000, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1330080 },
  { id: "doc-officer-15", name: "Amna Talat", designation: "Asstt Prof", bps: 18, presentPay: 56880, actualFourMonths: 227520, anticipatedEightMonths: 455040, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 712380 },
  { id: "doc-officer-16", name: "Humeira Farooq", designation: "Asstt Prof", bps: 18, presentPay: 112260, actualFourMonths: 449040, anticipatedEightMonths: 898080, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1376940 },
  { id: "doc-officer-17", name: "Nosh Panwar", designation: "Asstt Prof", bps: 18, presentPay: 116520, actualFourMonths: 466080, anticipatedEightMonths: 932160, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1428060 },
  { id: "doc-officer-18", name: "Hira Mustafa", designation: "Asstt Prof", bps: 18, presentPay: 56880, actualFourMonths: 355320, anticipatedEightMonths: 455040, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 840180 },
  { id: "doc-officer-19", name: "Taqdeer Ahmed", designation: "Asstt Prof", bps: 18, presentPay: 69660, actualFourMonths: 278640, anticipatedEightMonths: 557280, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 865740 },
  { id: "doc-officer-20", name: "Asmara Batool", designation: "Asstt Prof", bps: 18, presentPay: 103740, actualFourMonths: 414960, anticipatedEightMonths: 829920, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1274700 },
  { id: "doc-officer-21", name: "Zahid Shah Zameer", designation: "Asstt Prof", bps: 18, presentPay: 82440, actualFourMonths: 329760, anticipatedEightMonths: 659520, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1019100 },
  { id: "doc-officer-22", name: "Saima Rubab", designation: "Asstt Prof", bps: 18, presentPay: 120780, actualFourMonths: 483120, anticipatedEightMonths: 966240, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1479180 },
  { id: "doc-officer-23", name: "Jamzadi", designation: "Asstt Prof", bps: 18, presentPay: 120780, actualFourMonths: 483120, anticipatedEightMonths: 966240, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1479180 },
  { id: "doc-officer-24", name: "Bushra Yasmin", designation: "Asstt Prof", bps: 18, presentPay: 99480, actualFourMonths: 397920, anticipatedEightMonths: 795840, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1223580 },
  { id: "doc-officer-25", name: "Shama Noureen", designation: "Asstt Prof", bps: 18, presentPay: 51910, actualFourMonths: 207640, anticipatedEightMonths: 415280, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 652740 },
  { id: "doc-officer-26", name: "Fahreen Akhtar", designation: "Asstt Prof", bps: 18, presentPay: 112260, actualFourMonths: 449040, anticipatedEightMonths: 898080, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1376940 },
  { id: "doc-officer-27", name: "Nageena Tousif / V.Post", designation: "Asstt Prof", bps: 18, presentPay: 0, actualFourMonths: 298440, anticipatedEightMonths: 0, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 0, totalRevised: 298440 },
  { id: "doc-officer-28", name: "Mrs Tahira Jabeen", designation: "Asstt Prof", bps: 18, presentPay: 90960, actualFourMonths: 261600, anticipatedEightMonths: 727680, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1019100 },
  { id: "doc-officer-29", name: "Shazia Amir Afridi", designation: "Asstt Prof", bps: 18, presentPay: 90960, actualFourMonths: 363840, anticipatedEightMonths: 727680, incrementDate: "01.12.25", incrementRate: 4260, incrementAmount: 29820, totalRevised: 1121340 },
];

const summaryBaseRows = [
  {
    id: "pay-officers",
    description: "A 011-1 Pay of Officers",
    actual2023: 49456000,
    actual2024: 59361000,
    actual2025: 58613000,
    firstFourMonths: 21660860,
    nextEightMonths: 45757590,
    revisedEstimate: 67418450,
    budgetAllocation: 57397000,
    proposedEstimate: 71276510,
  },
  {
    id: "pay-others",
    description: "A 011-2 Pay of Others",
    actual2023: 11795000,
    actual2024: 8197000,
    actual2025: 9025000,
    firstFourMonths: 3508760,
    nextEightMonths: 7419030,
    revisedEstimate: 10927790,
    budgetAllocation: 9000000,
    proposedEstimate: 11430290,
  },
  {
    id: "regular-allowances",
    description: "A 012 Regular Allowances",
    actual2023: 26543000,
    actual2024: 54207000,
    actual2025: 49083000,
    firstFourMonths: 32156365,
    nextEightMonths: 67657277,
    revisedEstimate: 99813642,
    budgetAllocation: 61749000,
    proposedEstimate: 101676927,
  },
  {
    id: "teaching-allowance",
    description: "A 01228 Teaching Allow",
    actual2023: 583000,
    actual2024: 538000,
    actual2025: 732000,
    firstFourMonths: 130000,
    nextEightMonths: 370000,
    revisedEstimate: 500000,
    budgetAllocation: 424000,
    proposedEstimate: 720000,
  },
  {
    id: "medical-charges",
    description: "A 01274 Med Charges",
    actual2023: 0,
    actual2024: 0,
    actual2025: 0,
    firstFourMonths: 0,
    nextEightMonths: 0,
    revisedEstimate: 0,
    budgetAllocation: 0,
    proposedEstimate: 0,
  },
  {
    id: "operating-expenses",
    description: "A 03 Operating Expenses",
    actual2023: 0,
    actual2024: 0,
    actual2025: 1000000,
    firstFourMonths: 0,
    nextEightMonths: 750000,
    revisedEstimate: 750000,
    budgetAllocation: 750000,
    proposedEstimate: 2616000,
  },
  {
    id: "physical-assets",
    description: "A 09 Physical Assets",
    actual2023: 0,
    actual2024: 0,
    actual2025: 0,
    firstFourMonths: 0,
    nextEightMonths: 0,
    revisedEstimate: 0,
    budgetAllocation: 0,
    proposedEstimate: 1950000,
  },
  {
    id: "repair-maintenance",
    description: "A 13 Repair And Maintenance",
    actual2023: 0,
    actual2024: 0,
    actual2025: 0,
    firstFourMonths: 0,
    nextEightMonths: 0,
    revisedEstimate: 0,
    budgetAllocation: 0,
    proposedEstimate: 1500000,
  },
];

const regularAllowanceFields = [
  ["hra", "HRA"],
  ["conveyanceAllowance", "Convy Alce"],
  ["medicalAllowance", "Med Alce"],
  ["integratedAllowance", "Integ Alces"],
  ["dra2020", "DRA 25% 2020"],
  ["dra2022", "DRA 15% 2022"],
  ["adhoc2022", "Adhoc 15% 2022"],
  ["adhoc2023", "Adhoc 30% 2023"],
  ["adhoc2024", "Adhoc 25% 2024"],
  ["adhoc2025", "Adhoc 10% 2025"],
  ["dra2025", "DRA 30% 2025"],
  ["medicalCharges", "Med Charges"],
  ["teachingAllowance", "Teach Alces"],
];

const initialOtherExpenditureRows = [
  { id: "other-ta", group: "Operating Expenses", expenditure: "A 038901 - TA", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 100000 },
  { id: "other-postage", group: "Operating Expenses", expenditure: "A 03201 - Postage & Stamp", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 10000 },
  { id: "other-telephone", group: "Operating Expenses", expenditure: "A 03202 - Telephone", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 100000 },
  { id: "other-electricity", group: "Operating Expenses", expenditure: "A 03303 - Electricity", budgetAllocation: 750000, actualFourMonths: 0, anticipatedExpenditure: 750000, totalRevised: 750000, proposedEstimate: 900000 },
  { id: "other-water", group: "Operating Expenses", expenditure: "A 033002 - Water Charges", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 36000 },
  { id: "other-weather", group: "Operating Expenses", expenditure: "A 03304 - Hot & Cold Weather", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 0 },
  { id: "other-gas", group: "Operating Expenses", expenditure: "A 03301 - Gas Charges", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 420000 },
  { id: "other-stationary", group: "Operating Expenses", expenditure: "A 03901 - Office Stationary", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 500000 },
  { id: "other-others", group: "Operating Expenses", expenditure: "A 039077 - Others", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 300000 },
  { id: "other-newspapers", group: "Operating Expenses", expenditure: "A 03905 - News Papers", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 250000 },
  { id: "other-plant-machinery", group: "Physical Assets", expenditure: "A 09601 - Plant & Machinery", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 500000 },
  { id: "other-furniture-fixture", group: "Physical Assets", expenditure: "A 13 - Furniture & Fixture", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 1200000 },
  { id: "other-computer-hardware", group: "Physical Assets", expenditure: "A 09201 Computer Hardware", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 250000 },
  { id: "other-office-building", group: "Repair & Maintenance", expenditure: "A 13301 Office Building", budgetAllocation: 0, actualFourMonths: 0, anticipatedExpenditure: 0, totalRevised: 0, proposedEstimate: 1500000 },
];

const calculateStatementRows = (rows) => {
  const totalRow = rows.reduce(
    (total, row) => ({
      ...total,
      actual2023: total.actual2023 + Number(row.actual2023 || 0),
      actual2024: total.actual2024 + Number(row.actual2024 || 0),
      actual2025: total.actual2025 + Number(row.actual2025 || 0),
      firstFourMonths: total.firstFourMonths + Number(row.firstFourMonths || 0),
      nextEightMonths: total.nextEightMonths + Number(row.nextEightMonths || 0),
      revisedEstimate: total.revisedEstimate + Number(row.revisedEstimate || 0),
      budgetAllocation: total.budgetAllocation + Number(row.budgetAllocation || 0),
      proposedEstimate: total.proposedEstimate + Number(row.proposedEstimate || 0),
    }),
    {
      id: "total",
      description: "Total:-",
      actual2023: 0,
      actual2024: 0,
      actual2025: 0,
      firstFourMonths: 0,
      nextEightMonths: 0,
      revisedEstimate: 0,
      budgetAllocation: 0,
      proposedEstimate: 0,
    }
  );

  return [...rows, totalRow].map((row) => {
    const variation = Number(row.revisedEstimate || 0) - Number(row.budgetAllocation || 0);

    return {
      ...row,
      variation,
      variationPercent: row.budgetAllocation ? (variation / Number(row.budgetAllocation || 0)) * 100 : 0,
    };
  });
};

const csvEscape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const statementBucketForEstimate = (estimate) => (Number(estimate.bps || 0) >= 17 ? "pay-officers" : "pay-others");

const asNumber = (value) => Number(value || 0);

const isGazettedEstimateStaff = (staff) =>
  staff.estimate_pay_group === "gazetted" ||
  (!staff.estimate_pay_group && Number(staff.bps || 0) >= 17);

const isNonGazettedEstimateStaff = (staff) =>
  staff.estimate_pay_group === "non_gazetted" ||
  (!staff.estimate_pay_group && Number(staff.bps || 0) < 17);

const compareEstimateRank = (a, b) => {
  const aPersonnel = String(a.personnel_no || a.id || "");
  const bPersonnel = String(b.personnel_no || b.id || "");

  if (aPersonnel.startsWith("PAY-2025-") && bPersonnel.startsWith("PAY-2025-")) {
    return aPersonnel.localeCompare(bPersonnel);
  }

  if (Number(b.bps || 0) !== Number(a.bps || 0)) return Number(b.bps || 0) - Number(a.bps || 0);
  return String(a.full_name || a.name || "").localeCompare(String(b.full_name || b.name || ""));
};

const buildRegularAllowanceRowFromStaff = (staff) => {
  const row = {
    id: staff.id,
    personnel_no: staff.personnel_no,
    name: staff.full_name,
    designation: staff.post_description,
    bps: staff.bps,
    hra: asNumber(staff.hra),
    conveyanceAllowance: asNumber(staff.conveyance),
    medicalAllowance: asNumber(staff.medical),
    integratedAllowance: asNumber(staff.integrated_allowance),
    dra2020: asNumber(staff.dra_2020_allowance || staff.dra_allowance),
    dra2022: asNumber(staff.dra_2022_allowance),
    adhoc2022: asNumber(staff.adhoc_2022_allowance),
    adhoc2023: asNumber(staff.adhoc_2023_allowance),
    adhoc2024: asNumber(staff.adhoc_2024_allowance),
    adhoc2025: asNumber(staff.adhoc_2025_allowance || staff.adhoc_2026_allowance),
    dra2025: asNumber(staff.dra_2025_allowance || staff.dra_2026_allowance),
    medicalCharges: 0,
    teachingAllowance: asNumber(staff.teaching_allowance),
  };

  row.totalAllowances = regularAllowanceFields
    .filter(([field]) => !["medicalCharges", "teachingAllowance"].includes(field))
    .reduce((sum, [field]) => sum + asNumber(row[field]), 0);
  row.total = asNumber(row.medicalCharges) + asNumber(row.teachingAllowance);
  row.grandTotal = row.totalAllowances + row.total;

  return row;
};

const buildPayOfficerRowFromStaff = (staff) => {
  const presentPay = asNumber(staff.monthly_basic_pay || staff.basic_pay);
  const actualFourMonths = asNumber(staff.estimate_actual_four_months) || presentPay * 4;
  const anticipatedEightMonths = asNumber(staff.estimate_anticipated_eight_months) || presentPay * 8;
  const incrementRate = asNumber(staff.increment_rate);
  const incrementAmount = asNumber(staff.estimate_increment_amount) || incrementRate * 7;

  return {
    id: staff.id,
    personnel_no: staff.personnel_no,
    name: staff.full_name,
    designation: staff.post_description,
    bps: staff.bps,
    presentPay,
    actualFourMonths,
    anticipatedEightMonths,
    incrementDate: staff.next_increment_date || "",
    incrementRate,
    incrementAmount,
    totalRevised: actualFourMonths + anticipatedEightMonths + incrementAmount,
  };
};

const buildProjectedRegularAllowanceRowFromStaff = (staff) => {
  const row = buildRegularAllowanceRowFromStaff(staff);
  return {
    ...row,
    proposedEstimate: row.totalAllowances,
    proposedTeachingAllowance: row.teachingAllowance,
    proposedMedicalCharges: row.medicalCharges,
  };
};

const buildProjectedPayOfficerRowFromStaff = (staff) => {
  const row = buildPayOfficerRowFromStaff(staff);
  return {
    ...row,
    proposedEstimate: row.totalRevised,
  };
};

const buildRegularAllowanceRowFromYearEstimate = (staff, estimate) => ({
  id: `${staff.id}-${estimate.id}-allowances`,
  isYearSnapshot: true,
  snapshotType: estimate.estimate_type,
  personnel_no: staff.personnel_no,
  name: staff.full_name,
  designation: staff.post_description,
  bps: staff.bps,
  hra: asNumber(estimate.hra),
  conveyanceAllowance: asNumber(estimate.conveyance),
  medicalAllowance: asNumber(estimate.medical),
  integratedAllowance: asNumber(estimate.integrated_allowance),
  dra2020: asNumber(estimate.dra_25_2020),
  dra2022: asNumber(estimate.dra_15_2022),
  adhoc2022: asNumber(estimate.adhoc_15_2022),
  adhoc2023: asNumber(estimate.adhoc_2023),
  adhoc2024: asNumber(estimate.adhoc_2024),
  adhoc2025: asNumber(estimate.adhoc_10_2025),
  dra2025: asNumber(estimate.dra_30_2025),
  medicalCharges: asNumber(estimate.medical_charges),
  teachingAllowance: asNumber(estimate.teaching_allowance),
  totalAllowances: asNumber(estimate.total_allowances),
  total: asNumber(estimate.misc_total),
  grandTotal: asNumber(estimate.grand_total),
  proposedEstimate: estimate.estimate_type === "proposed" ? asNumber(estimate.total_allowances) : 0,
  proposedTeachingAllowance: estimate.estimate_type === "proposed" ? asNumber(estimate.teaching_allowance) : 0,
  proposedMedicalCharges: estimate.estimate_type === "proposed" ? asNumber(estimate.medical_charges) : 0,
  revisedEstimate: estimate.estimate_type === "revised" ? asNumber(estimate.total_allowances) : 0,
  revisedTeachingAllowance: estimate.estimate_type === "revised" ? asNumber(estimate.teaching_allowance) : 0,
  revisedMedicalCharges: estimate.estimate_type === "revised" ? asNumber(estimate.medical_charges) : 0,
});

const buildPayRowFromYearEstimate = (staff, estimate, group) => {
  const proposedPay = group === "gazetted" ? asNumber(estimate.pay_officers) : asNumber(estimate.pay_others);
  const isProposed = estimate.estimate_type === "proposed";
  const anticipatedExpense =
    asNumber(estimate.anticipated_eight_months) || asNumber(estimate.anticipated_exp_12_months);

  return {
    id: `${staff.id}-${estimate.id}-${group}`,
    personnel_no: staff.personnel_no,
    name: staff.full_name,
    designation: staff.post_description,
    bps: staff.bps,
    minPay: asNumber(estimate.min_pay),
    maxPay: asNumber(estimate.max_pay),
    presentPay: asNumber(estimate.actual_pay) || proposedPay,
    actualFourMonths: asNumber(estimate.actual_four_months),
    anticipatedEightMonths: anticipatedExpense,
    incrementDate: estimate.next_increment_date || "",
    incrementRate: asNumber(estimate.increment_rate),
    incrementAmount: asNumber(estimate.increment_amount),
    totalRevised: isProposed ? 0 : proposedPay,
    proposedEstimate: isProposed ? proposedPay : 0,
  };
};

const estimateRowsFromPayrollStaff = (staffRows, year = 2025) => {
  const activeStaff = staffRows.filter(
    (staff) => staff.active !== false && (!staff.estimate_year || Number(staff.estimate_year) === 2025)
  );
  const preferredType = Number(year) <= 2025 ? "revised" : "proposed";
  const yearlyStaff = activeStaff
    .map((staff) => ({
      staff,
      estimate: (staff.year_estimates || []).find(
        (item) => Number(item.fiscal_year_start) === Number(year) && item.estimate_type === preferredType
      ),
    }))
    .filter(({ estimate }) => estimate);
  const allowanceYearlyStaff = yearlyStaff.filter(
    ({ estimate }) =>
      asNumber(estimate.total_allowances) > 0 ||
      asNumber(estimate.teaching_allowance) > 0 ||
      asNumber(estimate.medical_charges) > 0
  );
  const payYearlyStaff = yearlyStaff.filter(
    ({ estimate }) => asNumber(estimate.pay_officers) > 0 || asNumber(estimate.pay_others) > 0
  );

  if (allowanceYearlyStaff.length || payYearlyStaff.length) {
    return {
      regularRows: allowanceYearlyStaff.map(({ staff, estimate }) => buildRegularAllowanceRowFromYearEstimate(staff, estimate)),
      officerRows: payYearlyStaff.length
        ? payYearlyStaff
            .filter(({ estimate }) => asNumber(estimate.pay_officers) > 0)
            .map(({ staff, estimate }) => buildPayRowFromYearEstimate(staff, estimate, "gazetted"))
        : activeStaff.filter(isGazettedEstimateStaff).sort(compareEstimateRank).map(buildPayOfficerRowFromStaff),
      payOtherRows: payYearlyStaff.length
        ? payYearlyStaff
            .filter(({ estimate }) => asNumber(estimate.pay_others) > 0)
            .map(({ staff, estimate }) => buildPayRowFromYearEstimate(staff, estimate, "non_gazetted"))
        : activeStaff.filter(isNonGazettedEstimateStaff).sort(compareEstimateRank).map(buildPayOfficerRowFromStaff),
    };
  }

  if (Number(year) > 2025) {
    return {
      regularRows: [...activeStaff].sort(compareEstimateRank).map(buildProjectedRegularAllowanceRowFromStaff),
      officerRows: activeStaff.filter(isGazettedEstimateStaff).sort(compareEstimateRank).map(buildProjectedPayOfficerRowFromStaff),
      payOtherRows: activeStaff.filter(isNonGazettedEstimateStaff).sort(compareEstimateRank).map(buildProjectedPayOfficerRowFromStaff),
    };
  }

  if (Number(year) !== 2025) {
    return {
      regularRows: [],
      officerRows: [],
      payOtherRows: [],
    };
  }

  return {
    regularRows: [...activeStaff].sort(compareEstimateRank).map(buildRegularAllowanceRowFromStaff),
    officerRows: activeStaff.filter(isGazettedEstimateStaff).sort(compareEstimateRank).map(buildPayOfficerRowFromStaff),
    payOtherRows: activeStaff.filter(isNonGazettedEstimateStaff).sort(compareEstimateRank).map(buildPayOfficerRowFromStaff),
  };
};

const generateStatementRowsFromEstimates = (estimateRows, currentRows, year) => {
  const selectedYearRows = estimateRows.filter((estimate) => Number(estimate.year) === Number(year));
  const payrollRows = selectedYearRows.reduce(
    (groups, estimate) => {
      const bucket = statementBucketForEstimate(estimate);
      const nextGroups = { ...groups, [bucket]: { ...groups[bucket] } };

      if (estimate.estimate_type === "proposed") {
        nextGroups[bucket].proposedEstimate += Number(estimate.total_estimated_salary || 0);
      }

      if (estimate.estimate_type === "revised") {
        nextGroups[bucket].firstFourMonths += Number(estimate.first_four_months || 0);
        nextGroups[bucket].nextEightMonths += Number(estimate.next_eight_months || 0);
        nextGroups[bucket].revisedEstimate += Number(estimate.total_estimated_salary || 0);
      }

      return nextGroups;
    },
    {
      "pay-officers": { firstFourMonths: 0, nextEightMonths: 0, revisedEstimate: 0, proposedEstimate: 0 },
      "pay-others": { firstFourMonths: 0, nextEightMonths: 0, revisedEstimate: 0, proposedEstimate: 0 },
    }
  );

  return currentRows.map((row) => {
    if (!payrollRows[row.id]) return row;

    return {
      ...row,
      ...payrollRows[row.id],
    };
  });
};

const statementRowKeyForSummary = (summary) => {
  if (summary.row_key === "regular-allowances-total") return "regular-allowances";
  if (summary.row_key === "medical-charges") return "medical-charges";
  if (summary.row_key === "teaching-allowance" || summary.row_key === "teaching-allowance-total") {
    return "teaching-allowance";
  }
  return null;
};

const applyEstimateYearSummariesToStatementRows = (currentRows, summaries, year) => {
  const comparativeRows = (summaries || []).filter(
    (summary) => Number(summary.fiscal_year_start) === Number(year) && summary.summary_type === "comparative"
  );

  if (comparativeRows.length) {
    const mappedRows = comparativeRows.reduce(
      (items, summary) => ({
        ...items,
        [summary.row_key]: {
          description: summary.classification || currentRows.find((row) => row.id === summary.row_key)?.description,
          actual2023: asNumber(summary.actual_year_one),
          actual2024: asNumber(summary.actual_year_two),
          actual2025: asNumber(summary.actual_year_three),
          firstFourMonths: asNumber(summary.actual_four_months),
          nextEightMonths: asNumber(summary.anticipated_eight_months),
          revisedEstimate: asNumber(summary.total_revised),
          budgetAllocation: asNumber(summary.budget_allocation),
          proposedEstimate: asNumber(summary.proposed_estimate),
        },
      }),
      {}
    );

    return currentRows.map((row) => (mappedRows[row.id] ? { ...row, ...mappedRows[row.id] } : row));
  }

  const rowsForYear = (summaries || []).filter(
    (summary) => Number(summary.fiscal_year_start) === Number(year) && summary.summary_type === "allowances"
  );
  if (!rowsForYear.length) return currentRows;

  const mappedRows = rowsForYear.reduce((items, summary) => {
    const rowKey = statementRowKeyForSummary(summary);
    if (!rowKey || items[rowKey]) return items;

    return {
      ...items,
      [rowKey]: {
        firstFourMonths: asNumber(summary.actual_four_months),
        nextEightMonths: asNumber(summary.anticipated_eight_months),
        revisedEstimate: asNumber(summary.total_revised),
        budgetAllocation: asNumber(summary.budget_allocation),
        proposedEstimate: asNumber(summary.proposed_estimate),
      },
    };
  }, {});

  return currentRows.map((row) => (mappedRows[row.id] ? { ...row, ...mappedRows[row.id] } : row));
};

const EstimatesManagement = () => {
  const [statementForm] = Form.useForm();
  const [estimateRecordForm] = Form.useForm();
  const [archiveYearForm] = Form.useForm();
  const { token, user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [statementRows, setStatementRows] = useState(summaryBaseRows);
  const [statementStatus, setStatementStatus] = useState("draft");
  const [editingStatementRow, setEditingStatementRow] = useState(null);
  const [regularAllowanceRows, setRegularAllowanceRows] = useState([]);
  const [payOfficerRows, setPayOfficerRows] = useState(documentPayOfficerRows);
  const [payOtherRows, setPayOtherRows] = useState([]);
  const [otherExpenditureRows, setOtherExpenditureRows] = useState(initialOtherExpenditureRows);
  const [selectedEstimateRecord, setSelectedEstimateRecord] = useState(null);
  const [estimateEditMode, setEstimateEditMode] = useState(false);
  const [archivedEstimateYears, setArchivedEstimateYears] = useState(readArchivedEstimateYears);
  const [archiveYearModalOpen, setArchiveYearModalOpen] = useState(false);
  const selectedEstimateYearArchived = isEstimateYearArchived(filterYear, archivedEstimateYears);
  const canViewEstimates = hasAnyPermission(user, ["view_payroll_estimates", "manage_payroll_estimates", "approve_payroll_estimates"]);
  const canManageEstimates = hasAnyPermission(user, ["manage_payroll_estimates"]);
  const canApproveEstimates = hasAnyPermission(user, ["approve_payroll_estimates"]);

  const loadEstimates = async (year = filterYear) => {
    if (useDummyEstimateData) {
      setFilterYear(year);
      return;
    }
    if (!token || !canViewEstimates) return;

    setLoading(true);
    try {
      const payload = await listPayrollStaffs(token);
      const payrollStaffRows = payload.payroll_staffs || [];
      const estimateYearSummaries = payload.estimate_year_summaries || [];
      const { regularRows, officerRows, payOtherRows: nextPayOtherRows } = estimateRowsFromPayrollStaff(payrollStaffRows, year);
      const nextOfficerRows = officerRows.length ? officerRows : Number(year) === 2025 ? documentPayOfficerRows : [];

      setRegularAllowanceRows(regularRows);
      setPayOfficerRows(nextOfficerRows);
      setPayOtherRows(nextPayOtherRows);
      if (nextOfficerRows.length || regularRows.length || nextPayOtherRows.length) {
        refreshStatementFromRealRows(nextOfficerRows, regularRows, nextPayOtherRows);
      } else {
        setStatementRows((current) =>
          applyEstimateYearSummariesToStatementRows(
            current.map((row) =>
              ["pay-officers", "pay-others", "regular-allowances", "medical-charges", "teaching-allowance"].includes(row.id)
                ? {
                    ...row,
                    firstFourMonths: 0,
                    nextEightMonths: 0,
                    revisedEstimate: 0,
                    proposedEstimate: 0,
                  }
                : row
            ),
            estimateYearSummaries,
            year
          )
        );
      }
      setStatementRows((current) => applyEstimateYearSummariesToStatementRows(current, estimateYearSummaries, year));
      setFilterYear(year);
    } catch (err) {
      message.error(err.message || "Failed to load payroll staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstimates(filterYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canViewEstimates, filterYear]);

  const yearOptions = useMemo(
    () => {
      const visibleYearRange = Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);

      return Array.from(
        new Set([
          ...visibleYearRange,
          ...Object.keys(archivedEstimateYears).map(Number),
          ...statementRows.map((row) => Number(row.year)).filter(Boolean),
        ])
      )
        .filter(Boolean)
        .sort((a, b) => b - a)
        .map((year) => ({
          value: year,
          label: archivedEstimateYears[year]
            ? `${fiscalYearShortLabel(year)} (Archived)`
            : fiscalYearShortLabel(year),
        }));
    },
    [archivedEstimateYears, statementRows]
  );

  const statementDisplayRows = useMemo(() => calculateStatementRows(statementRows), [statementRows]);
  const actualYearLabels = [filterYear - 4, filterYear - 3, filterYear - 2].map(fiscalYearShortLabel);
  const revisedYearLabel = fiscalYearShortLabel(filterYear - 1);
  const proposedYearLabel = fiscalYearFullLabel(filterYear);
  const statementTotal = statementDisplayRows.find((row) => row.id === "total") || {};
  const otherExpenditureTotal = useMemo(
    () =>
      otherExpenditureRows.reduce(
        (total, row) => ({
          budgetAllocation: total.budgetAllocation + Number(row.budgetAllocation || 0),
          actualFourMonths: total.actualFourMonths + Number(row.actualFourMonths || 0),
          anticipatedExpenditure: total.anticipatedExpenditure + Number(row.anticipatedExpenditure || 0),
          totalRevised: total.totalRevised + Number(row.totalRevised || 0),
          proposedEstimate: total.proposedEstimate + Number(row.proposedEstimate || 0),
        }),
        {
          budgetAllocation: 0,
          actualFourMonths: 0,
          anticipatedExpenditure: 0,
          totalRevised: 0,
          proposedEstimate: 0,
        }
      ),
    [otherExpenditureRows]
  );
  const otherExpenditureDisplayRows = useMemo(
    () => [
      ...otherExpenditureRows.map((row) => ({
        ...row,
        remainingBudget: Number(row.budgetAllocation || 0) - Number(row.totalRevised || 0),
      })),
      {
        id: "other-total",
        group: "Grand Total",
        expenditure: "Grand Total",
        ...otherExpenditureTotal,
        remainingBudget: otherExpenditureTotal.budgetAllocation - otherExpenditureTotal.totalRevised,
      },
    ],
    [otherExpenditureRows, otherExpenditureTotal]
  );

  useEffect(() => {
    const totalsByGroup = otherExpenditureRows.reduce((groups, row) => {
      const groupKey =
        row.group === "Physical Assets"
          ? "physical-assets"
          : row.group === "Repair & Maintenance"
            ? "repair-maintenance"
            : "operating-expenses";
      const currentGroup = groups[groupKey] || {
        firstFourMonths: 0,
        nextEightMonths: 0,
        revisedEstimate: 0,
        budgetAllocation: 0,
        proposedEstimate: 0,
      };

      return {
        ...groups,
        [groupKey]: {
          firstFourMonths: currentGroup.firstFourMonths + Number(row.actualFourMonths || 0),
          nextEightMonths: currentGroup.nextEightMonths + Number(row.anticipatedExpenditure || 0),
          revisedEstimate: currentGroup.revisedEstimate + Number(row.totalRevised || 0),
          budgetAllocation: currentGroup.budgetAllocation + Number(row.budgetAllocation || 0),
          proposedEstimate: currentGroup.proposedEstimate + Number(row.proposedEstimate || 0),
        },
      };
    }, {});

    setStatementRows((current) =>
      current.map((row) => {
        if (!totalsByGroup[row.id]) return row;
        return {
          ...row,
          ...totalsByGroup[row.id],
        };
      })
    );
  }, [otherExpenditureRows]);

  const refreshStatementFromRealRows = (
    nextOfficerRows = payOfficerRows,
    nextAllowanceRows = regularAllowanceRows,
    nextPayOtherRows = payOtherRows
  ) => {
    const officerActualFourMonths = nextOfficerRows.reduce((sum, row) => sum + Number(row.actualFourMonths || 0), 0);
    const officerNextEightMonths = nextOfficerRows.reduce(
      (sum, row) => sum + Number(row.anticipatedEightMonths || 0) + Number(row.incrementAmount || 0),
      0
    );
    const officerRevisedTotal = nextOfficerRows.reduce((sum, row) => sum + Number(row.totalRevised || 0), 0);
    const officerProposedTotal = nextOfficerRows.reduce((sum, row) => sum + Number(row.proposedEstimate || 0), 0);
    const payOtherActualFourMonths = nextPayOtherRows.reduce((sum, row) => sum + Number(row.actualFourMonths || 0), 0);
    const payOtherNextEightMonths = nextPayOtherRows.reduce(
      (sum, row) => sum + Number(row.anticipatedEightMonths || 0) + Number(row.incrementAmount || 0),
      0
    );
    const payOtherRevisedTotal = nextPayOtherRows.reduce((sum, row) => sum + Number(row.totalRevised || 0), 0);
    const payOtherProposedTotal = nextPayOtherRows.reduce((sum, row) => sum + Number(row.proposedEstimate || 0), 0);
    const allowanceMonthlyTotals = nextAllowanceRows.reduce(
      (totals, row) => ({
        regularAllowances:
          totals.regularAllowances +
          (row.isYearSnapshot
            ? 0
            : Number(row.hra || 0) +
              Number(row.conveyanceAllowance || 0) +
              Number(row.medicalAllowance || 0) +
              Number(row.integratedAllowance || 0) +
              Number(row.dra2020 || 0) +
              Number(row.dra2022 || 0) +
              Number(row.adhoc2022 || 0) +
              Number(row.adhoc2023 || 0) +
              Number(row.adhoc2024 || 0) +
              Number(row.adhoc2025 || 0) +
              Number(row.dra2025 || 0)),
        teachingAllowance: totals.teachingAllowance + (row.isYearSnapshot ? 0 : Number(row.teachingAllowance || 0)),
        medicalCharges: totals.medicalCharges + (row.isYearSnapshot ? 0 : Number(row.medicalCharges || 0)),
      }),
      {
        regularAllowances: 0,
        teachingAllowance: 0,
        medicalCharges: 0,
      }
    );
    const allowanceProposedTotals = nextAllowanceRows.reduce(
      (totals, row) => ({
        regularAllowances: totals.regularAllowances + Number(row.proposedEstimate || 0),
        teachingAllowance: totals.teachingAllowance + Number(row.proposedTeachingAllowance || 0),
        medicalCharges: totals.medicalCharges + Number(row.proposedMedicalCharges || 0),
      }),
      {
        regularAllowances: 0,
        teachingAllowance: 0,
        medicalCharges: 0,
      }
    );
    const allowanceRevisedSnapshotTotals = nextAllowanceRows.reduce(
      (totals, row) => ({
        regularAllowances: totals.regularAllowances + Number(row.revisedEstimate || 0),
        teachingAllowance: totals.teachingAllowance + Number(row.revisedTeachingAllowance || 0),
        medicalCharges: totals.medicalCharges + Number(row.revisedMedicalCharges || 0),
      }),
      {
        regularAllowances: 0,
        teachingAllowance: 0,
        medicalCharges: 0,
      }
    );

    setStatementRows((current) =>
      current.map((row) => {
        if (row.id === "pay-officers") {
          return {
            ...row,
            firstFourMonths: officerProposedTotal ? row.firstFourMonths : officerActualFourMonths,
            nextEightMonths: officerProposedTotal ? row.nextEightMonths : officerNextEightMonths,
            revisedEstimate: officerProposedTotal ? row.revisedEstimate : officerRevisedTotal,
            proposedEstimate: officerProposedTotal || row.proposedEstimate,
          };
        }

        if (row.id === "pay-others") {
          return {
            ...row,
            firstFourMonths: payOtherProposedTotal ? row.firstFourMonths : payOtherActualFourMonths,
            nextEightMonths: payOtherProposedTotal ? row.nextEightMonths : payOtherNextEightMonths,
            revisedEstimate: payOtherProposedTotal ? row.revisedEstimate : payOtherRevisedTotal,
            proposedEstimate: payOtherProposedTotal || row.proposedEstimate,
          };
        }

        if (row.id === "regular-allowances") {
          return {
            ...row,
            firstFourMonths: allowanceProposedTotals.regularAllowances
              ? row.firstFourMonths
              : allowanceRevisedSnapshotTotals.regularAllowances
                ? row.firstFourMonths
                : allowanceMonthlyTotals.regularAllowances * 4,
            nextEightMonths: allowanceProposedTotals.regularAllowances
              ? row.nextEightMonths
              : allowanceRevisedSnapshotTotals.regularAllowances
                ? row.nextEightMonths
                : allowanceMonthlyTotals.regularAllowances * 8,
            revisedEstimate: allowanceProposedTotals.regularAllowances
              ? row.revisedEstimate
              : allowanceRevisedSnapshotTotals.regularAllowances || allowanceMonthlyTotals.regularAllowances * 12,
            proposedEstimate: allowanceProposedTotals.regularAllowances || row.proposedEstimate,
          };
        }

        if (row.id === "teaching-allowance" || row.id === "medical-charges") {
          const monthlyTotal =
            row.id === "teaching-allowance"
              ? allowanceMonthlyTotals.teachingAllowance
              : allowanceMonthlyTotals.medicalCharges;
          const proposedTotal =
            row.id === "teaching-allowance"
              ? allowanceProposedTotals.teachingAllowance
              : allowanceProposedTotals.medicalCharges;
          const revisedSnapshotTotal =
            row.id === "teaching-allowance"
              ? allowanceRevisedSnapshotTotals.teachingAllowance
              : allowanceRevisedSnapshotTotals.medicalCharges;

          return {
            ...row,
            firstFourMonths: proposedTotal || revisedSnapshotTotal ? row.firstFourMonths : monthlyTotal * 4,
            nextEightMonths: proposedTotal || revisedSnapshotTotal ? row.nextEightMonths : monthlyTotal * 8,
            revisedEstimate: proposedTotal ? row.revisedEstimate : revisedSnapshotTotal || monthlyTotal * 12,
            proposedEstimate:
              proposedTotal || row.proposedEstimate,
          };
        }

        return row;
      })
    );
    setStatementStatus("draft");
  };

  const resetDummyData = () => {
    setRegularAllowanceRows([]);
    setPayOfficerRows([]);
    setPayOtherRows([]);
    setStatementRows(generateStatementRowsFromEstimates(dummyEstimates, summaryBaseRows, currentYear));
    setStatementStatus("draft");
    setFilterYear(currentYear);
  };

  const changeFilterYear = (year) => {
    setFilterYear(year);
  };

  const regenerateStatement = () => {
    const hasFetchedPayrollRows =
      regularAllowanceRows.length > 0 ||
      payOtherRows.length > 0 ||
      payOfficerRows.some((row) => !String(row.id).startsWith("doc-officer-"));

    if (!hasFetchedPayrollRows) {
      setStatementRows(summaryBaseRows);
      setStatementStatus("draft");
      message.info("Official comparative summary values restored. Add payroll rows to calculate from Payroll Management.");
      return;
    }

    refreshStatementFromRealRows(payOfficerRows, regularAllowanceRows, payOtherRows);
    setStatementStatus("draft");
    message.success("Comparative statement calculated from Payroll data");
  };

  const updateStatementCell = (rowId, field, value) => {
    if (!canManageEstimates) {
      message.warning("Only Accountant can update payroll estimates.");
      return;
    }

    if (selectedEstimateYearArchived) {
      message.warning("Archived estimate years cannot be changed.");
      return;
    }

    setStatementRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;

        const nextRow = { ...row, [field]: Number(value || 0) };
        if (field === "firstFourMonths" || field === "nextEightMonths") {
          nextRow.revisedEstimate = Number(nextRow.firstFourMonths || 0) + Number(nextRow.nextEightMonths || 0);
        }

        return nextRow;
      })
    );
    setStatementStatus("draft");
  };

  const openStatementEditForm = (record) => {
    if (!canManageEstimates) {
      message.info("Only Accountant can edit estimate rows.");
      return;
    }

    if (selectedEstimateYearArchived) {
      message.info("This estimate year is archived and locked.");
      return;
    }

    setEditingStatementRow(record);
    statementForm.setFieldsValue({
      description: record.description,
      actual2023: record.actual2023,
      actual2024: record.actual2024,
      actual2025: record.actual2025,
      firstFourMonths: record.firstFourMonths,
      nextEightMonths: record.nextEightMonths,
      budgetAllocation: record.budgetAllocation,
      proposedEstimate: record.proposedEstimate,
    });
  };

  const closeStatementEditForm = () => {
    setEditingStatementRow(null);
    statementForm.resetFields();
  };

  const saveStatementEditForm = async () => {
    const values = await statementForm.validateFields();

    setStatementRows((current) =>
      current.map((row) => {
        if (row.id !== editingStatementRow.id) return row;

        return {
          ...row,
          description: values.description,
          actual2023: Number(values.actual2023 || 0),
          actual2024: Number(values.actual2024 || 0),
          actual2025: Number(values.actual2025 || 0),
          firstFourMonths: Number(values.firstFourMonths || 0),
          nextEightMonths: Number(values.nextEightMonths || 0),
          revisedEstimate: Number(values.firstFourMonths || 0) + Number(values.nextEightMonths || 0),
          budgetAllocation: Number(values.budgetAllocation || 0),
          proposedEstimate: Number(values.proposedEstimate || 0),
        };
      })
    );
    setStatementStatus("draft");
    closeStatementEditForm();
    message.success("Comparative statement row updated");
  };

  const downloadStatementSheet = () => {
    const headers = [
      "Classification",
      `Actual of Last 03 Years ${actualYearLabels[0]}`,
      `Actual of Last 03 Years ${actualYearLabels[1]}`,
      `Actual of Last 03 Years ${actualYearLabels[2]}`,
      `Actual of 04 Months Jul To Oct ${String(filterYear - 1).slice(-2)}`,
      `Anticipated Nov. ${String(filterYear - 1).slice(-2)} To Jun, ${String(filterYear).slice(-2)}`,
      `Total Revised ${revisedYearLabel}`,
      `Budget Allocation ${fiscalYearFullLabel(filterYear - 1)}`,
      "Variation Col 7 & 8",
      `Proposed Estimates ${proposedYearLabel}`,
    ];
    const rows = statementDisplayRows.map((row) => [
      row.description,
      row.actual2023,
      row.actual2024,
      row.actual2025,
      row.firstFourMonths,
      row.nextEightMonths,
      row.revisedEstimate,
      row.budgetAllocation,
      row.variation,
      row.proposedEstimate,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `payroll-comparative-statement-${filterYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printStatementPdf = () => {
    const rowsHtml = statementDisplayRows
      .map(
        (row) => `
          <tr class="${row.id === "total" ? "total" : ""}">
            <td>${row.description}</td>
            <td>${money(row.actual2023)}</td>
            <td>${money(row.actual2024)}</td>
            <td>${money(row.actual2025)}</td>
            <td>${money(row.firstFourMonths)}</td>
            <td>${money(row.nextEightMonths)}</td>
            <td>${money(row.revisedEstimate)}</td>
            <td>${money(row.budgetAllocation)}</td>
            <td>${money(row.variation)}</td>
            <td>${money(row.proposedEstimate)}</td>
          </tr>
        `
      )
      .join("");
    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      message.error("Popup blocked. Please allow popups to print PDF.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Payroll Comparative Statement</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 18px; }
            h2, h3, p { margin: 0; text-align: center; }
            h2 { font-size: 16px; }
            h3 { font-size: 14px; font-weight: 600; }
            p { margin-bottom: 14px; color: #475569; }
            table { border-collapse: collapse; width: 100%; font-size: 10px; }
            th, td { border: 1px solid #64748b; padding: 6px; text-align: right; }
            th { background: #e2e8f0; color: #0f172a; }
            td:first-child, th:first-child { text-align: left; }
            .total td { background: #e0f2fe; font-weight: 700; }
            @page { size: landscape; margin: 10mm; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h2>FG Post Graduate College for Women, Wah Cantt</h2>
          <h3>Comparative Statement Showing the Summary of Proposed Budget Estimates ${proposedYearLabel}</h3>
          <p>and Revised Estimates for the Year of ${fiscalYearFullLabel(filterYear - 1)}</p>
          <table>
            <thead>
              <tr>
                <th>Classification</th>
                <th>Actual ${actualYearLabels[0]}</th>
                <th>Actual ${actualYearLabels[1]}</th>
                <th>Actual ${actualYearLabels[2]}</th>
                <th>Actual of 04 Months (Jul To Oct ${String(filterYear - 1).slice(-2)})</th>
                <th>Anticipated (Nov. ${String(filterYear - 1).slice(-2)} To Jun, ${String(filterYear).slice(-2)})</th>
                <th>Total Revised ${revisedYearLabel}</th>
                <th>Budget Allocation ${fiscalYearFullLabel(filterYear - 1)}</th>
                <th>Variation Col 7 & 8</th>
                <th>Proposed Estimates ${proposedYearLabel}</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const submitStatementToHoi = () => {
    if (!canManageEstimates) {
      message.warning("Only Accountant can submit payroll estimates.");
      return;
    }

    if (selectedEstimateYearArchived) {
      message.warning("Archived estimate years cannot be submitted again.");
      return;
    }

    setStatementStatus("submitted");
    message.success("Comparative statement submitted to HOI for approval.");
  };

  const approveStatement = () => {
    if (!canApproveEstimates) {
      message.warning("Only HOI can approve payroll estimates.");
      return;
    }
    if (statementStatus !== "submitted") {
      message.info("Only submitted estimates can be approved.");
      return;
    }

    setStatementStatus("approved");
    message.success("Payroll estimates approved.");
  };

  const rejectStatement = () => {
    if (!canApproveEstimates) {
      message.warning("Only HOI can reject payroll estimates.");
      return;
    }
    if (statementStatus !== "submitted") {
      message.info("Only submitted estimates can be rejected.");
      return;
    }

    setStatementStatus("rejected");
    message.warning("Payroll estimates rejected.");
  };

  const openArchiveYearModal = () => {
    archiveYearForm.setFieldsValue({
      current_year: filterYear,
      next_year: Number(filterYear) + 1,
      note: `Estimate year ${filterYear} closed. Remaining balances surrendered; next year budget cycle opened.`,
    });
    setArchiveYearModalOpen(true);
  };

  const closeArchiveYearModal = () => {
    setArchiveYearModalOpen(false);
    archiveYearForm.resetFields();
  };

  const archiveEstimateYear = async () => {
    const values = await archiveYearForm.validateFields();
    const year = Number(values.current_year || filterYear);
    const nextYear = Number(values.next_year || year + 1);
    const snapshot = {
      year,
      next_year: nextYear,
      archived_at: new Date().toISOString(),
      note: values.note,
      statement_rows: statementRows,
      other_expenditure_rows: otherExpenditureRows,
      totals: {
        proposed: Number(statementTotal.proposedEstimate || 0),
        revised: Number(statementTotal.revisedEstimate || 0),
        variation: Number(statementTotal.variation || 0),
        other_expenditure_surrendered: Number(otherExpenditureTotal.budgetAllocation - otherExpenditureTotal.totalRevised),
      },
    };
    const nextArchivedYears = { ...archivedEstimateYears, [year]: snapshot };

    setArchivedEstimateYears(nextArchivedYears);
    localStorage.setItem(estimatesArchiveStorageKey, JSON.stringify(nextArchivedYears));
    setFilterYear(nextYear);
    setStatementStatus("draft");
    closeArchiveYearModal();
    message.success(`Estimate year ${year} archived. Working year moved to ${nextYear}.`);
  };

  const openEstimateRecord = (record, type) => {
    if (record.id === "other-total") return;

    if (selectedEstimateYearArchived) {
      message.info("This estimate year is archived and locked.");
    }

    const recordTitle = record.name || record.expenditure;
    setSelectedEstimateRecord({ ...record, type, title: recordTitle });
    setEstimateEditMode(false);
    estimateRecordForm.setFieldsValue(record);
  };

  const closeEstimateRecord = () => {
    setSelectedEstimateRecord(null);
    setEstimateEditMode(false);
    estimateRecordForm.resetFields();
  };

  const saveEstimateRecord = async () => {
    const values = await estimateRecordForm.validateFields();
    if (selectedEstimateYearArchived) {
      message.warning("Archived estimate years cannot be changed.");
      return;
    }

    const type = selectedEstimateRecord.type;

    if (type === "regular") {
      const nextRegularRows = regularAllowanceRows.map((row) => {
        if (row.id !== selectedEstimateRecord.id) return row;
        const nextRow = {
          ...row,
          ...values,
          bps: Number(values.bps || 0),
          hra: Number(values.hra || 0),
          conveyanceAllowance: Number(values.conveyanceAllowance || 0),
          medicalAllowance: Number(values.medicalAllowance || 0),
          integratedAllowance: Number(values.integratedAllowance || 0),
          dra2020: Number(values.dra2020 || 0),
          dra2022: Number(values.dra2022 || 0),
          adhoc2022: Number(values.adhoc2022 || 0),
          adhoc2023: Number(values.adhoc2023 || 0),
          adhoc2024: Number(values.adhoc2024 || 0),
          adhoc2025: Number(values.adhoc2025 || 0),
          dra2025: Number(values.dra2025 || 0),
          medicalCharges: Number(values.medicalCharges || 0),
          teachingAllowance: Number(values.teachingAllowance || 0),
        };

        nextRow.totalAllowances = regularAllowanceFields
          .filter(([field]) => !["medicalCharges", "teachingAllowance"].includes(field))
          .reduce((sum, [field]) => sum + Number(nextRow[field] || 0), 0);
        nextRow.total = Number(nextRow.medicalCharges || 0) + Number(nextRow.teachingAllowance || 0);
        nextRow.grandTotal = nextRow.totalAllowances + nextRow.total;
        return nextRow;
      });

      setRegularAllowanceRows(nextRegularRows);
      refreshStatementFromRealRows(payOfficerRows, nextRegularRows, payOtherRows);
    }

    if (type === "pay-officers" || type === "pay-others") {
      const updatePayRows = (rows) =>
        rows.map((row) => {
          if (row.id !== selectedEstimateRecord.id) return row;
          const actualFourMonths = Number(values.actualFourMonths || 0);
          const anticipatedEightMonths = Number(values.anticipatedEightMonths || 0);
          const incrementAmount = Number(values.incrementAmount || 0);

          return {
            ...row,
            ...values,
            bps: Number(values.bps || 0),
            presentPay: Number(values.presentPay || 0),
            actualFourMonths,
            anticipatedEightMonths,
            incrementRate: Number(values.incrementRate || 0),
            incrementAmount,
            totalRevised: actualFourMonths + anticipatedEightMonths + incrementAmount,
          };
        });

      if (type === "pay-officers") {
        const nextPayOfficerRows = updatePayRows(payOfficerRows);
        setPayOfficerRows(nextPayOfficerRows);
        refreshStatementFromRealRows(nextPayOfficerRows, regularAllowanceRows, payOtherRows);
      } else {
        const nextPayOtherRows = updatePayRows(payOtherRows);
        setPayOtherRows(nextPayOtherRows);
        refreshStatementFromRealRows(payOfficerRows, regularAllowanceRows, nextPayOtherRows);
      }
    }

    if (type === "other-expenditure") {
      setOtherExpenditureRows((current) =>
        current.map((row) => {
          if (row.id !== selectedEstimateRecord.id) return row;
          const actualFourMonths = Number(values.actualFourMonths || 0);
          const anticipatedExpenditure = Number(values.anticipatedExpenditure || 0);

          return {
            ...row,
            ...values,
            budgetAllocation: Number(values.budgetAllocation || 0),
            actualFourMonths,
            anticipatedExpenditure,
            totalRevised: actualFourMonths + anticipatedExpenditure,
            proposedEstimate: Number(values.proposedEstimate || 0),
          };
        })
      );
      setStatementStatus("draft");
    }

    message.success("Estimate record updated");
    closeEstimateRecord();
  };

  if (!canViewEstimates) {
    return <AccessDenied title="Estimates Management" />;
  }

  const renderEditableMoney = (field) => (value, record) => {
    if (record.id === "total" || !canManageEstimates || selectedEstimateYearArchived) return money(value);

    return (
      <InputNumber
        controls={false}
        min={0}
        value={Number(value || 0)}
        formatter={(inputValue) => `${inputValue}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        parser={(inputValue) => inputValue?.replace(/,/g, "") || "0"}
        onChange={(nextValue) => updateStatementCell(record.id, field, nextValue)}
        className="estimate-statement-input"
      />
    );
  };

  const summaryColumns = [
    {
      title: "Classification",
      dataIndex: "description",
      key: "description",
      fixed: "left",
      width: 220,
      render: (value, record) => <Text strong={record.id === "total"}>{value}</Text>,
    },
    {
      title: "Actual of Last 03 Years",
      children: [
        { title: actualYearLabels[0], dataIndex: "actual2023", key: "actual2023", align: "right", render: renderEditableMoney("actual2023") },
        { title: actualYearLabels[1], dataIndex: "actual2024", key: "actual2024", align: "right", render: renderEditableMoney("actual2024") },
        { title: actualYearLabels[2], dataIndex: "actual2025", key: "actual2025", align: "right", render: renderEditableMoney("actual2025") },
      ],
    },
    {
      title: "Actual of Last 12 Months",
      children: [
        { title: `Actual of 04 Months (Jul To Oct ${String(filterYear - 1).slice(-2)})`, dataIndex: "firstFourMonths", key: "firstFourMonths", align: "right", render: renderEditableMoney("firstFourMonths") },
        { title: `Anticipated (Nov. ${String(filterYear - 1).slice(-2)} To Jun, ${String(filterYear).slice(-2)})`, dataIndex: "nextEightMonths", key: "nextEightMonths", align: "right", render: renderEditableMoney("nextEightMonths") },
      ],
    },
    {
      title: `Total Revised Estimates ${revisedYearLabel}`,
      dataIndex: "revisedEstimate",
      key: "revisedEstimate",
      align: "right",
      render: renderEditableMoney("revisedEstimate"),
    },
    {
      title: `Budget Allocation ${fiscalYearFullLabel(filterYear - 1)}`,
      dataIndex: "budgetAllocation",
      key: "budgetAllocation",
      align: "right",
      render: renderEditableMoney("budgetAllocation"),
    },
    {
      title: "Variation Col 7 & 8",
      dataIndex: "variation",
      key: "variation",
      align: "right",
      render: (value) => (
        <Text className={Number(value) >= 0 ? "estimate-positive" : "estimate-negative"}>
          {money(value)}
        </Text>
      ),
    },
    {
      title: `Proposed Estimates ${proposedYearLabel}`,
      dataIndex: "proposedEstimate",
      key: "proposedEstimate",
      align: "right",
      render: renderEditableMoney("proposedEstimate"),
    },
    {
      title: "Edit",
      key: "edit",
      fixed: "right",
      width: 86,
      render: (_, record) =>
        record.id === "total" || !canManageEstimates || selectedEstimateYearArchived ? null : (
          <Button size="small" icon={<EditOutlined />} onClick={() => openStatementEditForm(record)}>
            Edit
          </Button>
        ),
    },
  ];

  const regularAllowanceColumns = [
    { title: "Name", dataIndex: "name", key: "name", fixed: "left", width: 160 },
    { title: "Designation", dataIndex: "designation", key: "designation", width: 130 },
    { title: "BPS", dataIndex: "bps", key: "bps", width: 70 },
    ...regularAllowanceFields.map(([field, label]) => ({
      title: label,
      dataIndex: field,
      key: field,
      align: "right",
      render: money,
      width: 120,
    })),
    { title: "Total Alces", dataIndex: "totalAllowances", key: "totalAllowances", align: "right", render: money, width: 130 },
    { title: "Total", dataIndex: "total", key: "total", align: "right", render: money, width: 120 },
    { title: "G.Total", dataIndex: "grandTotal", key: "grandTotal", align: "right", render: money, width: 130 },
  ];

  const payOfficerColumns = [
    { title: "Sr No", key: "serial", width: 70, render: (_, __, index) => index + 1 },
    { title: "Name", dataIndex: "name", key: "name", fixed: "left", width: 170 },
    { title: "Designation", dataIndex: "designation", key: "designation", width: 140 },
    { title: "BPS", dataIndex: "bps", key: "bps", width: 70 },
    { title: "Min Pay", dataIndex: "minPay", key: "minPay", align: "right", render: money, width: 120 },
    { title: "Max Pay", dataIndex: "maxPay", key: "maxPay", align: "right", render: money, width: 120 },
    { title: "Pay Actual Being Drawn at Present", dataIndex: "presentPay", key: "presentPay", align: "right", render: money, width: 160 },
    { title: "Actual Exp 4 Months", dataIndex: "actualFourMonths", key: "actualFourMonths", align: "right", render: money, width: 150 },
    { title: "Anticipated Exp 8 Months", dataIndex: "anticipatedEightMonths", key: "anticipatedEightMonths", align: "right", render: money, width: 170 },
    { title: "Date of Next Increment", dataIndex: "incrementDate", key: "incrementDate", width: 150 },
    { title: "Rate of Increment", dataIndex: "incrementRate", key: "incrementRate", align: "right", render: money, width: 140 },
    { title: "Amount of Increment", dataIndex: "incrementAmount", key: "incrementAmount", align: "right", render: money, width: 150 },
    { title: `Total Revised Estimates ${fiscalYearFullLabel(filterYear - 1)}`, dataIndex: "totalRevised", key: "totalRevised", align: "right", render: money, width: 180 },
  ];

  const otherExpenditureColumns = [
    { title: "Group", dataIndex: "group", key: "group", fixed: "left", width: 160 },
    { title: "Expenditure", dataIndex: "expenditure", key: "expenditure", fixed: "left", width: 230 },
    { title: `Budget Allocation ${fiscalYearFullLabel(filterYear - 1)}`, dataIndex: "budgetAllocation", key: "budgetAllocation", align: "right", render: money, width: 180 },
    { title: `Actual Exp (Jul To Oct, ${String(filterYear - 1).slice(-2)})`, dataIndex: "actualFourMonths", key: "actualFourMonths", align: "right", render: money, width: 170 },
    { title: `Anticipated Exp (Nov, ${String(filterYear - 1).slice(-2)} To Jun, ${String(filterYear).slice(-2)})`, dataIndex: "anticipatedExpenditure", key: "anticipatedExpenditure", align: "right", render: money, width: 210 },
    { title: `Total Revised Estimates ${fiscalYearFullLabel(filterYear - 1)}`, dataIndex: "totalRevised", key: "totalRevised", align: "right", render: money, width: 200 },
    {
      title: "Remaining Budget After Deduction",
      dataIndex: "remainingBudget",
      key: "remainingBudget",
      align: "right",
      render: (value) => <Text className={Number(value) >= 0 ? "estimate-positive" : "estimate-negative"}>{money(value)}</Text>,
      width: 210,
    },
    { title: `Proposed Estimates ${proposedYearLabel}`, dataIndex: "proposedEstimate", key: "proposedEstimate", align: "right", render: money, width: 200 },
  ];

  return (
    <div className="estimates-page">
      <div className="estimates-hero">
        <div>
          <Text type="secondary" className="page-kicker">ESTIMATES MANAGEMENT</Text>
          <Title level={2} className="page-title">Payroll Estimates</Title>
          <Text type="secondary">
            Payroll data is fetched from Payroll Management and used here to calculate allowance and officers pay estimates.
          </Text>
        </div>
        <Space wrap>
          <Select value={filterYear} onChange={changeFilterYear} options={yearOptions} style={{ width: 160 }} />
          {selectedEstimateYearArchived ? <Tag color="default">Archived</Tag> : null}
          {canManageEstimates ? (
            <Button danger onClick={openArchiveYearModal} disabled={selectedEstimateYearArchived}>
              Archive Year
            </Button>
          ) : null}
          <Button icon={<ReloadOutlined />} onClick={useDummyEstimateData ? resetDummyData : () => loadEstimates(filterYear)} loading={loading}>
            {useDummyEstimateData ? "Clear Data" : "Refresh"}
          </Button>
        </Space>
      </div>

      <Row gutter={[14, 14]}>
        <Col xs={12} lg={6}>
          <Card bordered={false} className="estimate-summary-card estimate-summary-blue">
            <Text type="secondary">Proposed Total</Text>
            <Title level={3}>{money(statementTotal.proposedEstimate || 0)}</Title>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} className="estimate-summary-card estimate-summary-green">
            <Text type="secondary">Revised Total</Text>
            <Title level={3}>{money(statementTotal.revisedEstimate || 0)}</Title>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} className="estimate-summary-card estimate-summary-gold">
            <Text type="secondary">Variation Col 7 & 8</Text>
            <Title level={3} className={Number(statementTotal.variation || 0) >= 0 ? "estimate-positive" : "estimate-negative"}>
              {money(statementTotal.variation || 0)}
            </Title>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} className="estimate-summary-card estimate-summary-purple">
            <Text type="secondary">Other Exp Balance</Text>
            <Title level={3}>{money(otherExpenditureTotal.budgetAllocation - otherExpenditureTotal.totalRevised)}</Title>
          </Card>
        </Col>
      </Row>

      {canViewEstimates ? (
        <Card bordered={false} className="estimate-panel estimate-entry-panel" title="Calculated Revised Estimates from Payroll">
          <Tabs
            items={[
              {
                key: "regular-allowances",
                label: "Regular Allowances",
                children: (
                  <div className="estimate-real-entry">
                    <Table
                      className="estimate-table estimate-statement-table"
                      columns={regularAllowanceColumns}
                      dataSource={regularAllowanceRows}
                      rowKey="id"
                      size="small"
                      scroll={{ x: 2200 }}
                      pagination={{ pageSize: 8, size: "small" }}
                      onRow={(record) => ({ onClick: () => openEstimateRecord(record, "regular") })}
                      rowClassName={() => "estimate-clickable-row"}
                      locale={{ emptyText: <Empty description="No payroll staff found. Add staff allowances in Payroll Management first." /> }}
                    />
                  </div>
                ),
              },
              {
                key: "pay-officers",
                label: "Pay of Officers",
                children: (
                  <div className="estimate-real-entry">
                    <Table
                      className="estimate-table estimate-statement-table"
                      columns={payOfficerColumns}
                      dataSource={payOfficerRows}
                      rowKey="id"
                      size="small"
                      scroll={{ x: 1600 }}
                      pagination={{ pageSize: 8, size: "small" }}
                      onRow={(record) => ({ onClick: () => openEstimateRecord(record, "pay-officers") })}
                      rowClassName={() => "estimate-clickable-row"}
                      locale={{ emptyText: <Empty description="No BPS 17+ payroll staff found. Add officers in Payroll Management first." /> }}
                    />
                  </div>
                ),
              },
              {
                key: "pay-others",
                label: "Pay of Others",
                children: (
                  <div className="estimate-real-entry">
                    <Table
                      className="estimate-table estimate-statement-table"
                      columns={payOfficerColumns}
                      dataSource={payOtherRows}
                      rowKey="id"
                      size="small"
                      scroll={{ x: 1600 }}
                      pagination={{ pageSize: 8, size: "small" }}
                      onRow={(record) => ({ onClick: () => openEstimateRecord(record, "pay-others") })}
                      rowClassName={() => "estimate-clickable-row"}
                      locale={{ emptyText: <Empty description={`No non-gazetted payroll staff found for ${proposedYearLabel}.`} /> }}
                    />
                  </div>
                ),
              },
              {
                key: "other-expenditure",
                label: "Other Expenditure",
                children: (
                  <div className="estimate-real-entry">
                    <Table
                      className="estimate-table estimate-statement-table"
                      columns={otherExpenditureColumns}
                      dataSource={otherExpenditureDisplayRows}
                      rowKey="id"
                      size="small"
                      scroll={{ x: 1500 }}
                      pagination={false}
                      onRow={(record) => ({ onClick: () => openEstimateRecord(record, "other-expenditure") })}
                      rowClassName={(record) =>
                        record.id === "other-total" ? "estimate-total-row" : "estimate-clickable-row"
                      }
                    />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      ) : null}

      <Card
        bordered={false}
        className="estimate-panel estimate-summary-statement"
        title={
          <Space wrap>
            <span>Summary of Proposed Budget {proposedYearLabel} and Revised Estimates {fiscalYearFullLabel(filterYear - 1)}</span>
            <Tag
              color={{
                draft: "default",
                submitted: "processing",
                approved: "success",
                rejected: "error",
              }[statementStatus] || "default"}
            >
              {{
                draft: "Draft",
                submitted: "Submitted to HOI",
                approved: "Approved by HOI",
                rejected: "Rejected by HOI",
              }[statementStatus] || "Draft"}
            </Tag>
          </Space>
        }
        extra={
          <Space wrap>
            {canManageEstimates ? (
              <Button size="small" icon={<CalculatorOutlined />} onClick={regenerateStatement}>
                Generate
              </Button>
            ) : null}
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadStatementSheet}>
              Sheet
            </Button>
            <Button size="small" icon={<PrinterOutlined />} onClick={printStatementPdf}>
              PDF
            </Button>
            {canManageEstimates ? (
              <Button type="primary" size="small" icon={<SendOutlined />} onClick={submitStatementToHoi}>
                Submit to HOI
              </Button>
            ) : null}
            {canApproveEstimates ? (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={approveStatement}
                  disabled={statementStatus !== "submitted"}
                >
                  Approve
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={rejectStatement}
                  disabled={statementStatus !== "submitted"}
                >
                  Reject
                </Button>
              </>
            ) : null}
          </Space>
        }
      >
        <Table
          className="estimate-table estimate-statement-table"
          columns={summaryColumns}
          dataSource={statementDisplayRows}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ x: 1580 }}
          rowClassName={(record) => (record.id === "total" ? "estimate-total-row" : "")}
        />
      </Card>

      <Modal
        open={Boolean(editingStatementRow)}
        title={editingStatementRow ? `Edit ${editingStatementRow.description}` : "Edit statement row"}
        onCancel={closeStatementEditForm}
        footer={null}
        width={760}
        destroyOnHidden
      >
        <Form form={statementForm} layout="vertical" onFinish={saveStatementEditForm}>
          <Form.Item label="Classification" name="description" rules={[{ required: true, message: "Enter classification" }]}>
            <Input />
          </Form.Item>
          <Row gutter={14}>
            <Col xs={24} md={8}>
              <Form.Item label="Actual 2022-23" name="actual2023">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Actual 2023-24" name="actual2024">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Actual 2024-25" name="actual2025">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Actual first 4 months" name="firstFourMonths">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Estimate next 8 months" name="nextEightMonths">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={`Budget Allocation ${fiscalYearFullLabel(filterYear - 1)}`} name="budgetAllocation">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={`Proposed ${fiscalYearShortLabel(filterYear)}`} name="proposedEstimate">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Space className="estimate-modal-actions">
            <Button onClick={closeStatementEditForm}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Save Row
            </Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        open={Boolean(selectedEstimateRecord)}
        title={selectedEstimateRecord?.title || "Estimate record"}
        className="estimate-record-modal"
        onCancel={closeEstimateRecord}
        width={920}
        destroyOnHidden
        footer={
          <Space>
            <Button onClick={closeEstimateRecord}>Close</Button>
            {estimateEditMode && canManageEstimates ? (
              <Button type="primary" icon={<SaveOutlined />} onClick={saveEstimateRecord}>
                Save
              </Button>
            ) : canManageEstimates ? (
              <Button
                type="primary"
                icon={<EditOutlined />}
                disabled={selectedEstimateYearArchived}
                onClick={() => setEstimateEditMode(true)}
              >
                Edit
              </Button>
            ) : null}
          </Space>
        }
      >
        {selectedEstimateRecord ? (
          <Form form={estimateRecordForm} layout="vertical" disabled={!estimateEditMode}>
            {selectedEstimateRecord.type === "regular" ? (
              <>
                <Row gutter={14}>
                  <Col xs={24} md={10}>
                    <Form.Item label="Name" name="name">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Designation" name="designation">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item label="BPS" name="bps">
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={14}>
                  {regularAllowanceFields.map(([field, label]) => (
                    <Col xs={24} md={8} key={field}>
                      <Form.Item label={label} name={field}>
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </>
            ) : null}

            {selectedEstimateRecord.type === "pay-officers" || selectedEstimateRecord.type === "pay-others" ? (
              <>
                <Row gutter={14}>
                  <Col xs={24} md={10}>
                    <Form.Item label="Name" name="name">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Designation" name="designation">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item label="BPS" name="bps">
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Pay Actual Being Drawn" name="presentPay">
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Actual Exp 4 Months" name="actualFourMonths">
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Anticipated Exp 8 Months" name="anticipatedEightMonths">
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Date of Next Increment" name="incrementDate">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Rate of Increment" name="incrementRate">
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Amount of Increment" name="incrementAmount">
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ) : null}

            {selectedEstimateRecord.type === "other-expenditure" ? (
              <Row gutter={14}>
                <Col xs={24} md={8}>
                  <Form.Item label="Group" name="group">
                    <Select
                      options={[
                        { value: "Operating Expenses", label: "Operating Expenses" },
                        { value: "Physical Assets", label: "Physical Assets" },
                        { value: "Repair & Maintenance", label: "Repair & Maintenance" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                  <Form.Item label="Expenditure" name="expenditure">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label={`Budget Allocation ${fiscalYearFullLabel(filterYear - 1)}`} name="budgetAllocation">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label={`Actual Exp Jul To Oct ${String(filterYear - 1).slice(-2)}`} name="actualFourMonths">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label={`Anticipated Exp Nov ${String(filterYear - 1).slice(-2)} To Jun ${String(filterYear).slice(-2)}`} name="anticipatedExpenditure">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label={`Proposed ${proposedYearLabel}`} name="proposedEstimate">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            ) : null}
          </Form>
        ) : null}
      </Modal>

      <Modal
        open={archiveYearModalOpen}
        title={`Archive estimate year ${filterYear}`}
        onCancel={closeArchiveYearModal}
        onOk={archiveEstimateYear}
        okText="Archive and open next year"
        okButtonProps={{ danger: true }}
        destroyOnHidden
      >
        <Form form={archiveYearForm} layout="vertical">
          <Row gutter={14}>
            <Col xs={24} md={12}>
              <Form.Item label="Current year" name="current_year">
                <InputNumber disabled style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Next working year" name="next_year" rules={[{ required: true, message: "Enter next year" }]}>
                <InputNumber min={2000} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Year note" name="note" rules={[{ required: true, message: "Enter archive note" }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Text type="secondary">
            Remaining budget balances are saved as surrendered in the archive snapshot. This year will become read-only.
          </Text>
        </Form>
      </Modal>
    </div>
  );
};

export default EstimatesManagement;

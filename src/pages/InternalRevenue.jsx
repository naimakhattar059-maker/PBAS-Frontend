import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from "antd";
import { DownloadOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import {
  createInternalRevenueRecord,
  createRevenueHead,
  deleteRevenueHead,
  listInternalRevenueCells,
  listInternalRevenueRecords,
  listRevenueHeads,
  updateRevenueHead,
  saveInternalRevenueCells,
} from "../api/internalRevenue";
import AccessDenied from "../components/AccessDenied";
import { hasPermission } from "../utils/permissions";
import "./InternalRevenue.css";

const { Title, Text } = Typography;

const initialSheetRows = [
  ["  (BS & Inter Cash Book) ", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["BS FUNDS", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "INTER FUNDS", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["Entry No", "Admin (G,F,B)", "", "", "BS Stdf(S,M,I)", "", "", "Academic (L,L,C,E)", "", "", "", "TVF ", "Trp Fund", "Uni Dues", "Total BS", "IDF", "IT", "Exam", "Trp Fund", "Sec Refund INTER/BS", "Total INTER", "Reg Funds", "", "", "", "Govt Dues", "Proj Amt / Other", "Grand Total"],
  ["", "GEN", "FUR", "BLDNG", "SPORTS", "MAG", "ID", "LAB", "LIB", "COMP", "EXAM", "", "", "", "", "", "", "", "", "", "", "RSF", "RDF", "CSF", "CDF", "", "", ""],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["T. Exp", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["Clos", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
];

const storageKey = "internalRevenueRowsV4";
const revenueMonthStorageKey = "internalRevenueMonth";
const columnCount = initialSheetRows[0].length;
const defaultRevenueMonth = "2026-07-01";
const dataStartRow = 4;
const totalBsColumn = 14;
const totalInterColumn = 20;
const grandTotalColumn = 27;
const formulaColumns = new Set([totalBsColumn, totalInterColumn, grandTotalColumn]);

const recordTypeOptions = [
  { key: "bs", title: "BS Funds", description: "Admin, BS Student Fund, Academic, TVF, transport and university dues" },
  { key: "inter", title: "Inter Funds", description: "IDF, IT, exam, transport and refund entries" },
  { key: "others", title: "Others", description: "Registration funds, government dues, project amount and other revenue" },
  { key: "non_public", title: "Non Public Fund", description: "Record non-public fund receipts and expense/cutting entries" },
];

const nonPublicFundOptions = [
  { value: "idf", label: "IDF" },
  { value: "exam", label: "Exam" },
  { value: "bs", label: "BS" },
  { value: "other", label: "Other" },
];

const nonPublicExpenseOptions = [
  { value: "postage", label: "Postage" },
  { value: "tel", label: "Telephone" },
  { value: "gas", label: "Gas" },
  { value: "water", label: "Water" },
  { value: "elec", label: "Electricity" },
  { value: "stationery", label: "Stationery" },
  { value: "poll_charges_public", label: "Poll charges public" },
  { value: "poll_charges_private", label: "Poll charges private" },
  { value: "newspaper", label: "Newspaper" },
  { value: "advertisement", label: "Advertisement / publicity" },
  { value: "others", label: "Others" },
];

const optionLabel = (options, value, fallback = "—") =>
  options.find((option) => option.value === value)?.label || value || fallback;

const recordFieldGroups = {
  bs: [
    { column: 0, label: "Entry No" },
    { column: 1, label: "Admin - GEN" },
    { column: 2, label: "Admin - FUR" },
    { column: 3, label: "Admin - BLDNG" },
    { column: 4, label: "BS Stdf - SPORTS" },
    { column: 5, label: "BS Stdf - MAG" },
    { column: 6, label: "BS Stdf - ID" },
    { column: 7, label: "Academic - LAB" },
    { column: 8, label: "Academic - LIB" },
    { column: 9, label: "Academic - COMP" },
    { column: 10, label: "Academic - EXAM" },
    { column: 11, label: "TVF" },
    { column: 12, label: "Trp Fund" },
    { column: 13, label: "Uni Dues" },
  ],
  inter: [
    { column: 0, label: "Entry No" },
    { column: 15, label: "IDF" },
    { column: 16, label: "IT" },
    { column: 17, label: "Exam" },
    { column: 18, label: "Trp Fund" },
    { column: 19, label: "Sec Refund INTER/BS" },
  ],
  others: [
    { column: 0, label: "Entry No" },
    { column: 21, label: "Reg Funds - RSF" },
    { column: 22, label: "Reg Funds - RDF" },
    { column: 23, label: "Reg Funds - CSF" },
    { column: 24, label: "Reg Funds - CDF" },
    { column: 25, label: "Govt Dues" },
    { column: 26, label: "Proj Amt / Other" },
  ],
};

const cloneRows = (rows) => rows.map((row) => Array.from({ length: columnCount }, (_, index) => row[index] ?? ""));
const blankRow = () => Array.from({ length: columnCount }, () => "");
const cellKey = (rowIndex, columnIndex) => `${rowIndex}:${columnIndex}`;
const periodFromMonth = (month) => dayjs(month || defaultRevenueMonth).format("YYYY-MM");
const numberValue = (value) => {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
const formatCalculated = (value) => (value ? String(value) : "");
const formatCurrency = (value) => `PKR ${new Intl.NumberFormat("en-PK").format(numberValue(value))}`;
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const findSummaryIndex = (rows, label) => rows.findIndex((row) => row[0] === label);
const isBlankDataRow = (row) => row.every((value) => String(value || "").trim() === "");

const applyFormulas = (rawRows) => {
  const rows = cloneRows(rawRows);
  const totalRowIndex = findSummaryIndex(rows, "T. Exp");
  const closingRowIndex = findSummaryIndex(rows, "Clos");
  const lastDataRow = totalRowIndex > dataStartRow ? totalRowIndex : rows.length;

  for (let rowIndex = dataStartRow; rowIndex < lastDataRow; rowIndex += 1) {
    rows[rowIndex][totalBsColumn] = formatCalculated(
      rows[rowIndex].slice(1, totalBsColumn).reduce((sum, value) => sum + numberValue(value), 0)
    );
    rows[rowIndex][totalInterColumn] = formatCalculated(
      rows[rowIndex].slice(15, totalInterColumn).reduce((sum, value) => sum + numberValue(value), 0)
    );
    rows[rowIndex][grandTotalColumn] = formatCalculated(
      numberValue(rows[rowIndex][totalBsColumn]) +
        numberValue(rows[rowIndex][totalInterColumn]) +
        rows[rowIndex].slice(21, grandTotalColumn).reduce((sum, value) => sum + numberValue(value), 0)
    );
  }

  if (totalRowIndex >= 0) {
    for (let columnIndex = 1; columnIndex < columnCount; columnIndex += 1) {
      rows[totalRowIndex][columnIndex] = formatCalculated(
        rows.slice(dataStartRow, lastDataRow).reduce((sum, row) => sum + numberValue(row[columnIndex]), 0)
      );
    }
  }

  if (closingRowIndex >= 0 && totalRowIndex >= 0) {
    for (let columnIndex = 1; columnIndex < columnCount; columnIndex += 1) {
      rows[closingRowIndex][columnIndex] = rows[totalRowIndex][columnIndex];
    }
  }

  return rows;
};

const normalizeRows = (rows) => applyFormulas(cloneRows(rows));

const readStoredRows = () => {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? normalizeRows(parsed) : normalizeRows(initialSheetRows);
  } catch {
    return normalizeRows(initialSheetRows);
  }
};

const mergeSavedCells = (baseRows, cells) => {
  const maxRowIndex = cells.reduce((max, cell) => Math.max(max, Number(cell.row_index || 0)), baseRows.length - 1);
  const nextRows = cloneRows(baseRows);

  while (nextRows.length <= maxRowIndex) {
    nextRows.push(blankRow());
  }

  cells.forEach((cell) => {
    const rowIndex = Number(cell.row_index);
    const columnIndex = Number(cell.column_index);
    if (rowIndex >= 0 && columnIndex >= 0 && columnIndex < columnCount) {
      nextRows[rowIndex][columnIndex] = cell.value ?? "";
    }
  });

  return normalizeRows(nextRows);
};

const getCellClassName = (row, rowIndex, columnIndex, selectedCell, dirtyCells) => {
  const classes = ["internal-revenue-spreadsheet-cell"];

  if (rowIndex === 0) classes.push("internal-revenue-title-cell");
  if (rowIndex === 1) classes.push("internal-revenue-fund-cell");
  if (rowIndex === 2 || rowIndex === 3) classes.push("internal-revenue-heading-cell");
  if (rowIndex === 8) classes.push("internal-revenue-green-cell");
  if (rowIndex === 9) classes.push("internal-revenue-yellow-cell");
  if (rowIndex === 10) classes.push("internal-revenue-lavender-cell");
  if (row[0] === "T. Exp") classes.push("internal-revenue-total-exp-cell");
  if (row[0] === "Clos") classes.push("internal-revenue-closing-cell");
  if (columnIndex === 15) classes.push("internal-revenue-inter-divider");
  if (columnIndex === 21) classes.push("internal-revenue-reg-divider");
  if (selectedCell.row === rowIndex && selectedCell.column === columnIndex) classes.push("internal-revenue-selected-cell");
  if (dirtyCells.has(cellKey(rowIndex, columnIndex))) classes.push("internal-revenue-dirty-cell");
  if (formulaColumns.has(columnIndex) || row[0] === "T. Exp" || row[0] === "Clos") classes.push("internal-revenue-formula-cell");

  return classes.join(" ");
};

const isEditableCell = (rows, rowIndex, columnIndex) => {
  if (rowIndex <= 3) return false;
  if (rows[rowIndex]?.[0] === "T. Exp" || rows[rowIndex]?.[0] === "Clos") return false;
  return !formulaColumns.has(columnIndex);
};

const exportSections = {
  bs: {
    title: "BS Funds",
    columns: Array.from({ length: 15 }, (_, index) => index),
  },
  inter: {
    title: "Inter Funds",
    columns: [0, 15, 16, 17, 18, 19, 20],
  },
  others: {
    title: "Others Funds",
    columns: [0, 21, 22, 23, 24, 25, 26, 27],
  },
};

const InternalRevenue = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [rows, setRows] = useState(readStoredRows);
  const [revenueMonth, setRevenueMonth] = useState(() => localStorage.getItem(revenueMonthStorageKey) || defaultRevenueMonth);
  const [selectedCell, setSelectedCell] = useState({ row: dataStartRow, column: 0 });
  const [dirtyCells, setDirtyCells] = useState(new Set());
  const [saveState, setSaveState] = useState("idle");
  const [loadState, setLoadState] = useState("loading");
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [recordType, setRecordType] = useState(null);
  const [recordDate, setRecordDate] = useState(() => dayjs(defaultRevenueMonth));
  const [nonPublicRecords, setNonPublicRecords] = useState([]);
  const [revenueHeads, setRevenueHeads] = useState([]);
  const [newHead, setNewHead] = useState({ name: "", code: "" });
  const [editingHeadId, setEditingHeadId] = useState(null);
  const [approvedRequestUtilization, setApprovedRequestUtilization] = useState(0);
  const [recordForm] = Form.useForm();
  const inputRefs = useRef(new Map());
  const rowsRef = useRef(rows);
  const pendingSaveCellsRef = useRef(new Map());
  const saveTimerRef = useRef(null);
  const canViewInternalRevenue = hasPermission(user, "view_budgets");
  const canManageRevenue = hasPermission(user, "manage_internal_revenue");
  const period = periodFromMonth(revenueMonth);

  const revenueSummary = useMemo(() => {
    const calculatedRows = applyFormulas(rows);
    const totalRowIndex = findSummaryIndex(calculatedRows, "T. Exp");
    const lastDataRow = totalRowIndex > dataStartRow ? totalRowIndex : calculatedRows.length;
    const dataTotals = calculatedRows
      .slice(dataStartRow, lastDataRow)
      .map((row) => numberValue(row[grandTotalColumn]));
    const totalReceipts = dataTotals.filter((value) => value > 0).reduce((sum, value) => sum + value, 0);
    const sheetExpenses = Math.abs(dataTotals.filter((value) => value < 0).reduce((sum, value) => sum + value, 0));
    const totalExpenses = sheetExpenses + Number(approvedRequestUtilization || 0);

    return {
      totalInternalRevenue: totalReceipts,
      remainingAmount: totalReceipts - totalExpenses,
      utilizedAmount: totalExpenses,
    };
  }, [approvedRequestUtilization, rows]);

  useEffect(() => {
    rowsRef.current = rows;
    localStorage.setItem(storageKey, JSON.stringify(rows));
  }, [rows]);

  const allCellsForRows = useCallback(
    (nextRows) =>
      nextRows.flatMap((row, rowIndex) =>
        row.map((value, columnIndex) => ({
          row_index: rowIndex,
          column_index: columnIndex,
          value: String(value ?? ""),
        }))
      ),
    []
  );

  const saveCells = useCallback(
    async (cells, replace = false) => {
      if (!token || cells.length === 0) return;

      setSaveState("saving");
      try {
        await saveInternalRevenueCells(token, period, cells, replace);
        setDirtyCells((current) => {
          const next = new Set(current);
          cells.forEach((cell) => next.delete(cellKey(cell.row_index, cell.column_index)));
          return next;
        });
        setSaveState("saved");
      } catch (err) {
        setSaveState("error");
        message.error(err.message || "Internal revenue changes were not saved");
      }
    },
    [period, token]
  );

  const flushPendingSaves = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const cells = Array.from(pendingSaveCellsRef.current.values());
    pendingSaveCellsRef.current.clear();
    saveCells(cells);
  }, [saveCells]);

  const queueCellSave = useCallback(
    (cell) => {
      pendingSaveCellsRef.current.set(cellKey(cell.row_index, cell.column_index), cell);
      setSaveState("saving");

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        flushPendingSaves();
      }, 600);
    },
    [flushPendingSaves]
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!canViewInternalRevenue || !token) return;

    let active = true;
    listInternalRevenueCells(token, period)
      .then((payload) => {
        if (!active) return;
        const savedCells = payload.cells || [];
        if (savedCells.length === 0 && payload.latest_period && payload.latest_period !== period) {
          const nextMonth = `${payload.latest_period}-01`;
          setRevenueMonth(nextMonth);
          localStorage.setItem(revenueMonthStorageKey, nextMonth);
          return;
        }
        const nextRows = savedCells.length ? mergeSavedCells(initialSheetRows, savedCells) : normalizeRows(initialSheetRows);
        setApprovedRequestUtilization(Number(payload.summary?.approved_request_utilization || 0));
        setRows(nextRows);
        setDirtyCells(new Set());
        setLoadState("loaded");
      })
      .catch((err) => {
        if (!active) return;
        setLoadState("error");
        message.error(err.message || "Could not load saved internal revenue cells");
      });

    return () => {
      active = false;
    };
  }, [canViewInternalRevenue, period, token]);

  useEffect(() => {
    if (token && canViewInternalRevenue) listRevenueHeads(token)
      .then((payload) => setRevenueHeads(payload.revenue_heads || []))
      .catch((error) => message.error(error.message));
  }, [token, canViewInternalRevenue]);

  const addRevenueHead = async () => {
    try {
      if (editingHeadId) await updateRevenueHead(token, editingHeadId, newHead);
      else await createRevenueHead(token, newHead);
      const payload = await listRevenueHeads(token);
      setRevenueHeads(payload.revenue_heads || []);
      setNewHead({ name: "", code: "" });
      setEditingHeadId(null);
      message.success(editingHeadId ? "Revenue head updated" : "Revenue head created");
    } catch (error) { message.error(error.message); }
  };

  const removeRevenueHead = (head) => {
    Modal.confirm({
      title: `Delete ${head.name}?`,
      content: "Revenue heads with transactions can be deactivated instead.",
      onOk: async () => {
        try {
          await deleteRevenueHead(token, head.id);
          setRevenueHeads((current) => current.filter((row) => row.id !== head.id));
          message.success("Revenue head deleted");
        } catch (error) { message.error(error.message); }
      },
    });
  };

  useEffect(() => {
    if (!canViewInternalRevenue || !token) return;

    let active = true;
    listInternalRevenueRecords(token, period)
      .then((payload) => {
        if (!active) return;
        setNonPublicRecords(payload.records || []);
      })
      .catch((err) => {
        if (!active) return;
        message.error(err.message || "Could not load non-public fund records");
      });

    return () => {
      active = false;
    };
  }, [canViewInternalRevenue, period, token]);

  const focusCell = useCallback((rowIndex, columnIndex) => {
    const boundedRow = Math.max(0, Math.min(rowIndex, rowsRef.current.length - 1));
    const boundedColumn = Math.max(0, Math.min(columnIndex, columnCount - 1));
    setSelectedCell({ row: boundedRow, column: boundedColumn });
    window.requestAnimationFrame(() => inputRefs.current.get(cellKey(boundedRow, boundedColumn))?.focus());
  }, []);

  const updateCell = (rowIndex, columnIndex, value, saveImmediately = false) => {
    if (!isEditableCell(rowsRef.current, rowIndex, columnIndex)) return;

    setRows((currentRows) => {
      const nextRows = cloneRows(currentRows);
      nextRows[rowIndex][columnIndex] = value;
      const calculatedRows = applyFormulas(nextRows);
      rowsRef.current = calculatedRows;
      return calculatedRows;
    });
    setDirtyCells((current) => new Set(current).add(cellKey(rowIndex, columnIndex)));

    if (saveImmediately) {
      saveCells([{ row_index: rowIndex, column_index: columnIndex, value }]);
    } else {
      queueCellSave({ row_index: rowIndex, column_index: columnIndex, value });
    }
  };

  const handlePaste = (event, startRow, startColumn) => {
    if (!isEditableCell(rowsRef.current, startRow, startColumn)) return;

    const clipboardText = event.clipboardData.getData("text/plain");
    if (!clipboardText.includes("\t") && !clipboardText.includes("\n")) return;

    event.preventDefault();
    const pastedRows = clipboardText.replace(/\r/g, "").split("\n").filter((line, index, lines) => line || index < lines.length - 1);
    const changedCells = [];

    setRows((currentRows) => {
      const nextRows = cloneRows(currentRows);
      pastedRows.forEach((line, rowOffset) => {
        line.split("\t").forEach((value, columnOffset) => {
          const rowIndex = startRow + rowOffset;
          const columnIndex = startColumn + columnOffset;
          if (rowIndex < nextRows.length && columnIndex < columnCount && isEditableCell(nextRows, rowIndex, columnIndex)) {
            nextRows[rowIndex][columnIndex] = value;
            changedCells.push({ row_index: rowIndex, column_index: columnIndex, value });
          }
        });
      });

      const calculatedRows = applyFormulas(nextRows);
      rowsRef.current = calculatedRows;
      return calculatedRows;
    });

    setDirtyCells((current) => {
      const next = new Set(current);
      changedCells.forEach((cell) => next.add(cellKey(cell.row_index, cell.column_index)));
      return next;
    });
    saveCells(changedCells);
  };

  const handleKeyDown = (event, rowIndex, columnIndex) => {
    const moveTo = (nextRow, nextColumn) => {
      event.preventDefault();
      if (isEditableCell(rowsRef.current, rowIndex, columnIndex) && dirtyCells.has(cellKey(rowIndex, columnIndex))) {
        flushPendingSaves();
      }
      focusCell(nextRow, nextColumn);
    };

    if (event.key === "Enter") moveTo(rowIndex + 1, columnIndex);
    if (event.key === "Tab") moveTo(rowIndex, columnIndex + (event.shiftKey ? -1 : 1));
    if (event.key === "ArrowDown") moveTo(rowIndex + 1, columnIndex);
    if (event.key === "ArrowUp") moveTo(rowIndex - 1, columnIndex);
    if (event.key === "ArrowRight") moveTo(rowIndex, columnIndex + 1);
    if (event.key === "ArrowLeft") moveTo(rowIndex, columnIndex - 1);
  };

  const getRecordInsertIndex = () => {
    const totalRowIndex = findSummaryIndex(rowsRef.current, "T. Exp");
    const summaryIndex = totalRowIndex >= 0 ? totalRowIndex : rowsRef.current.length;
    const existingBlankIndex = rowsRef.current.findIndex(
      (row, rowIndex) => rowIndex >= dataStartRow && rowIndex < summaryIndex && isBlankDataRow(row)
    );
    return { existingBlankIndex, summaryIndex };
  };

  const insertRecordRow = (values = {}) => {
    const { existingBlankIndex, summaryIndex } = getRecordInsertIndex();
    const insertAt = existingBlankIndex >= 0 ? existingBlankIndex : summaryIndex;
    const nextRow = blankRow();

    Object.entries(values).forEach(([column, value]) => {
      nextRow[Number(column)] = value ?? "";
    });

    const nextRows =
      existingBlankIndex >= 0
        ? rowsRef.current.map((row, rowIndex) => (rowIndex === existingBlankIndex ? nextRow : row))
        : [...rowsRef.current.slice(0, insertAt), nextRow, ...rowsRef.current.slice(insertAt)];
    const calculatedRows = applyFormulas(nextRows);
    setRows(calculatedRows);
    rowsRef.current = calculatedRows;
    setDirtyCells(new Set());
    saveCells(allCellsForRows(calculatedRows), true);
    focusCell(insertAt, 0);
    return insertAt;
  };

  const openRecordModal = () => {
    setRecordType(null);
    setRecordDate(dayjs(revenueMonth));
    recordForm.resetFields();
    setRecordModalOpen(true);
  };

  const closeRecordModal = () => {
    setRecordModalOpen(false);
    setRecordType(null);
    recordForm.resetFields();
  };

  const selectRecordType = (type) => {
    setRecordType(type);
    recordForm.resetFields();
  };

  const saveNonPublicRecord = async (record) => {
    const payload = await createInternalRevenueRecord(token, record);
    setNonPublicRecords((current) => [payload.record, ...current]);
    listRevenueHeads(token).then((result) => setRevenueHeads(result.revenue_heads || []));
    return payload.record;
  };

  const submitRecordForm = async (values) => {
    if (recordType === "non_public") {
      const selectedHead = revenueHeads.find((head) => head.id === values.revenue_head_id);
      const fundLabel = selectedHead?.name || "Non Public";
      const expenseLabel = nonPublicExpenseOptions.find((option) => option.value === values.expense_head)?.label || "Expense";
      const entryNo = values.entry_no || "";
      const notes = values.notes ? ` - ${values.notes}` : "";
      const receiptAmount = numberValue(values.receipt_amount);
      const expenseAmount = numberValue(values.expense_amount);
      const entriesToSave = [];
      const nextPeriod = recordDate ? recordDate.startOf("month").format("YYYY-MM") : period;

      if (receiptAmount > 0) {
        entriesToSave.push({
          period: nextPeriod,
          entry_no: entryNo,
          fund: fundLabel,
          revenue_head_id: values.revenue_head_id,
          transaction_type: "receipt",
          amount: receiptAmount,
          notes: values.notes,
          rowValues: {
            0: `${entryNo} Non Public Fund ${fundLabel} receipt${notes}`.trim(),
            26: receiptAmount,
          },
        });
      }

      if (expenseAmount > 0) {
        entriesToSave.push({
          period: nextPeriod,
          entry_no: entryNo,
          fund: fundLabel,
          revenue_head_id: values.revenue_head_id,
          transaction_type: "expense",
          expense_head: values.expense_head,
          amount: expenseAmount,
          notes: values.notes,
          rowValues: {
            0: `${entryNo} Non Public Fund ${fundLabel} ${expenseLabel} cutting${notes}`.trim(),
            26: -expenseAmount,
          },
        });
      }

      if (entriesToSave.length === 0) {
        message.error("Enter receipt amount or expense/cutting amount");
        return;
      }

      if (recordDate) {
        const nextMonth = recordDate.startOf("month").format("YYYY-MM-DD");
        setRevenueMonth(nextMonth);
        localStorage.setItem(revenueMonthStorageKey, nextMonth);
      }

      try {
        for (const entry of entriesToSave) {
          const { rowValues, ...recordPayload } = entry;
          await saveNonPublicRecord(recordPayload);
          insertRecordRow(rowValues);
        }
        closeRecordModal();
        message.success("Non Public Fund record added");
      } catch (err) {
        message.error(err.message || "Could not save non-public fund record");
      }
      return;
    }

    const fields = recordFieldGroups[recordType] || [];
    const rowValues = fields.reduce((acc, field) => {
      acc[field.column] = values[`column_${field.column}`] ?? "";
      return acc;
    }, {});

    if (recordType === "others" && recordDate) {
      const nextMonth = recordDate.startOf("month").format("YYYY-MM-DD");
      setRevenueMonth(nextMonth);
      localStorage.setItem(revenueMonthStorageKey, nextMonth);
    }

    insertRecordRow(rowValues);
    closeRecordModal();
    message.success(`${recordTypeOptions.find((option) => option.key === recordType)?.title || "Record"} added`);
  };

  const saveAll = () => {
    pendingSaveCellsRef.current.clear();
    saveCells(allCellsForRows(rowsRef.current), true);
  };

  const resetSheet = () => {
    const nextRows = normalizeRows(initialSheetRows);
    setRows(nextRows);
    rowsRef.current = nextRows;
    setRevenueMonth(defaultRevenueMonth);
    localStorage.setItem(revenueMonthStorageKey, defaultRevenueMonth);
    setDirtyCells(new Set());
    saveCells(allCellsForRows(nextRows), true);
    message.success("Internal revenue sheet restored");
  };

  const handleMonthChange = (date) => {
    const nextMonth = (date || dayjs(defaultRevenueMonth)).startOf("month").format("YYYY-MM-DD");
    setRevenueMonth(nextMonth);
    localStorage.setItem(revenueMonthStorageKey, nextMonth);
  };

  const saveStatus = useMemo(() => {
    if (loadState === "loading") return <Tag color="processing">Loading...</Tag>;
    if (saveState === "saving") return <Tag color="processing">Saving...</Tag>;
    if (saveState === "saved") return <Tag color="success">Saved</Tag>;
    if (saveState === "error") return <Tag color="error">Save failed</Tag>;
    return <Tag>Ready</Tag>;
  }, [loadState, saveState]);

  const nonPublicSummary = useMemo(() => {
    const receipts = nonPublicRecords
      .filter((record) => record.transaction_type === "receipt")
      .reduce((sum, record) => sum + numberValue(record.amount), 0);
    const expenses = nonPublicRecords
      .filter((record) => record.transaction_type === "expense")
      .reduce((sum, record) => sum + numberValue(record.amount), 0);

    return {
      receipts,
      expenses,
      balance: receipts - expenses,
    };
  }, [nonPublicRecords]);

  const nonPublicColumns = [
    {
      title: "Entry No",
      dataIndex: "entry_no",
      key: "entry_no",
      render: (value) => value || "—",
    },
    {
      title: "Fund",
      dataIndex: "fund",
      key: "fund",
      render: (value) => optionLabel(nonPublicFundOptions, value),
    },
    {
      title: "Type",
      dataIndex: "transaction_type",
      key: "transaction_type",
      render: (value) => <Tag color={value === "receipt" ? "green" : "orange"}>{value === "receipt" ? "Receipt" : "Cutting"}</Tag>,
    },
    {
      title: "Expense Head",
      dataIndex: "expense_head",
      key: "expense_head",
      render: (value) => optionLabel(nonPublicExpenseOptions, value),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (value, record) => (
        <Text type={record.transaction_type === "expense" ? "danger" : undefined}>
          {record.transaction_type === "expense" ? "- " : ""}
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (value) => value || "—",
    },
  ];

  const exportSectionToPdf = (sectionKey) => {
    const section = exportSections[sectionKey];
    if (!section) return;

    const printableRows = applyFormulas(rowsRef.current);
    const htmlRows = printableRows
      .map(
        (row) => `
          <tr>
            ${section.columns
              .map((columnIndex) => `<td>${escapeHtml(row[columnIndex])}</td>`)
              .join("")}
          </tr>`
      )
      .join("");
    const htmlHeaders = section.columns
      .map((columnIndex) => `<th>${columnIndex + 1}</th>`)
      .join("");
    const exportWindow = window.open("", "_blank", "noopener,noreferrer");

    if (!exportWindow) {
      message.error("Please allow popups to export the PDF.");
      return;
    }

    exportWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(section.title)} - ${escapeHtml(period)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1 { margin: 0 0 4px; font-size: 22px; }
            p { margin: 0 0 18px; color: #475569; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th, td { border: 1px solid #cbd5e1; padding: 7px 8px; font-size: 11px; text-align: center; word-break: break-word; }
            th { background: #e0f2fe; font-weight: 700; }
            tr:nth-child(2), tr:nth-child(3) { background: #e6b8b7; font-weight: 700; }
            tr:nth-child(4), tr:nth-child(5) { font-weight: 700; }
            @page { size: landscape; margin: 12mm; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(section.title)}</h1>
          <p>Internal Revenue - ${escapeHtml(dayjs(revenueMonth).format("MMM-YY"))}</p>
          <table>
            <thead><tr>${htmlHeaders}</tr></thead>
            <tbody>${htmlRows}</tbody>
          </table>
          <script>
            window.onload = () => {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    exportWindow.document.close();
  };

  if (!canViewInternalRevenue) {
    return <AccessDenied title="Internal Revenue" />;
  }

  return (
    <div className="internal-revenue-page">
      <div className="internal-revenue-header">
        <div>
          <Title level={3}>Internal Revenue</Title>
          <Text type="secondary">BS & Inter Cash Book spreadsheet with editable saved cells and automatic totals.</Text>
        </div>
        <Space wrap>
          {saveStatus}
          <DatePicker
            picker="month"
            allowClear={false}
            format="MMM-YY"
            value={dayjs(revenueMonth)}
            onChange={handleMonthChange}
          />
          {canManageRevenue && <Button icon={<ReloadOutlined />} onClick={resetSheet}>Restore File Data</Button>}
          {canManageRevenue && <Button icon={<SaveOutlined />} onClick={saveAll}>Save</Button>}
          {canManageRevenue && <Button type="primary" icon={<PlusOutlined />} onClick={openRecordModal}>Add Record</Button>}
        </Space>
      </div>

      <div className="internal-revenue-summary-grid">
        <Card className="internal-revenue-summary-card internal-revenue-summary-total" bordered={false}>
          <Text className="internal-revenue-summary-label">Total Internal Revenue</Text>
          <Title level={3}>{formatCurrency(revenueSummary.totalInternalRevenue)}</Title>
          <Text type="secondary">Calculated from Grand Total</Text>
        </Card>
        <Card className="internal-revenue-summary-card internal-revenue-summary-remaining" bordered={false}>
          <Text className="internal-revenue-summary-label">Remaining Amount</Text>
          <Title level={3}>{formatCurrency(revenueSummary.remainingAmount)}</Title>
          <Text type="secondary">From closing row</Text>
        </Card>
        <Card className="internal-revenue-summary-card internal-revenue-summary-utilized" bordered={false}>
          <Text className="internal-revenue-summary-label">Utilized Amount</Text>
          <Title level={3}>{formatCurrency(revenueSummary.utilizedAmount)}</Title>
          <Text type="secondary">Approved requests plus expense row</Text>
        </Card>
      </div>

      <Card title="Revenue heads" style={{ marginBottom: 16 }}>
        <Space wrap>{revenueHeads.map((head) => <Space key={head.id} size={4}>
          <Tag color={head.active ? "blue" : "default"}>{head.name}: {formatCurrency(head.balance)}{head.active ? "" : " (inactive)"}</Tag>
          {canManageRevenue && <Button size="small" onClick={() => {
            setEditingHeadId(head.id);
            setNewHead({ name: head.name, code: head.code });
          }}>Edit</Button>}
          {canManageRevenue && <Button size="small" onClick={async () => {
            try {
              await updateRevenueHead(token, head.id, { active: !head.active });
              const payload = await listRevenueHeads(token);
              setRevenueHeads(payload.revenue_heads || []);
            } catch (error) { message.error(error.message); }
          }}>{head.active ? "Deactivate" : "Activate"}</Button>}
          {canManageRevenue && <Button size="small" danger onClick={() => removeRevenueHead(head)}>Delete</Button>}
        </Space>)}</Space>
        {canManageRevenue && <Space wrap style={{ marginTop: 12 }}>
          <Input placeholder="Head code" value={newHead.code} onChange={(event) => setNewHead({ ...newHead, code: event.target.value })} />
          <Input placeholder="Head name" value={newHead.name} onChange={(event) => setNewHead({ ...newHead, name: event.target.value })} />
          <Button onClick={addRevenueHead}>{editingHeadId ? "Save revenue head" : "Add revenue head"}</Button>
          {editingHeadId && <Button onClick={() => { setEditingHeadId(null); setNewHead({ name: "", code: "" }); }}>Cancel</Button>}
        </Space>}
      </Card>

      <Card
        bordered={false}
        className="internal-revenue-card internal-revenue-non-public-card"
        title="Non Public Fund Entries"
        extra={
          <Space wrap>
            <Tag color="green">Receipts: {formatCurrency(nonPublicSummary.receipts)}</Tag>
            <Tag color="orange">Cutting: {formatCurrency(nonPublicSummary.expenses)}</Tag>
            <Tag color="blue">Balance: {formatCurrency(nonPublicSummary.balance)}</Tag>
          </Space>
        }
      >
        <Table
          className="internal-revenue-record-table"
          columns={nonPublicColumns}
          dataSource={nonPublicRecords}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5, size: "small" }}
          locale={{ emptyText: "No non-public fund entries yet" }}
        />
      </Card>

      <Card bordered={false} className="internal-revenue-card">
        <div className="internal-revenue-export-bar">
          <Text strong>Export PDF</Text>
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={() => exportSectionToPdf("bs")}>BS Funds</Button>
            <Button icon={<DownloadOutlined />} onClick={() => exportSectionToPdf("inter")}>Inter Funds</Button>
            <Button icon={<DownloadOutlined />} onClick={() => exportSectionToPdf("others")}>Others Funds</Button>
          </Space>
        </div>
        <div className="internal-revenue-table-shell" role="region" aria-label="Internal revenue spreadsheet">
          <table className="internal-revenue-spreadsheet">
            <thead>
              <tr>
                {Array.from({ length: columnCount }, (_, index) => (
                  <th key={index} className={index === 15 ? "internal-revenue-inter-divider" : index === 21 ? "internal-revenue-reg-divider" : undefined}>
                    {index + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((value, columnIndex) => {
                    const editable = isEditableCell(rows, rowIndex, columnIndex);
                    const className = getCellClassName(row, rowIndex, columnIndex, selectedCell, dirtyCells);

                    if (rowIndex === 1 && columnIndex === 21) {
                      return (
                        <td key={columnIndex} className={className}>
                          <DatePicker
                            picker="month"
                            allowClear={false}
                            format="MMM-YY"
                            value={dayjs(revenueMonth)}
                            className="internal-revenue-month-picker"
                            onChange={handleMonthChange}
                          />
                        </td>
                      );
                    }

                    return (
                      <td key={columnIndex} className={className} onMouseDown={() => setSelectedCell({ row: rowIndex, column: columnIndex })}>
                        <input
                          ref={(node) => {
                            const key = cellKey(rowIndex, columnIndex);
                            if (node) inputRefs.current.set(key, node);
                            else inputRefs.current.delete(key);
                          }}
                          aria-label={`Cell ${rowIndex + 1}, ${columnIndex + 1}`}
                          value={value}
                          readOnly={!editable || !canManageRevenue}
                          inputMode={columnIndex === 0 ? "text" : "decimal"}
                          onFocus={() => setSelectedCell({ row: rowIndex, column: columnIndex })}
                          onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                          onBlur={() => {
                            if (dirtyCells.has(cellKey(rowIndex, columnIndex))) {
                              flushPendingSaves();
                            }
                          }}
                          onKeyDown={(event) => handleKeyDown(event, rowIndex, columnIndex)}
                          onPaste={(event) => handlePaste(event, rowIndex, columnIndex)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={recordModalOpen}
        title="Add Internal Revenue Record"
        onCancel={closeRecordModal}
        footer={null}
        width={820}
        destroyOnHidden
      >
        <div className="internal-revenue-record-types">
          {recordTypeOptions.map((option) => (
            <button
              type="button"
              key={option.key}
              className={`internal-revenue-record-type${recordType === option.key ? " internal-revenue-record-type-active" : ""}`}
              onClick={() => selectRecordType(option.key)}
            >
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>

        {recordType === "others" || recordType === "non_public" ? (
          <div className="internal-revenue-record-date">
            <Text strong>{recordType === "non_public" ? "Select month/date for non-public fund" : "Select month/date for other revenue"}</Text>
            <DatePicker
              picker="month"
              allowClear={false}
              format="MMM-YY"
              value={recordDate}
              onChange={(date) => setRecordDate(date || dayjs(defaultRevenueMonth))}
            />
          </div>
        ) : null}

        {recordType === "non_public" ? (
          <Form
            className="internal-revenue-record-form"
            form={recordForm}
            layout="vertical"
            onFinish={submitRecordForm}
          >
            <div className="internal-revenue-record-grid">
              <Form.Item label="Entry no." name="entry_no">
                <Input placeholder="Entry no" />
              </Form.Item>
              <Form.Item label="Revenue head" name="revenue_head_id" rules={[{ required: true, message: "Select revenue head" }]}>
                <Select placeholder="Select revenue head" options={revenueHeads.filter((head) => head.active).map((head) => ({ value: head.id, label: `${head.name} (PKR ${head.balance})` }))} />
              </Form.Item>
              <Form.Item label="Receipt amount" name="receipt_amount">
                <InputNumber min={0} precision={2} placeholder="0" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Expense / cutting head" name="expense_head">
                <Select allowClear placeholder="Select expense head" options={nonPublicExpenseOptions} />
              </Form.Item>
              <Form.Item label="Expense / cutting amount" name="expense_amount">
                <InputNumber min={0} precision={2} placeholder="0" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Notes" name="notes">
                <Input placeholder="Optional remarks" />
              </Form.Item>
            </div>
            <Space>
              <Button type="primary" htmlType="submit">
                Add to Sheet
              </Button>
              <Button onClick={closeRecordModal}>Cancel</Button>
            </Space>
          </Form>
        ) : recordType ? (
          <Form
            className="internal-revenue-record-form"
            form={recordForm}
            layout="vertical"
            onFinish={submitRecordForm}
          >
            <div className="internal-revenue-record-grid">
              {recordFieldGroups[recordType].map((field) => (
                <Form.Item key={field.column} label={field.label} name={`column_${field.column}`}>
                  <Input inputMode={field.column === 0 ? "text" : "decimal"} placeholder={field.column === 0 ? "Entry no" : "0"} />
                </Form.Item>
              ))}
            </div>
            <Space>
              <Button type="primary" htmlType="submit">
                Add to Sheet
              </Button>
              <Button onClick={closeRecordModal}>Cancel</Button>
            </Space>
          </Form>
        ) : null}
      </Modal>
    </div>
  );
};

export default InternalRevenue;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, DatePicker, Space, Tag, Typography, message } from "antd";
import { PlusOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { listInternalRevenueCells, saveInternalRevenueCells } from "../api/internalRevenue";
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

const cloneRows = (rows) => rows.map((row) => Array.from({ length: columnCount }, (_, index) => row[index] ?? ""));
const blankRow = () => Array.from({ length: columnCount }, () => "");
const cellKey = (rowIndex, columnIndex) => `${rowIndex}:${columnIndex}`;
const periodFromMonth = (month) => dayjs(month || defaultRevenueMonth).format("YYYY-MM");
const numberValue = (value) => {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
const formatCalculated = (value) => (value ? String(value) : "");

const findSummaryIndex = (rows, label) => rows.findIndex((row) => row[0] === label);
const isDecorativeRow = (rowIndex) => [8, 9, 10].includes(rowIndex);
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

const InternalRevenue = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [rows, setRows] = useState(readStoredRows);
  const [revenueMonth, setRevenueMonth] = useState(() => localStorage.getItem(revenueMonthStorageKey) || defaultRevenueMonth);
  const [selectedCell, setSelectedCell] = useState({ row: dataStartRow, column: 0 });
  const [dirtyCells, setDirtyCells] = useState(new Set());
  const [saveState, setSaveState] = useState("idle");
  const [loadState, setLoadState] = useState("loading");
  const inputRefs = useRef(new Map());
  const rowsRef = useRef(rows);
  const pendingSaveCellsRef = useRef(new Map());
  const saveTimerRef = useRef(null);
  const canViewInternalRevenue = hasPermission(user, "view_budgets");
  const period = periodFromMonth(revenueMonth);

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
        const nextRows = savedCells.length ? mergeSavedCells(initialSheetRows, savedCells) : normalizeRows(initialSheetRows);
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

  const addRecord = () => {
    const totalRowIndex = findSummaryIndex(rowsRef.current, "T. Exp");
    const summaryIndex = totalRowIndex >= 0 ? totalRowIndex : rowsRef.current.length;
    const existingBlankIndex = rowsRef.current.findIndex(
      (row, rowIndex) => rowIndex >= dataStartRow && rowIndex < summaryIndex && !isDecorativeRow(rowIndex) && isBlankDataRow(row)
    );
    const insertAt = existingBlankIndex >= 0 ? existingBlankIndex : summaryIndex;
    const nextRows =
      existingBlankIndex >= 0
        ? rowsRef.current.map((row, rowIndex) => (rowIndex === existingBlankIndex ? blankRow() : row))
        : [...rowsRef.current.slice(0, insertAt), blankRow(), ...rowsRef.current.slice(insertAt)];
    const calculatedRows = applyFormulas(nextRows);
    setRows(calculatedRows);
    rowsRef.current = calculatedRows;
    setDirtyCells(new Set());
    saveCells(allCellsForRows(calculatedRows), true);
    focusCell(insertAt, 0);
    message.success("New spreadsheet row added");
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
          <Button icon={<ReloadOutlined />} onClick={resetSheet}>Restore File Data</Button>
          <Button icon={<SaveOutlined />} onClick={saveAll}>Save</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={addRecord}>Add Record</Button>
        </Space>
      </div>

      <Card bordered={false} className="internal-revenue-card">
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
                          readOnly={!editable}
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
    </div>
  );
};

export default InternalRevenue;

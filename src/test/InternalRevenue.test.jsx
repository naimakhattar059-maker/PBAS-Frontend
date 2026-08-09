import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InternalRevenue from "../pages/InternalRevenue";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ period: "2026-07", cells: [] }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

const renderInternalRevenue = () => {
  localStorage.removeItem("internalRevenueRowsV3");
  localStorage.removeItem("internalRevenueRowsV4");
  localStorage.removeItem("internalRevenueMonth");
  const store = createTestStore({
    auth: {
      user: {
        username: "Budget Admin",
        role: "admin",
        permissions: ["view_budgets"],
      },
      token: "token",
    },
  });

  return render(
    <TestProviders store={store}>
      <InternalRevenue />
    </TestProviders>
  );
};

describe("InternalRevenue", () => {
  it("renders the supplied sheet data and allows adding a new record", async () => {
    renderInternalRevenue();

    expect(screen.getByDisplayValue("BS FUNDS")).toBeInTheDocument();
    expect(screen.getByDisplayValue("INTER FUNDS")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Grand Total")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("Jul-26").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /add record/i })).toBeInTheDocument();
  }, 15000);

  it("saves edited cell data and reloads it into the same position", async () => {
    const savedCells = [];

    globalThis.fetch.mockImplementation(async (url, options = {}) => {
      const path = String(url);

      if (path.includes("/api/v1/internal_revenue_cells?")) {
        return Response.json({ period: "2026-07", cells: savedCells });
      }

      if (path.includes("/api/v1/internal_revenue_cells/bulk_upsert")) {
        const body = JSON.parse(options.body);
        body.cells.forEach((cell) => {
          const existingIndex = savedCells.findIndex(
            (savedCell) => savedCell.row_index === cell.row_index && savedCell.column_index === cell.column_index
          );
          if (existingIndex >= 0) savedCells[existingIndex] = cell;
          else savedCells.push(cell);
        });

        return Response.json({ period: body.period, cells: savedCells, message: "Saved" });
      }

      return Response.json({});
    });

    const firstRender = renderInternalRevenue();
    const targetCell = await screen.findByLabelText("Cell 5, 2");

    fireEvent.change(targetCell, { target: { value: "555" } });
    fireEvent.keyDown(targetCell, { key: "Enter" });

    await waitFor(() =>
      expect(savedCells).toContainEqual(expect.objectContaining({ row_index: 4, column_index: 1, value: "555" }))
    );

    firstRender.unmount();
    renderInternalRevenue();

    expect(await screen.findByLabelText("Cell 5, 2")).toHaveValue("555");
  }, 15000);

  it("recalculates totals after multi-cell editing", async () => {
    const savedCells = [];

    globalThis.fetch.mockImplementation(async (url, options = {}) => {
      const path = String(url);

      if (path.includes("/api/v1/internal_revenue_cells?")) {
        return Response.json({ period: "2026-07", cells: [] });
      }

      if (path.includes("/api/v1/internal_revenue_cells/bulk_upsert")) {
        const body = JSON.parse(options.body);
        savedCells.push(...body.cells);
        return Response.json({ period: body.period, cells: savedCells, message: "Saved" });
      }

      return Response.json({});
    });

    renderInternalRevenue();
    const firstCell = await screen.findByLabelText("Cell 5, 2");
    const secondCell = screen.getByLabelText("Cell 5, 3");

    fireEvent.change(firstCell, { target: { value: "10" } });
    fireEvent.blur(firstCell);
    fireEvent.change(secondCell, { target: { value: "20" } });
    fireEvent.blur(secondCell);

    await waitFor(() => expect(savedCells).toHaveLength(2));
    expect(screen.getByLabelText("Cell 5, 2")).toHaveValue("10");
    expect(screen.getByLabelText("Cell 5, 3")).toHaveValue("20");
    expect(screen.getByLabelText("Cell 5, 15")).toHaveValue("30");
  }, 15000);
});

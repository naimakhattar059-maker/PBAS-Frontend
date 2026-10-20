import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { approveBudget, listBudgets } from "../api/budgets";
import BudgetManagement from "../pages/BudgetManagement";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

vi.mock("../api/budgets", () => ({
  createBudget: vi.fn(),
  deleteBudget: vi.fn(),
  listBudgets: vi.fn(),
  updateBudget: vi.fn(),
  approveBudget: vi.fn(),
}));

const renderBudgetManagement = () => {
  const store = createTestStore({
    auth: {
      user: {
        username: "Budget Admin",
        role: "admin",
        permissions: ["view_budgets", "approve_budgets"],
      },
      token: "token",
    },
  });

  return render(
    <TestProviders store={store}>
      <BudgetManagement />
    </TestProviders>
  );
};

describe("BudgetManagement", () => {
  it("groups budgets by year and searches across loaded records", async () => {
    listBudgets.mockResolvedValue({
      budgets: [
        {
          id: 1,
          name: "Operations Budget",
          start_year: 2026,
          end_year: 2026,
          amount: "1000000",
          remaining_amount: "750000",
          spent_amount: "250000",
          budget_type: "normal",
          budget_head: "Operations",
          budget_category: "Annual",
        },
        {
          id: 2,
          name: "Transport Budget",
          start_year: 2025,
          end_year: 2025,
          amount: "500000",
          remaining_amount: "400000",
          spent_amount: "100000",
          budget_type: "supplementary",
          budget_head: "Transport",
          budget_category: "Vehicles",
        },
      ],
    });

    renderBudgetManagement();

    expect(await screen.findByRole("heading", { name: "2026 to 2026" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2025 to 2025" })).toBeInTheDocument();
    expect(screen.getByText("Operations Budget")).toBeInTheDocument();
    expect(screen.getByText("Transport Budget")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search name/i), { target: { value: "transport" } });

    await waitFor(() => {
      expect(screen.queryByText("Operations Budget")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Transport Budget")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "2026 to 2026" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2025 to 2025" })).toBeInTheDocument();
  });

  it("lets Super Admin approve a pending budget without showing Add Budget", async () => {
    listBudgets.mockResolvedValue({ budgets: [{
      id: 3, name: "Science Budget", start_year: 2026, end_year: 2026,
      amount: 100000, remaining_amount: 100000, spent_amount: 0,
      budget_type: "normal", approval_status: "pending_approval",
    }] });
    approveBudget.mockResolvedValue({ budget: { id: 3, approval_status: "approved" } });

    renderBudgetManagement();

    expect(screen.queryByRole("button", { name: "Add Budget" })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Actions for budget 3" }));
    fireEvent.click(await screen.findByRole("button", { name: "Approve budget" }));
    await waitFor(() => expect(approveBudget).toHaveBeenCalledWith("token", 3));
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { listBudgets } from "../api/budgets";
import BudgetManagement from "../pages/BudgetManagement";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

vi.mock("../api/budgets", () => ({
  createBudget: vi.fn(),
  deleteBudget: vi.fn(),
  listBudgets: vi.fn(),
  updateBudget: vi.fn(),
}));

const renderBudgetManagement = () => {
  const store = createTestStore({
    auth: {
      user: {
        username: "Budget Admin",
        role: "admin",
        permissions: ["view_budgets", "create_budgets", "update_budgets", "delete_budgets"],
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

    expect(await screen.findByText("2026 Budgets")).toBeInTheDocument();
    expect(screen.getByText("2025 Budgets")).toBeInTheDocument();
    expect(screen.getByText("Operations Budget")).toBeInTheDocument();
    expect(screen.getByText("Transport Budget")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search name/i), { target: { value: "transport" } });

    await waitFor(() => {
      expect(screen.queryByText("Operations Budget")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Transport Budget")).toBeInTheDocument();
    expect(screen.queryByText("2026 Budgets")).not.toBeInTheDocument();
    expect(screen.getByText("2025 Budgets")).toBeInTheDocument();
  });
});

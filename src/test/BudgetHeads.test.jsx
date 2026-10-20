import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import BudgetHeads from "../pages/BudgetHeads";
import { createBudgetHead, listBudgetHeads, reviewBudgetHead, approveBudgetHead, requestNewBudgetHead } from "../api/budgetHeads";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

vi.mock("../api/budgetHeads", () => ({
  listBudgetHeads: vi.fn(),
  createBudgetHead: vi.fn(),
  updateBudgetHead: vi.fn(),
  reviewBudgetHead: vi.fn(),
  requestBudgetHeadChanges: vi.fn(),
  approveBudgetHead: vi.fn(),
  requestNewBudgetHead: vi.fn(),
}));

const renderFor = (role, permission) => {
  const store = createTestStore({
    auth: { user: { role, permissions: ["view_budget_heads", permission] }, token: "token" },
  });
  return render(<TestProviders store={store}><BudgetHeads /></TestProviders>);
};

describe("Budget head approval flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listBudgetHeads.mockResolvedValue({ budget_heads: [] });
  });

  it("lets Admin Officer enter a head and allocated amount", async () => {
    createBudgetHead.mockResolvedValue({ budget_head: { id: 1 } });
    renderFor("admin_officer", "manage_budget_heads");

    fireEvent.click(await screen.findByRole("button", { name: "Add budget head" }));
    fireEvent.change(screen.getByLabelText("Budget head name"), { target: { value: "Library" } });
    fireEvent.change(screen.getByLabelText("Code"), { target: { value: "LIB" } });
    fireEvent.change(screen.getByLabelText("Allocated amount (PKR)"), { target: { value: "150000" } });
    fireEvent.click(screen.getByRole("button", { name: "Send to HOI" }));

    await waitFor(() => expect(createBudgetHead).toHaveBeenCalledWith("token", expect.objectContaining({
      name: "Library", code: "LIB", allocated_amount: 150000,
    })));
  });

  it("lets HOI forward a reviewed head", async () => {
    listBudgetHeads.mockResolvedValue({ budget_heads: [{ id: 2, code: "LAB", name: "Lab", allocated_amount: 30000, status: "pending_hoi" }] });
    reviewBudgetHead.mockResolvedValue({});
    renderFor("head_of_institute", "review_budget_heads");

    fireEvent.click(await screen.findByRole("button", { name: "Review and forward" }));
    await waitFor(() => expect(reviewBudgetHead).toHaveBeenCalledWith("token", 2));
  });

  it("lets HOI request a new head without an existing head", async () => {
    requestNewBudgetHead.mockResolvedValue({ message: "sent" });
    renderFor("head_of_institute", "review_budget_heads");

    fireEvent.click(await screen.findByRole("button", { name: "Request new head" }));
    fireEvent.change(screen.getByPlaceholderText("Describe the new head and why it is needed"), { target: { value: "New library head" } });
    fireEvent.click(screen.getByRole("button", { name: "Send request" }));
    await waitFor(() => expect(requestNewBudgetHead).toHaveBeenCalledWith("token", "New library head"));
  });

  it("shows final approval only to Super Admin", async () => {
    listBudgetHeads.mockResolvedValue({ budget_heads: [{ id: 3, code: "IT", name: "IT", allocated_amount: 50000, status: "pending_admin" }] });
    approveBudgetHead.mockResolvedValue({});
    renderFor("admin", "approve_budget_heads");

    fireEvent.click(await screen.findByRole("button", { name: "Approve" }));
    await waitFor(() => expect(approveBudgetHead).toHaveBeenCalledWith("token", 3));
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });
});

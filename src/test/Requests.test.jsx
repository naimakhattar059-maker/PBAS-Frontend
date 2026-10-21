import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listBudgetOptions } from "../api/budgets";
import { listRequests } from "../api/requests";
import { listRevenueHeads } from "../api/internalRevenue";
import Requests from "../pages/Requests";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

vi.mock("../api/requests", () => ({
  approveRequest: vi.fn(),
  completeRequest: vi.fn(),
  createRequest: vi.fn(),
  deleteRequest: vi.fn(),
  listRequests: vi.fn(),
  rejectRequest: vi.fn(),
  submitRequest: vi.fn(),
  updateRequest: vi.fn(),
  verifyRequest: vi.fn(),
}));

vi.mock("../api/budgets", () => ({
  listBudgetOptions: vi.fn(),
}));

vi.mock("../api/internalRevenue", () => ({ listRevenueHeads: vi.fn() }));

const baseRequest = {
  id: 1,
  title: "Lab equipment",
  request_type: "resource",
  department: "Science",
  requested_by: "Teacher",
  priority: "normal",
  amount: "10000",
  actions: {},
  audit_entries: [],
};

const renderRequestsForUser = (user, request) => {
  const store = createTestStore({
    auth: {
      user,
      token: "token",
    },
  });

  listRequests.mockResolvedValue({ requests: [{ ...baseRequest, ...request }] });
  listBudgetOptions.mockResolvedValue({ budgets: [] });
  listRevenueHeads.mockResolvedValue({ revenue_heads: [] });

  return render(
    <TestProviders store={store}>
      <Requests />
    </TestProviders>
  );
};

const waitForRequestsTable = async () => {
  expect(await screen.findByText("Lab equipment")).toBeInTheDocument();
};

describe("Requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows Office Assistant to manage draft requests only", async () => {
    renderRequestsForUser(
      {
        username: "Office Assistant",
        role: "office_assistant",
        permissions: ["view_requests", "create_requests", "update_requests"],
      },
      { status: "draft" }
    );

    await waitForRequestsTable();

    expect(await screen.findByRole("button", { name: /Edit/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Submit/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Delete/ })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Verify/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Approve/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reject/ })).not.toBeInTheDocument();
  });

  it("shows audit history as an inline utility action", async () => {
    renderRequestsForUser(
      {
        username: "Office Assistant",
        role: "office_assistant",
        permissions: ["view_requests", "create_requests", "update_requests"],
      },
      {
        status: "draft",
        audit_entries: [{ action: "create", by: "Office Assistant", role: "office_assistant", at: "2026-09-02" }],
      }
    );

    await waitForRequestsTable();

    fireEvent.click(screen.getByRole("button", { name: /Audit/ }));
    expect(await screen.findByText("Audit history: Lab equipment")).toBeInTheDocument();
  });

  it("allows Admin Officer to verify or reject submitted requests", async () => {
    renderRequestsForUser(
      {
        username: "Admin Officer",
        role: "admin_officer",
        permissions: ["view_requests", "verify_requests"],
      },
      { status: "submitted" }
    );

    await waitForRequestsTable();

    expect(await screen.findByRole("button", { name: /Verify/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Reject/ })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Approve/ })).not.toBeInTheDocument();
  });

  it("allows Head of Institute to approve or reject verified requests", async () => {
    renderRequestsForUser(
      {
        username: "HOI User",
        role: "head_of_institute",
        permissions: [],
      },
      { status: "verified" }
    );

    await waitForRequestsTable();

    const approveButton = await screen.findByRole("button", { name: /Approve/ });
    const rejectButton = screen.getByRole("button", { name: /Reject/ });

    expect(approveButton).toBeEnabled();
    expect(rejectButton).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Verify/ })).not.toBeInTheDocument();
    expect(within(screen.getByText("Requests & Approvals").closest(".budget-page")).queryByText(/does not have permission/i)).not.toBeInTheDocument();
  });
});

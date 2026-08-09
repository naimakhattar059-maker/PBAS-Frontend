import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { listBudgetOptions } from "../api/budgets";
import { listRequests } from "../api/requests";
import Requests from "../pages/Requests";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

vi.mock("../api/requests", () => ({
  approveRequest: vi.fn(),
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

const renderRequestsForHoi = () => {
  const store = createTestStore({
    auth: {
      user: {
        username: "HOI User",
        role: "head_of_institute",
        permissions: [],
      },
      token: "token",
    },
  });

  return render(
    <TestProviders store={store}>
      <Requests />
    </TestProviders>
  );
};

describe("Requests", () => {
  it("allows Head of Institute to approve or reject verified resource requests", async () => {
    listRequests.mockResolvedValue({
      requests: [
        {
          id: 1,
          title: "Lab equipment",
          request_type: "resource",
          department: "Science",
          requested_by: "Teacher",
          priority: "normal",
          amount: "10000",
          status: "verified",
          actions: {},
          audit_entries: [],
        },
      ],
    });
    listBudgetOptions.mockResolvedValue({ budgets: [] });

    renderRequestsForHoi();

    expect(await screen.findByText("Lab equipment")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ellipsis" }));

    const approveButton = await screen.findByRole("button", { name: "Approve" });
    const rejectButton = screen.getByRole("button", { name: "Reject" });

    expect(approveButton).toBeEnabled();
    expect(rejectButton).toBeEnabled();
    expect(within(screen.getByText("Requests & Approvals").closest(".budget-page")).queryByText(/does not have permission/i)).not.toBeInTheDocument();
  });
});

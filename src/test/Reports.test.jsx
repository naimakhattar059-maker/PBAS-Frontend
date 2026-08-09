import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fetchReports } from "../api/reports";
import Reports from "../pages/Reports";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

vi.mock("../api/reports", () => ({
  fetchReports: vi.fn(),
}));

const renderReports = () => {
  const store = createTestStore({
    auth: {
      user: {
        username: "Report Admin",
        permissions: ["view_reports"],
      },
      token: "token",
    },
  });

  return render(
    <TestProviders store={store}>
      <Reports />
    </TestProviders>
  );
};

describe("Reports", () => {
  it("renders period controls, live chart view, and generated report rows", async () => {
    fetchReports.mockResolvedValue({
      overview: { users: 2, budgets: 1, requests: 3, payrolls: 1 },
      notification_summary: { unread: 1, total: 4 },
      budget_structure: { budget_heads: 2, active_heads: 1 },
      request_statuses: [{ name: "submitted", value: 3 }],
      payroll_statuses: [{ name: "approved", value: 1 }],
      budget_types: [{ name: "normal", value: 1 }],
      recent_requests: [],
      recent_payrolls: [],
      recent_notifications: [],
    });

    renderReports();

    expect(await screen.findByText("Live analytics")).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Yearly")).toBeInTheDocument();
    expect(screen.getByText(/generated report/i)).toBeInTheDocument();
    expect(screen.getByText("submitted")).toBeInTheDocument();
    expect(screen.getByText("approved")).toBeInTheDocument();
  });
});

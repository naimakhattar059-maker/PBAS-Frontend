import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "../pages/Dashboard";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

vi.mock("../api/dashboard", () => ({
  fetchDashboard: vi.fn(),
}));

import { fetchDashboard } from "../api/dashboard";

describe("Dashboard", () => {
  it("renders live dashboard data", async () => {
    fetchDashboard.mockResolvedValue({
      totals: {
        users: 24,
        pending_approvals: 7,
        budget_available: "PKR 1,250,000",
        expense_this_month: "PKR 325,000",
      },
      recent_activities: [
        { title: "Request submitted", subtitle: "resource - Admin", status: "submitted" },
        { title: "Payroll generated", subtitle: "December 2026", status: "generated" },
      ],
      charts: {
        request_statuses: [{ name: "submitted", value: 3 }],
        payroll_statuses: [{ name: "generated", value: 2 }],
        budget_types: [{ name: "normal", value: 5 }],
        budget_overview: {
          full_budget: 1250000,
          remaining_budget: 925000,
          utilized_budget: 325000,
          formatted: {
            full_budget: "PKR 1,250,000",
            remaining_budget: "PKR 925,000",
            utilized_budget: "PKR 325,000",
          },
        },
      },
      system_health: {
        api_uptime: "99.8%",
        avg_response_time_ms: 180,
        unread_notifications: 4,
      },
    });

    const store = createTestStore({
      auth: {
        user: {
          username: "Admin User",
          role: "admin",
          permissions: ["view_dashboard"],
        },
        token: "token",
      },
    });

    render(
      <TestProviders store={store} route="/dashboard">
        <Dashboard />
      </TestProviders>
    );

    await waitFor(() => expect(fetchDashboard).toHaveBeenCalled());
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getAllByText("PKR 1,250,000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PKR 325,000").length).toBeGreaterThan(0);
    expect(screen.getByText("Live signals")).toBeInTheDocument();
    expect(screen.getByText("Budget Overview")).toBeInTheDocument();
    expect(screen.getByText("Activity mix")).toBeInTheDocument();
    expect(screen.getAllByText("submitted: 3").length).toBeGreaterThan(0);
  });
});

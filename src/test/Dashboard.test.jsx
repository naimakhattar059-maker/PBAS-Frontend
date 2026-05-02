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
      },
      system_health: {
        api_uptime: "99.8%",
        avg_response_time_ms: 180,
        unread_notifications: 4,
      },
      quick_actions: [{ label: "New request" }],
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
    expect(screen.getByText("PKR 1,250,000")).toBeInTheDocument();
    expect(screen.getByText("PKR 325,000")).toBeInTheDocument();
    expect(screen.getByText("New request")).toBeInTheDocument();
    expect(screen.getByText("99.8%")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});

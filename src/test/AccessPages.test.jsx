import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Reports from "../pages/Reports";
import Notifications from "../pages/Notifications";
import BudgetManagement from "../pages/BudgetManagement";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

describe("Protected pages", () => {
  it("renders access denied for reports without permission", () => {
    const store = createTestStore({
      auth: {
        user: { username: "Office Assistant", role: "office_assistant", permissions: ["view_notifications"] },
        token: "token",
      },
    });

    render(
      <TestProviders store={store}>
        <Reports />
      </TestProviders>
    );

    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText(/does not have permission/i)).toBeInTheDocument();
  });

  it("renders notifications page for permitted role", () => {
    const store = createTestStore({
      auth: {
        user: { username: "Admin", role: "admin", permissions: ["view_notifications"] },
        token: "token",
      },
    });

    render(
      <TestProviders store={store}>
        <Notifications />
      </TestProviders>
    );

    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("renders budget management access denied for non-budget roles", () => {
    const store = createTestStore({
      auth: {
        user: { username: "Office Assistant", role: "office_assistant", permissions: ["view_requests"] },
        token: "token",
      },
    });

    render(
      <TestProviders store={store}>
        <BudgetManagement />
      </TestProviders>
    );

    expect(screen.getByText("Budget Management")).toBeInTheDocument();
    expect(screen.getByText(/does not have permission/i)).toBeInTheDocument();
  });

  it("renders access denied for notifications without permission", () => {
    const store = createTestStore({
      auth: {
        user: { username: "Visitor", role: "student", permissions: ["view_dashboard"] },
        token: "token",
      },
    });

    render(
      <TestProviders store={store}>
        <Notifications />
      </TestProviders>
    );

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText(/does not have permission/i)).toBeInTheDocument();
  });
});

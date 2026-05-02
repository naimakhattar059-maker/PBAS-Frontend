import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AppLayout from "../components/AppLayout";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

vi.mock("antd", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Grid: {
      ...actual.Grid,
      useBreakpoint: () => ({ md: true }),
    },
  };
});

describe("AppLayout", () => {
  it("shows only allowed navigation items", () => {
    const store = createTestStore({
        auth: {
          user: {
            username: "Admin User",
            role: "admin",
            attachment_image_data: null,
            permissions: ["view_dashboard", "view_users", "view_budgets", "view_reports", "view_notifications"],
          },
          token: "token",
        },
    });

    render(
      <TestProviders store={store} route="/dashboard">
        <AppLayout>
          <div>Dashboard content</div>
        </AppLayout>
      </TestProviders>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Budget Management")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { listAuditLogs } from "../api/auditLogs";
import AuditLogs from "../pages/AuditLogs";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

vi.mock("../api/auditLogs", () => ({
  listAuditLogs: vi.fn(),
}));

const renderAuditLogs = () => {
  const store = createTestStore({
    auth: {
      user: {
        username: "Admin User",
        role: "admin",
        permissions: ["view_reports"],
      },
      token: "token",
    },
  });

  return render(
    <TestProviders store={store}>
      <AuditLogs />
    </TestProviders>
  );
};

describe("AuditLogs", () => {
  it("renders audit records returned by the API", async () => {
    listAuditLogs.mockResolvedValue({
      audit_logs: [
        {
          id: 1,
          action: "update",
          entity_type: "budgets",
          entity_id: 12,
          actor: "Admin User",
          ip_address: "127.0.0.1",
          created_at: "2026-08-09T10:00:00Z",
          metadata: { path: "/api/v1/budgets/12" },
        },
      ],
    });

    renderAuditLogs();

    expect(await screen.findByText("Security activity")).toBeInTheDocument();
    expect(screen.getByText("UPDATE")).toBeInTheDocument();
    expect(screen.getByText("budgets")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

vi.mock("../api/auth", () => ({
  validateSession: vi.fn(() => Promise.resolve({ user: { username: "Admin User", permissions: ["view_dashboard"] } })),
}));

describe("ProtectedRoute", () => {
  it("redirects to login when no token is present", () => {
    const store = createTestStore();

    render(
      <TestProviders store={store} route="/dashboard">
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard page</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </TestProviders>
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });
});

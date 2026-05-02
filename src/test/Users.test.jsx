import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Users from "../pages/Users";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

vi.mock("../api/users", () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  updateUserActivation: vi.fn(),
}));

import { listUsers } from "../api/users";

describe("Users", () => {
  it("shows access denied when role lacks user permissions", () => {
    const store = createTestStore({
      auth: {
        user: {
          username: "Accountant User",
          role: "accountant",
          permissions: ["view_dashboard"],
        },
        token: "token",
      },
    });

    render(
      <TestProviders store={store}>
        <Users />
      </TestProviders>
    );

    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText(/does not have permission/i)).toBeInTheDocument();
  });

  it("renders the user table for permitted roles", async () => {
    listUsers.mockResolvedValue({
      users: [
        {
          id: 1,
          username: "Admin User",
          email: "admin@example.com",
          cnic: "35202-1234567-1",
          father_name: "Father One",
          designation: "admin",
          department: "Accounts",
          role: "admin",
          staff_sub_role: null,
          attachment_image_data: null,
          active: true,
        },
      ],
    });

    const store = createTestStore({
      auth: {
        user: {
          username: "Admin User",
          role: "admin",
          permissions: ["view_users", "create_users", "update_users", "delete_users", "change_user_status"],
        },
        token: "token",
      },
    });

    render(
      <TestProviders store={store}>
        <Users />
      </TestProviders>
    );

    await waitFor(() => expect(listUsers).toHaveBeenCalled());
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Add User")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("opens the create user modal for permitted roles", async () => {
    listUsers.mockResolvedValue({ users: [] });

    const store = createTestStore({
      auth: {
        user: {
          username: "Admin User",
          role: "admin",
          permissions: ["view_users", "create_users", "update_users", "delete_users", "change_user_status"],
        },
        token: "token",
      },
    });

    render(
      <TestProviders store={store}>
        <Users />
      </TestProviders>
    );

    await waitFor(() => expect(listUsers).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /add user/i }));
    expect(screen.getByText("Add new user")).toBeInTheDocument();
  });
});

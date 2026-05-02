import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Notifications from "../pages/Notifications";
import { createTestStore } from "./testUtils";
import { TestProviders } from "./TestProviders";

vi.mock("../api/notifications", () => ({
  listNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

import { listNotifications, markNotificationRead } from "../api/notifications";

describe("Notifications", () => {
  it("marks a single notification as read", async () => {
    listNotifications.mockResolvedValue({
      notifications: [
        {
          id: 11,
          title: "Budget approved",
          body: "Your budget has been approved",
          category: "budget",
          link_path: "/budget",
          read: false,
        },
      ],
    });

    markNotificationRead.mockResolvedValue({
      notification: {
        id: 11,
        title: "Budget approved",
        body: "Your budget has been approved",
        category: "budget",
        link_path: "/budget",
        read: true,
      },
    });

    const store = createTestStore({
      auth: {
        user: {
          username: "Admin User",
          role: "admin",
          permissions: ["view_notifications"],
        },
        token: "token",
      },
    });

    render(
      <TestProviders store={store}>
        <Notifications />
      </TestProviders>
    );

    await waitFor(() => expect(listNotifications).toHaveBeenCalled());
    expect(screen.getByText("Budget approved")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /mark read/i }));
    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith("token", 11));
    expect(screen.getByText("read")).toBeInTheDocument();
  });
});

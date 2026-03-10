import React, { type PropsWithChildren } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { api } from "@shared/routes";
import { useAssignRole } from "@/hooks/use-roles";

const toastSpy = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, Wrapper };
}

describe("useAssignRole", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    toastSpy.mockReset();
  });

  it("assigns a role and refreshes auth-related queries", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Role assigned successfully" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAssignRole(), { wrapper: Wrapper });

    await result.current.mutateAsync({ userId: "u-1", roleId: 2 });

    expect(fetch).toHaveBeenCalledWith("/api/users/u-1/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId: 2 }),
      credentials: "include",
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["/api/auth/user"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [api.users.list.path] });
    });

    expect(toastSpy).toHaveBeenCalledWith({
      title: "Success",
      description: "Role assigned to user successfully",
    });
  });

  it("shows an error toast when assign role fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAssignRole(), { wrapper: Wrapper });

    await expect(result.current.mutateAsync({ userId: "u-1", roleId: 3 })).rejects.toThrow("Forbidden");

    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ["/api/auth/user"] });
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: [api.users.list.path] });

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith({
        title: "Error",
        description: "Forbidden",
        variant: "destructive",
      });
    });
  });
});

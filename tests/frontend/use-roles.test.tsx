import React, { type PropsWithChildren } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { api } from "@shared/routes";
import { useAssignRole, useCreateRole, useRoles } from "@/hooks/use-roles";

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

function mockFetchJson(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("useRoles", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    toastSpy.mockReset();
  });

  it("loads role list successfully", async () => {
    mockFetchJson([{ id: 1, name: "Admin", description: "Full access" }]);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRoles(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(api.roles.list.path, {
      credentials: "include",
    });
    expect(result.current.data).toEqual([{ id: 1, name: "Admin", description: "Full access" }]);
  });

  it("returns query error when role list request fails", async () => {
    mockFetchJson({ message: "boom" }, 500);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRoles(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect((result.current.error as Error).message).toBe("Failed to fetch roles");
  });
});

describe("useCreateRole", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    toastSpy.mockReset();
  });

  it("creates a role and refreshes the role list", async () => {
    mockFetchJson({ id: 1, name: "Admin", description: "Full access" }, 201);

    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateRole(), { wrapper: Wrapper });

    await result.current.mutateAsync({ name: "Admin", description: "Full access" });

    expect(fetch).toHaveBeenCalledWith(api.roles.create.path, {
      method: api.roles.create.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Admin", description: "Full access" }),
      credentials: "include",
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [api.roles.list.path] });
    });

    expect(toastSpy).toHaveBeenCalledWith({
      title: "Success",
      description: "Role created successfully",
    });
  });

  it("shows API error message when create role fails", async () => {
    mockFetchJson({ message: "Role already exists" }, 409);

    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateRole(), { wrapper: Wrapper });

    await expect(result.current.mutateAsync({ name: "Admin", description: "dup" })).rejects.toThrow(
      "Role already exists",
    );
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: [api.roles.list.path] });

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith({
        title: "Error",
        description: "Role already exists",
        variant: "destructive",
      });
    });
  });

  it("uses fallback create-role error message when API response has no message", async () => {
    mockFetchJson({}, 500);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateRole(), { wrapper: Wrapper });

    await expect(result.current.mutateAsync({ name: "Admin", description: "dup" })).rejects.toThrow(
      "Failed to create role",
    );

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    });
  });
});

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

  it("uses fallback assign-role error message when API response has no message", async () => {
    mockFetchJson({}, 500);

    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAssignRole(), { wrapper: Wrapper });

    await expect(result.current.mutateAsync({ userId: "u-1", roleId: 3 })).rejects.toThrow("Failed to assign role");

    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ["/api/auth/user"] });
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: [api.users.list.path] });

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

describe("apiRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("makes GET request without body", async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const res = await apiRequest("GET", "/api/users");

    expect(fetch).toHaveBeenCalledWith("/api/users", {
      method: "GET",
      headers: {},
      body: undefined,
      credentials: "include",
    });
    expect(res.status).toBe(200);
  });

  it("makes POST request with JSON body", async () => {
    const mockResponse = new Response(JSON.stringify({ id: 1 }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const data = { name: "Admin", description: "Administrator" };
    await apiRequest("POST", "/api/roles", data);

    expect(fetch).toHaveBeenCalledWith("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
  });

  it("throws on non-ok response", async () => {
    const mockResponse = new Response("Not Found", { status: 404, statusText: "Not Found" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    await expect(apiRequest("GET", "/api/users/999")).rejects.toThrow("404");
  });

  it("includes credentials in every request", async () => {
    const mockResponse = new Response("OK", { status: 200 });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    await apiRequest("DELETE", "/api/conversations/1");

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[1]?.credentials).toBe("include");
  });
});

describe("getQueryFn", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null on 401 when on401 is returnNull", async () => {
    const mockResponse = new Response("Unauthorized", { status: 401 });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const fn = getQueryFn<{ id: number }>({ on401: "returnNull" });
    const result = await fn({ queryKey: ["/api/me"], signal: new AbortController().signal } as any);

    expect(result).toBeNull();
  });

  it("returns JSON on 200", async () => {
    const mockResponse = new Response(JSON.stringify({ id: 1, name: "Test" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const fn = getQueryFn<{ id: number; name: string }>({ on401: "throw" });
    const result = await fn({ queryKey: ["/api/me"], signal: new AbortController().signal } as any);

    expect(result).toEqual({ id: 1, name: "Test" });
  });

  it("throws on 401 when on401 is throw", async () => {
    const mockResponse = new Response("Unauthorized", { status: 401 });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const fn = getQueryFn({ on401: "throw" });
    await expect(
      fn({ queryKey: ["/api/me"], signal: new AbortController().signal } as any),
    ).rejects.toThrow("401");
  });
});

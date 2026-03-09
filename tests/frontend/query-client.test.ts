import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiRequest } from "@/lib/queryClient";

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

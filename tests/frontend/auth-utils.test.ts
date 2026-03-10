import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";

describe("auth-utils", () => {
  describe("isUnauthorizedError", () => {
    it("returns true for 401 Unauthorized error message", () => {
      expect(isUnauthorizedError(new Error("401: Unauthorized"))).toBe(true);
      expect(isUnauthorizedError(new Error("401: Something Unauthorized"))).toBe(true);
    });

    it("returns false for other status codes", () => {
      expect(isUnauthorizedError(new Error("404: Not Found"))).toBe(false);
      expect(isUnauthorizedError(new Error("500: Internal Server Error"))).toBe(false);
    });

    it("returns false for non-matching message", () => {
      expect(isUnauthorizedError(new Error("Unauthorized"))).toBe(false);
    });
  });

  describe("redirectToLogin", () => {
    const originalLocation = window.location;

    beforeEach(() => {
      vi.useFakeTimers();
      // @ts-expect-error replace href for test
      delete window.location;
      window.location = { ...originalLocation, href: "" };
    });

    afterEach(() => {
      vi.useRealTimers();
      window.location = originalLocation;
    });

    it("calls toast when provided", () => {
      const toast = vi.fn();
      redirectToLogin(toast);
      expect(toast).toHaveBeenCalledWith({
        title: "Unauthorized",
        description: "You are logged out. Please log in.",
        variant: "destructive",
      });
    });

    it("does not throw when toast is undefined", () => {
      expect(() => redirectToLogin(undefined)).not.toThrow();
    });

    it("redirects to / after 500ms", () => {
      redirectToLogin(undefined);
      expect(window.location.href).toBe("");
      vi.advanceTimersByTime(500);
      expect(window.location.href).toBe("/");
    });
  });
});

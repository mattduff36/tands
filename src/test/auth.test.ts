import { describe, it, expect, beforeAll } from "vitest";
import { verify, allowedUser } from "../lib/credentials";

describe("Authentication System", () => {
  beforeAll(() => {
    // Set up test environment variables
    process.env.ACCOUNTS = "testuser,admin";
    process.env.PASS_HASH_TESTUSER =
      "$2b$12$6KSmeA6qafmceQrCfyVcweCWuO7OdLZ9EfR0.wWy/uxgH2UYjGeOW"; // testpassword123
    process.env.PASS_HASH_ADMIN =
      "$2b$12$6KSmeA6qafmceQrCfyVcweCWuO7OdLZ9EfR0.wWy/uxgH2UYjGeOW"; // testpassword123
  });

  describe("allowedUser", () => {
    it("should allow valid usernames", () => {
      expect(allowedUser("testuser")).toBe(true);
      expect(allowedUser("admin")).toBe(true);
      expect(allowedUser("TESTUSER")).toBe(true); // case insensitive
    });

    it("should reject invalid usernames", () => {
      expect(allowedUser("invalid")).toBe(false);
      expect(allowedUser("")).toBe(false);
      expect(allowedUser("hacker")).toBe(false);
    });
  });

  describe("verify", () => {
    it("should verify correct password", async () => {
      const result = await verify("testuser", "testpassword123");
      expect(result).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const result = await verify("testuser", "wrongpassword");
      expect(result).toBe(false);
    });

    it("should reject non-existent user", async () => {
      const result = await verify("nonexistent", "testpassword123");
      expect(result).toBe(false);
    });

    it("should handle empty password", async () => {
      const result = await verify("testuser", "");
      expect(result).toBe(false);
    });
  });
});

import { describe, expect, it } from "vitest";
import { getPasswordChecks, isStrongPassword, isValidEmail } from "../utils/authValidation";

describe("authValidation", () => {
  it("accepts valid custom-domain emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("student.name@example.edu.pk")).toBe(true);
  });

  it("rejects malformed emails", () => {
    ["abc@", "abc@gmail", "@gmail.com", "abc@undefined", "abc@null", "user @example.com", " user@example.com", "a..b@example.com"].forEach(
      (email) => expect(isValidEmail(email)).toBe(false)
    );
  });

  it("validates strong password requirements", () => {
    expect(isStrongPassword("Nouman@123")).toBe(true);
    expect(isStrongPassword("Nou@1")).toBe(false);
    expect(isStrongPassword("nouman@123")).toBe(false);
    expect(isStrongPassword("NOUMAN@123")).toBe(false);
    expect(isStrongPassword("Noumanpass!")).toBe(false);
    expect(isStrongPassword("Nouman123")).toBe(false);
    expect(isStrongPassword("        ")).toBe(false);
  });

  it("reports individual password checks", () => {
    const checks = Object.fromEntries(getPasswordChecks("Nouman@123").map((check) => [check.key, check.valid]));

    expect(checks).toEqual({
      length: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
    });
  });
});

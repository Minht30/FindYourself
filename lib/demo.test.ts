import { describe, expect, it } from "vitest";
import {
  DEMO_MESSAGES,
  MAX_PASSWORD,
  MIN_PASSWORD,
  UPGRADE_MESSAGES,
  demoReasonFromAuthError,
  isGuest,
  upgradeReasonFromAuthError,
  validateUpgrade,
} from "@/lib/demo";

describe("demoReasonFromAuthError", () => {
  it("names a project that has anonymous sign-ins switched off", () => {
    expect(demoReasonFromAuthError({ message: "Anonymous sign-ins are disabled", status: 422 })).toBe("demo_disabled");
    expect(demoReasonFromAuthError({ code: "anonymous_provider_disabled", message: "x" })).toBe("demo_disabled");
  });

  it("names the cap and rate limits", () => {
    expect(demoReasonFromAuthError({ message: "Database error: demo_full" })).toBe("demo_full");
    expect(demoReasonFromAuthError({ status: 429, message: "x" })).toBe("rate_limited");
    expect(demoReasonFromAuthError({ message: "Request rate limit reached" })).toBe("rate_limited");
  });

  it("falls back to a general reason for anything else, including nothing", () => {
    expect(demoReasonFromAuthError({ message: "boom", status: 500 })).toBe("demo_unavailable");
    expect(demoReasonFromAuthError(null)).toBe("demo_unavailable");
    expect(demoReasonFromAuthError(undefined)).toBe("demo_unavailable");
  });

  it("has a gentle message for every reason that always offers a way forward", () => {
    for (const m of Object.values(DEMO_MESSAGES)) expect(m.length).toBeGreaterThan(20);
    expect(DEMO_MESSAGES.demo_disabled).toMatch(/create an account/i);
    expect(DEMO_MESSAGES.demo_full).toMatch(/try again|create an account/i);
  });
});

describe("validateUpgrade", () => {
  it("accepts a plain email and a long enough password, trimming the email", () => {
    expect(validateUpgrade("  sam@example.com ", "correct-horse")).toEqual({ ok: true, email: "sam@example.com" });
    expect(validateUpgrade("a+tag@sub.example.org", "x".repeat(MIN_PASSWORD))).toMatchObject({ ok: true });
  });

  it("refuses a bad email by reason", () => {
    for (const bad of ["", "nope", "a@b", "a b@example.com", "@example.com", "a@@example.com", "a@example..", null, undefined, 5, "a".repeat(250) + "@example.com"]) {
      expect(validateUpgrade(bad, "correct-horse")).toEqual({ ok: false, reason: "bad_email" });
    }
  });

  it("refuses a weak or oversized password by reason", () => {
    expect(validateUpgrade("sam@example.com", "short")).toEqual({ ok: false, reason: "weak_password" });
    expect(validateUpgrade("sam@example.com", "x".repeat(MIN_PASSWORD - 1))).toEqual({ ok: false, reason: "weak_password" });
    expect(validateUpgrade("sam@example.com", "x".repeat(MAX_PASSWORD + 1))).toEqual({ ok: false, reason: "weak_password" });
    expect(validateUpgrade("sam@example.com", null)).toEqual({ ok: false, reason: "weak_password" });
    expect(validateUpgrade("sam@example.com", 12345678)).toEqual({ ok: false, reason: "weak_password" });
    expect(validateUpgrade("sam@example.com", "x".repeat(MAX_PASSWORD))).toMatchObject({ ok: true });
  });

  it("checks the email first, so a bad email is never reported as a weak password", () => {
    expect(validateUpgrade("nope", "x")).toEqual({ ok: false, reason: "bad_email" });
  });
});

describe("upgradeReasonFromAuthError", () => {
  it("recognises an email that already has an account", () => {
    expect(upgradeReasonFromAuthError({ message: "A user with this email address has already been registered" })).toBe("email_taken");
    expect(upgradeReasonFromAuthError({ code: "email_exists", message: "x" })).toBe("email_taken");
    expect(upgradeReasonFromAuthError({ code: "user_already_exists", message: "x" })).toBe("email_taken");
  });

  it("recognises weak passwords and invalid emails, and falls back", () => {
    expect(upgradeReasonFromAuthError({ code: "weak_password", message: "Password should be at least 6 characters" })).toBe("weak_password");
    expect(upgradeReasonFromAuthError({ message: "Unable to validate email address: invalid format" })).toBe("bad_email");
    expect(upgradeReasonFromAuthError({ message: "boom" })).toBe("failed");
    expect(upgradeReasonFromAuthError(null)).toBe("failed");
  });

  it("has a message for every reason", () => {
    for (const m of Object.values(UPGRADE_MESSAGES)) expect(m.length).toBeGreaterThan(10);
  });
});

describe("isGuest", () => {
  it("is true only for an anonymous session", () => {
    expect(isGuest({ is_anonymous: true })).toBe(true);
    expect(isGuest({ is_anonymous: false })).toBe(false);
    expect(isGuest({})).toBe(false);
    expect(isGuest(null)).toBe(false);
    expect(isGuest(undefined)).toBe(false);
  });
});

// Phase 7: Serialization safety tests -- verifies boundary enforcement per CONTEXT.md D-08
import { describe, expect, it } from "vitest";
import {
  createAuthorizationError,
  createNetworkError,
  createNotFoundError,
  createSystemError,
  createValidationError,
} from "@/Core/Foundations/Presentation/Errors/presentation-error";
import { failureResult, successResult } from "@/Core/Foundations/Presentation/Results/presentation-result";

const variants = [
  ["ValidationError", createValidationError("VALIDATION_ERROR", { field1: ["e1", "e2"], field2: ["e3"] })],
  ["NotFoundError", createNotFoundError("NOT_FOUND", "User not found", "Check the ID")],
  ["AuthorizationError", createAuthorizationError("UNAUTHORIZED", "Access denied")],
  ["SystemError", createSystemError("DB_DOWN", "Database unreachable", "critical")],
  ["NetworkError", createNetworkError("TIMEOUT", "Request timed out", true)],
] as const;

describe("no prototype leak", () => {
  it.each(variants)("%s has Object.prototype prototype", (_, error) => {
    expect(Object.getPrototypeOf(error)).toBe(Object.prototype);
  });

  it("successResult has Object.prototype prototype", () => {
    const result = successResult({ id: 1 }, "op-1");
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });

  it("failureResult has Object.prototype prototype", () => {
    const error = createValidationError("ERR", { field: ["msg"] });
    const result = failureResult(error, "op-1");
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });
});

describe("JSON round-trip preserves shape", () => {
  it.each(variants)("%s preserves keys and values after serialize/deserialize", (_, original) => {
    const parsed = JSON.parse(JSON.stringify(original)) as Record<string, unknown>;
    const orig = original as Record<string, unknown>;

    for (const key of Object.keys(orig)) {
      expect(parsed).toHaveProperty(key);
      expect(parsed[key]).toEqual(orig[key]);
    }

    expect(Object.keys(parsed).length).toBe(Object.keys(orig).length);
  });
});

describe("all 5 variants", () => {
  it("ValidationError has correct _tag and fieldErrors", () => {
    const err = createValidationError("VALIDATION_ERROR", { email: ["invalid"] });
    expect(err._tag).toBe("ValidationError");
    expect(err.fieldErrors).toEqual({ email: ["invalid"] });
  });

  it("NotFoundError has correct _tag, userMessage, and optional suggestedAction", () => {
    const err = createNotFoundError("NOT_FOUND", "Resource missing", "Try again");
    expect(err._tag).toBe("NotFoundError");
    expect(err.userMessage).toBe("Resource missing");
    expect(err.suggestedAction).toBe("Try again");
  });

  it("AuthorizationError has correct _tag and userMessage", () => {
    const err = createAuthorizationError("FORBIDDEN", "No permission");
    expect(err._tag).toBe("AuthorizationError");
    expect(err.userMessage).toBe("No permission");
  });

  it("SystemError has correct _tag and severity", () => {
    const err = createSystemError("CRASH", "System crashed", "error");
    expect(err._tag).toBe("SystemError");
    expect(err.severity).toBe("error");
  });

  it("NetworkError has correct _tag and retryable flag", () => {
    const err = createNetworkError("TIMEOUT", "Timed out", true);
    expect(err._tag).toBe("NetworkError");
    expect(err.retryable).toBe(true);
  });
});

describe("_tag discriminant preservation", () => {
  it.each(variants)("%s _tag survives JSON round-trip", (_, original) => {
    const parsed = JSON.parse(JSON.stringify(original)) as { _tag: string };
    expect(parsed._tag).toBe(original._tag);
  });
});

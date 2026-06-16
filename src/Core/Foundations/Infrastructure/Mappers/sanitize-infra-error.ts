import type { InfrastructureError } from "../Errors/infrastructure-error";

/**
 * Sanitizes an InfrastructureError's safeDetails for upward propagation.
 *
 * Default policy (D-13): sanitize unless debug flag is explicitly set.
 * - Strips hostnames, IPs, and internal URLs from string values (D-12)
 * - Defensively removes stack-trace-like strings from safeDetails
 * Returns an empty object when safeDetails is undefined.
 */
export function sanitizeInfraError(error: InfrastructureError, options?: { debug?: boolean }): Record<string, unknown> {
  // D-13 opt-out: debug mode returns raw safeDetails
  if (options?.debug === true) {
    return error.safeDetails ?? {};
  }

  // Default: sanitized mode
  if (error.safeDetails === undefined) {
    return {};
  }

  return sanitizeRecord(error.safeDetails);
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    // Defensive: strip stack-trace-like strings (not expected in safeDetails by construction)
    if (/^\s+at\s/m.test(value) || /^\s+Error:/.test(value)) {
      return "[REDACTED]";
    }
    // Strip hostnames (e.g. db.internal.example.com)
    if (/[a-z0-9]+\.[a-z0-9]+\.[a-z0-9]/i.test(value)) {
      return "[REDACTED]";
    }
    // Strip IP addresses
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) {
      return "[REDACTED]";
    }
    // Strip internal URLs
    if (value.includes("://")) {
      return "[REDACTED]";
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === "object" && value !== null) {
    return sanitizeRecord(value as Record<string, unknown>);
  }

  return value;
}

function sanitizeRecord(record: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = sanitizeValue(value);
  }
  return result;
}

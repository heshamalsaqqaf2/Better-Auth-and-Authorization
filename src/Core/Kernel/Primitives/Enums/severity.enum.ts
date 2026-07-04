export const Severity = {
  CRITICAL: "critical",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

export type Severity = (typeof Severity)[keyof typeof Severity];

export const SEVERITY_VALUES: readonly Severity[] = Object.values(Severity);

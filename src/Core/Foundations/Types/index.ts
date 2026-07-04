/**
 * @description
 * This module serves as a central point for exporting various types and constants used throughout the application.
 * It consolidates exports from different modules, making it easier to import them in other parts of the codebase.
 */

// Correlation ID
export type { CorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";
export { createCorrelationId, isCorrelationId } from "@/Core/Kernel/Primitives/Types/correlation-id.type";
// Error Codes
export type { ErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";
export { createErrorCode, defineErrorCode, isErrorCode } from "@/Core/Kernel/Primitives/Types/error-code.type";

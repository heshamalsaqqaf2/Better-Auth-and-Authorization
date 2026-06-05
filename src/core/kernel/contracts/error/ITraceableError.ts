/**
 * @file ITraceableError.ts
 * @description واجهة الخطأ القابل للتتبع - الأساس لجميع الأخطاء في النظام
 */

import type {
  ErrorCategory,
  ErrorCode,
  ErrorSeverity,
  LayerType,
} from "@/core/kernel/primitives/errors";

export interface AuditLogFromError {
  readonly action: string;
  readonly status: AuditResult;
  readonly severity: AuditSeverity;
  readonly entityType: string;

  readonly errorMessage: string;
  readonly errorCode: string;
  readonly errorLayer: string;
  readonly errorCategory: string;

  readonly entityId: string;
  readonly traceId?: TraceId;
  readonly correlationId?: CorrelationId;

  readonly timestamp: Timestamp;

  readonly metadata?: Record<string, unknown>;
}

/**
 * @description
 * واجهة الخطأ القابل للتتبع
 * جميع الأخطاء في النظام يجب أن تنفذ هذه الواجهة
 * توفر تتبعاً كاملاً عبر الطبقات مع الحفاظ على السبب الجذري
 */
export interface ITraceableError extends Error {
  readonly id: string;
  readonly name: string;
  readonly code: ErrorCode;
  readonly message: string;
  readonly userMessage?: string;

  readonly layer: LayerType;
  readonly severity: ErrorSeverity;
  readonly category: ErrorCategory;

  readonly timestamp: Timestamp | Date | string;
  readonly cause?: ITraceableError | Error;
  readonly context: Readonly<Record<string, unknown>>;
  readonly causeChain: ReadonlyArray<ITraceableError>;

  readonly userId?: string;
  readonly entityId?: string;
  readonly sessionId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly requestPath?: string;
  readonly requestMethod?: string;
  readonly moduleName?: string;
  readonly aggregateName?: string;

  readonly occurredAt?: Timestamp;
  readonly createdAt?: Timestamp;

  readonly metadata?: Record<string, unknown>;
}

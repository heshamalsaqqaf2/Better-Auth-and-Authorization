/**
 * @file IErrorTranslator.ts
 * @description واجهة مترجم الأخطاء - تُستخدم لترجمة الأخطاء بين الطبقات
 * @remarks
 * - تدعم قواعد الترجمة المخصصة
 * - ضرورية للتكامل بين الطبقات مع الحفاظ على العزل
 * - تسمح بترجمة الأخطاء من طبقة لأخرى مع الحفاظ على السبب الجذري
 */

import type { IResult } from "@/core/kernel/contracts/result/IResult";
import type {
  ErrorCategory,
  ErrorCode,
  ErrorSeverity,
  LayerType,
} from "@/core/kernel/primitives/errors";

// Types Eerror Translation
export type ErrorTransformFunction = (error: Error) => {
  code?: ErrorCode;
  message?: string;
  context?: Record<string, unknown>;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  userMessage?: string;
};
export interface ErrorTranslationRule {
  readonly sourceCode: ErrorCode;
  readonly targetCode: ErrorCode;
  readonly sourceLayer?: LayerType;
  readonly targetLayer?: LayerType;
  readonly transform?: ErrorTransformFunction;
  readonly priority?: number;
  readonly description?: string;
}

// Results Translation
export interface RegisterRuleResult {
  readonly success: boolean;
  readonly error?: string;
}
export interface ClearRulesResult {
  readonly success: boolean;
  readonly error?: string;
}

// Interface Translation Erorr
export interface IErrorTranslator {
  translate<T extends ITraceableError>(
    error: T,
    targetLayer: LayerType,
  ): IResult<ITraceableError, ITraceableError>;
  translateToDomain(
    error: ITraceableError,
  ): IResult<ITraceableError, ITraceableError>;
  translateToApplication(
    error: ITraceableError,
  ): IResult<ITraceableError, ITraceableError>;
  translateToInfrastructure(
    error: ITraceableError,
  ): IResult<ITraceableError, ITraceableError>;
  translateToPresentation(
    error: ITraceableError,
  ): IResult<ITraceableError, ITraceableError>;
  registerRule(
    sourceCode: ErrorCode,
    targetCode: ErrorCode,
    transform?: ErrorTransformFunction,
  ): RegisterRuleResult;
  registerRules(rules: ErrorTranslationRule[]): {
    success: boolean;
    errors: string[];
  };
  getRules(): ReadonlyArray<ErrorTranslationRule>;
  hasRule(sourceCode: ErrorCode): boolean;
}

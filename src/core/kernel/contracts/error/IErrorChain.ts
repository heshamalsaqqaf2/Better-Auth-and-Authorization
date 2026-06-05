/**
 * @file IErrorChain.ts
 * @description واجهة سلسلة الأخطاء - تُستخدم لتتبع السبب الجذري عبر الطبقات
 * @remarks
 *   - ITraceableError.causeChain: سلسلة مدمجة مع كل خطأ (للاستخدام الداخلي)
 *   - IErrorChain: واجهة مستقلة للتعامل المتقدم مع السلاسل (للتحليل والتقارير)
 *   - عند تجميع سلاسل من أخطاء متعددة
 *   - عند بناء تقارير أخطاء معقدة
 *   - متى تستخدم ITraceableError.getChain()؟
 *   - في معظم الحالات العادية
 *   - عند تتبع خطأ واحد فقط
 */

import type { ErrorCode, ErrorSeverity, LayerType } from "@/core/kernel/primitives/errors";
import type { ITraceableError } from "./ITraceableError";

export const ERROR_CHAIN_MAX_DEPTH = 10;

export interface ErrorChainSearchCriteria {
	readonly code?: ErrorCode | string;
	readonly layer?: LayerType;
	readonly severity?: ErrorSeverity;
	readonly predicate?: (error: ITraceableError) => boolean;
}
export interface ErrorChainAnalysis {
	readonly totalCount: number;
	readonly byLayer: Record<LayerType, number>;
	readonly bySeverity: Record<ErrorSeverity, number>;
	readonly rootCause: ITraceableError | undefined;
	readonly latestError: ITraceableError | undefined;
	readonly exceededMaxDepth: boolean;
	readonly uniqueErrorCodes: ReadonlyArray<ErrorCode>;
}
export interface ErrorChainBuilderOptions {
	readonly maxDepth?: number;
	readonly warnOnMaxDepth?: boolean;
	readonly onMaxDepthExceeded?: (depth: number) => void;
}

export interface IErrorChainBuilder {
	addError(error: ITraceableError): IErrorChainBuilder;
	addErrors(errors: ReadonlyArray<ITraceableError>): IErrorChainBuilder;
	build(): IErrorChain;
	reset(): IErrorChainBuilder;
	getCurrentDepth(): number;
	hasExceededMaxDepth(): boolean;
}

export interface IErrorChain {
	readonly chain: ReadonlyArray<ITraceableError>;
	readonly depth: number;
	readonly maxDepth: number;

	getRootCause(): ITraceableError | undefined;
	getLatestError(): ITraceableError | undefined;
	hasExceededMaxDepth(): boolean;
	toArray(): ReadonlyArray<ITraceableError>;
	toJSON(): Record<string, unknown>;
	toObject(): {
		readonly depth: number;
		readonly maxDepth: number;
		readonly exceededMaxDepth: boolean;
		readonly errors: ReadonlyArray<Record<string, unknown>>;
	};
	findByCode(code: string): ITraceableError | undefined;
	findByLayer(layer: LayerType): ITraceableError | undefined;
	findBySeverity(severity: ErrorSeverity): ITraceableError | undefined;
	find(predicate: (error: ITraceableError) => boolean): ITraceableError | undefined;
	filter(predicate: (error: ITraceableError) => boolean): ReadonlyArray<ITraceableError>;
	includes(predicate: (error: ITraceableError) => boolean): boolean;
	forEach(fn: (error: ITraceableError, index: number) => void): void;
	analyze(): ErrorChainAnalysis;
	// Helppers Methods
	getErrorsFromLayers(...layers: LayerType[]): ReadonlyArray<ITraceableError>;
	isEmpty(): boolean;
	isSingleError(): boolean;
	getSummary(): string;
}

//! UTILS
export const isErrorChain = (obj: unknown): obj is IErrorChain => {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"chain" in obj &&
		"depth" in obj &&
		"maxDepth" in obj &&
		"getRootCause" in obj &&
		"getLatestError" in obj &&
		"toArray" in obj &&
		"hasExceededMaxDepth" in obj
	);
};

export const isValidErrorChain = (obj: unknown): obj is IErrorChain => {
	if (!isErrorChain(obj)) return false;
	const chain = obj as IErrorChain;
	if (chain.depth !== chain.chain.length) return false;
	if (chain.depth > chain.maxDepth) return false;
	for (const error of chain.chain) {
		if (
			typeof error !== "object" ||
			error === null ||
			!("id" in error) ||
			!("code" in error) ||
			!("layer" in error)
		) {
			return false;
		}
	}
	return true;
};

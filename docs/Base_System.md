# 📕 وثيقة  نظام الأخطاء والنتائج متعدد الطبقات (Layered Error & Result System)

## 📋 1. النظرة العامة (Overview)

هذا النظام هو **حجر الأساس المؤسسي (Foundational Backbone)** للمشروع. يوفر عقوداً موحدة (Contracts) للأخطاء والنتائج عبر جميع الطبقات الأربع مع عزل صارم يضمن استقلالية كل طبقة.

**المبادئ الأساسية**:

- 🛡️ **العزل التام (Total Isolation)**: كل طبقة لها Error و Result Type خاص بها
- 🔄 **التحويل الصريح (Explicit Transformation)**: لا تحويل تلقائي بين الطبقات
- 🔒 **أمان التسلسل (Serialization Safety)**: DU فقط في طبقة العرض
- 📊 **قابلية المراقبة (Observability)**: دعم كامل للـ Logging, Metrics, Tracing, Audit

---

## 🎯 2. فلسفة الأخطاء متعددة الطبقات (Layered Error Philosophy)

### 2.1 ErrorBase - العقد الأساسي

**الموقع**: `src/core/foundations/error-base.ts`  
**الطبيعة**: Abstract Class

**الخصائص الأساسية**:

```typescript
abstract class ErrorBase {
  readonly code: string;           // رمز الخطأ الفريد
  readonly message: string;        // الرسالة الأساسية
  readonly timestamp: Date;        // وقت الحدوث
  readonly layer: LayerType;       // الطبقة (domain|app|infra|presentation)
  readonly cause?: ErrorBase;      // السبب الأصلي (للـ wrapping)
  
  abstract isRecoverable(): boolean;
  abstract getSeverity(): Severity;
  abstract toJSON(): object;
}
```

### 2.2 تحليل الأخطاء حسب الطبقة

#### 🔴 DomainError (OOP Class)

**الطبيعة**: Class غني بالسلوك - يمثل انتهاك قواعد الأعمال

**الخصائص**:

- `businessRule`: القاعدة المنتهكة
- `aggregateId`: معرف الكيان المتأثر
- `severity`: مستوى الخطورة في الأعمال
- `recoverable`: هل يمكن استرداد العمل؟

**الأمثلة**:

- `OrderCannotBeEmptyError`
- `InsufficientStockError`
- `InvalidOrderStateTransitionError`

**القيد**: ❌ لا يحمل تفاصيل تقنية (stack traces, DB connections)

---

#### 🟡 ApplicationError (OOP Class)

**الطبيعة**: Class مع Context غني - يمثل فشل Use Case

**الخصائص**:

- `operationName`: اسم العملية الفاشلة
- `userId`: المستخدم الذي نفذ العملية
- `correlationId`: للتتبع عبر الخدمات
- `wrappedDomainError`: الخطأ الأصلي من الـ Domain
- `retryable`: هل يمكن إعادة المحاولة؟

**الأمثلة**:

- `CreateOrderFailedError`
- `AuthorizationFailedError`
- `ValidationFailedError`

**القيد**: ❌ لا يحمل تفاصيل البنية التحتية

---

#### 🟠 InfrastructureError (OOP Class)

**الطبيعة**: Class تقني بحت - يمثل فشل تقني

**الخصائص**:

- `technicalCause`: السبب التقني الدقيق
- `retryCount`: عدد المحاولات
- `systemComponent`: المكون التقني الفاشل (DB, Cache, Queue, API)
- `safeDetails`: تفاصيل آمنة للنشر
- `retryStrategy`: استراتيجية إعادة المحاولة

**الأمثلة**:

- `DatabaseConnectionError`
- `ExternalApiTimeoutError`
- `CacheUnavailableError`
- `QueuePublishFailedError`

**القيد**: ❌ لا يحمل قواعد أعمال

---

#### 🟢 PresentationError (Discriminated Union)

**الطبيعة**: DU حصراً - للعرض الآمن في الـ Client

**البنية**:

```typescript
type PresentationError =
  | { _tag: 'ValidationError'; fieldErrors: Record<string, string>; userMessage: string }
  | { _tag: 'NotFoundError'; userMessage: string; suggestedAction?: string }
  | { _tag: 'AuthorizationError'; userMessage: string; requiredPermission?: string }
  | { _tag: 'SystemError'; userMessage: string; errorCode: string; severity: 'warning'|'error'|'critical' }
  | { _tag: 'NetworkError'; userMessage: string; retryable: boolean };
```

**القيد الصارم**:

- ❌ لا يحمل stack traces أبداً
- ❌ لا يحمل DomainError أو ApplicationError مباشرة
- ❌ لا يحمل Classes
- ✅ يحمل فقط معلومات آمنة ومفهومة للمستخدم

---

## 🎯 3. فلسفة النتائج متعددة الطبقات (Layered Result Philosophy)

### 3.1 ResultBase<T, E> - العقد الأساسي

**الموقع**: `src/core/foundations/result-base.ts`  
**الطبيعة**: Abstract Class

**السلوكيات الأساسية**:

```typescript
abstract class ResultBase<T, E extends ErrorBase> {
  abstract readonly isSuccess: boolean;
  abstract readonly isFailure: boolean;
  abstract readonly data?: T;
  abstract readonly error?: E;
  
  abstract map<U>(fn: (data: T) => U): ResultBase<U, E>;
  abstract flatMap<U>(fn: (data: T) => ResultBase<U, E>): ResultBase<U, E>;
  abstract mapError<F extends ErrorBase>(fn: (error: E) => F): ResultBase<T, F>;
  abstract match<R>(handlers: { onSuccess: (data: T) => R; onFailure: (error: E) => R }): R;
  abstract fold<R>(onSuccess: (data: T) => R, onFailure: (error: E) => R): R;
  abstract tap(fn: (data: T) => void): ResultBase<T, E>;
  abstract tapError(fn: (error: E) => void): ResultBase<T, E>;
}
```

### 3.2 تحليل النتائج حسب الطبقة

#### 🔴 DomainResult<T> (OOP Class)

**النوع**: `ResultBase<T, DomainError>`

**السلوكيات الإضافية**:

- Method Chaining أنيق: `result.map().validate().persist()`
- Monad Laws (Functor, Applicative, Monad)
- Pattern Matching داخلي

**القيد**: ❌ لا يُرسل للـ Client أبداً

---

#### 🟡 ApplicationResult<T> (OOP Class)

**النوع**: `ResultBase<T, ApplicationError>`

**السلوكيات الإضافية**:

- `log()`: تسجيل النتيجة
- `metrics()`: إرجاع مقاييس الأداء
- `audit()`: إضافة معلومات التدقيق
- `trackExecution()`: تتبع مدة التنفيذ

**القيد**: ❌ لا يُرسل للـ Client مباشرة

---

#### 🟠 InfrastructureResult<T> (OOP Class)

**النوع**: `ResultBase<T, InfrastructureError>`

**السلوكيات الإضافية**:

- `retry(times, delay)`: إعادة المحاولة
- `withTimeout(ms)`: إضافة timeout
- `withCircuitBreaker()`: إضافة circuit breaker
- `withFallback(fn)`: قيمة بديلة عند الفشل

**القيد**: ❌ لا يُرسل للـ Client أبداً

---

#### 🟢 PresentationResult<T> (Discriminated Union)

**البنية**:

```typescript
type PresentationResult<T> =
  | { 
      _tag: 'Success'; 
      data: T; 
      metadata?: {
        operationId: string;
        duration: number;
        timestamp: string;
      }
    }
  | { 
      _tag: 'Failure'; 
      error: PresentationError; 
      metadata?: {
        operationId: string;
        timestamp: string;
        retryAfter?: number;
      }
    };
```

**القيد الصارم**:

- ❌ لا يحمل Methods أبداً
- ❌ لا يحمل Classes
- ✅ يحمل فقط Plain Objects قابلة للتسلسل

---

## 🔄 4. استراتيجية التحويل بين الطبقات (Cross-Layer Transformation)

### 4.1 تدفق الأخطاء (Error Flow)

```
InfrastructureError
    ↓ [InfrastructureErrorMapper]
ApplicationError (مع context إضافي)
    ↓ [ApplicationErrorMapper]
DomainError (إذا كان أصله من Domain)
    ↓ [PresentationErrorMapper]
PresentationError (DU)
```

### 4.2 تدفق النتائج (Result Flow)

```
InfrastructureResult<RawData>
    ↓ [Repository Mapping]
DomainResult<Entity>
    ↓ [UseCase Mapping]
ApplicationResult<DTO>
    ↓ [Server Action Mapping]
PresentationResult<SafeDTO> ← يعبر الحدود
```

### 4.3 أنواع التحويلات

#### 🔄 Error Wrapping (التغليف)

الاحتفاظ بالسبب الأصلي مع إضافة context الطبقة الحالية:

```typescript
ApplicationError.create({
  operation: 'CreateOrder',
  userId: '123',
  cause: domainError  // ← الاحتفاظ بالسبب الأصلي
})
```

#### 🔄 Error Translation (الترجمة)

تحويل الرسائل التقنية لرسائل مفهومة للمستخدم:

```typescript
PresentationError.translate(appError, userLocale)
```

#### 🔄 Error Sanitization (التنقية)

إزالة المعلومات الحساسة:

```typescript
InfrastructureError.sanitizeForPresentation()
```

---

## 🛡️ 5. آليات العزل الصارم (Strict Isolation Mechanisms)

### 5.1 Import Boundaries

```
Domain: لا يستورد من أي طبقة
Application: يستورد من Domain فقط
Infrastructure: يستورد من Domain + Application
Presentation: يستورد من Application فقط
```

### 5.2 Type Guards

كل طبقة لديها Type Guard خاص:

```typescript
DomainError.isDomainError(error): error is DomainError
ApplicationError.isApplicationError(error): error is ApplicationError
```

### 5.3 Layer Validators

مدققات تتحقق من:

- صحة Result Type
- صحة Error Type
- عدم وجود تسرب للـ Types

### 5.4 Biome Rules (موصى به)

قواعد مخصصة تمنع:

- استيراد من طبقة أعلى
- استخدام Types من طبقة أخرى
- إرجاع Types خاطئة

---

## 📊 6. التكامل مع أنظمة المراقبة (Observability Integration)

### 6.1 Structured Logging

```typescript
result.tap(r => logger.info('Operation succeeded', { 
  operationId, 
  duration,
  data: r.data 
}))
```

### 6.2 Metrics Collection

```typescript
result.match({
  onSuccess: () => metrics.increment('orders.created.success'),
  onFailure: () => metrics.increment('orders.created.failure')
})
```

### 6.3 Distributed Tracing

- `correlationId` يمر عبر كل الـ Results
- `operationId` فريد لكل عملية
- `parentSpanId` لتتبع العمليات المتداخلة

### 6.4 Alerting

بناءً على:

- `error.severity`
- `error.isRecoverable()`
- `error.retryCount`

### 6.5 Audit Trail

تسجيل `ApplicationResult` قبل تحويله لـ `PresentationResult`:

```typescript
auditLogger.log({
  operation: 'CreateOrder',
  userId: currentUser.id,
  result: appResult,
  timestamp: new Date()
})
```

---

## 📁 7. هيكلية الملفات (File Structure)

```
src/
└── core/
    ├── kernel/                              # 🎯 الأساس الثابت والمركزي
    │   ├── contracts/
    │   │   ├── base/                        # العقود الأساسية
    │   │   │   ├── error-base.contract.ts
    │   │   │   ├── result-base.contract.ts
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── validators/
    │   │   │   ├── layer-validator.contract.ts
    │   │   │   ├── error-validator.contract.ts
    │   │   │   ├── result-validator.contract.ts
    │   │   │   └── index.ts
    │   │   │
    │   │   └── index.ts
    │   │
    │   ├── primitives/
    │   │   ├── enums/
    │   │   │   ├── severity.enum.ts
    │   │   │   ├── layer-type.enum.ts
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── types/
    │   │   │   ├── correlation-id.type.ts
    │   │   │   ├── error-code.type.ts
    │   │   │   ├── operation-id.type.ts
    │   │   │   └── index.ts
    │   │   │
    │   │   └── index.ts
    │   │
    │   ├── constants/
    │   │   ├── error-codes.constants.ts
    │   │   ├── layer-names.constants.ts
    │   │   └── index.ts
    │   │
    │   └── index.ts                         # Public API
    │
    └── foundations/                         # 🏛️ الطبقات الأربع
        ├── base/                            # 📐 الأساس المشترك
        │   ├── abstracts/
        │   │   ├── error-base.ts            # Abstract Class
        │   │   ├── result-base.ts           # Abstract Class
        │   │   └── index.ts
        │   │
        │   ├── validators/
        │   │   ├── base-error.validator.ts
        │   │   ├── base-result.validator.ts
        │   │   └── index.ts
        │   │
        │   ├── type-guards/
        │   │   ├── base-error.type-guard.ts
        │   │   ├── base-result.type-guard.ts
        │   │   └── index.ts
        │   │
        │   └── index.ts
        │
        ├── domain/                          # 🔴 Domain Layer (OOP)
        │   ├── errors/
        │   │   ├── domain-error.ts                    # Class
        │   │   ├── domain-error.contract.ts           # Interface
        │   │   ├── domain-error.validator.ts          # Validator
        │   │   ├── domain-error.type-guard.ts         # Type Guard
        │   │   │
        │   │   ├── specific/                          # أخطاء محددة وغيرها من الاخطاء التي تتبعها
        │   │   │   ├── complaint-errors/
        │   │   │   │   ├── complaint-not-found.error.ts
        │   │   │   │   ├── complaint-already-exists.error.ts
        │   │   │   │   └── index.ts
        │   │   │   ├── user-errors/
        │   │   │   │   ├── user-not-found.error.ts
        │   │   │   │   └── index.ts
        │   │   │   └── index.ts
        │   │   │
        │   │   └── index.ts
        │   │
        │   ├── results/
        │   │   ├── domain-result.ts                   # Class
        │   │   ├── domain-result.contract.ts          # Interface
        │   │   ├── domain-result.validator.ts         # Validator
        │   │   ├── domain-result.type-guard.ts        # Type Guard
        │   │   └── index.ts
        │   │
        │   └── index.ts
        │
        ├── application/                     # 🟡 Application Layer (OOP)
        │   ├── errors/
        │   │   ├── application-error.ts               # Class
        │   │   ├── application-error.contract.ts      # Interface
        │   │   ├── application-error.validator.ts     # Validator
        │   │   ├── application-error.type-guard.ts    # Type Guard
        │   │   │
        │   │   ├── specific/                          # أخطاء محددة وغيرها من الاخطاء التي تتبعها
        │   │   │   ├── usecase-errors/
        │   │   │   │   ├── create-order-failed.error.ts
        │   │   │   │   ├── authorization-failed.error.ts
        │   │   │   │   └── index.ts
        │   │   │   ├── validation-errors/
        │   │   │   │   ├── command-validation.error.ts
        │   │   │   │   └── index.ts
        │   │   │   └── index.ts
        │   │   └── index.ts
        │   │
        │   ├── results/
        │   │   ├── application-result.ts              # Class
        │   │   ├── application-result.contract.ts     # Interface
        │   │   ├── application-result.validator.ts    # Validator
        │   │   ├── application-result.type-guard.ts   # Type Guard
        │   │   └── index.ts
        │   │
        │   ├── mappers/
        │   │   ├── domain-to-application-error.mapper.ts
        │   │   └── index.ts
        │   │
        │   └── index.ts
        │
        ├── infrastructure/                  # 🟠 Infrastructure Layer (OOP)
        │   ├── errors/
        │   │   ├── infrastructure-error.ts            # Class
        │   │   ├── infrastructure-error.contract.ts   # Interface
        │   │   ├── infrastructure-error.validator.ts  # Validator
        │   │   ├── infrastructure-error.type-guard.ts # Type Guard
        │   │   │
        │   │   ├── specific/                          # أخطاء محددة وغيرها من الاخطاء التي تتبعها
        │   │   │   ├── database-errors/
        │   │   │   │   ├── database-connection.error.ts
        │   │   │   │   ├── database-query.error.ts
        │   │   │   │   └── index.ts
        │   │   │   ├── network-errors/
        │   │   │   │   ├── api-timeout.error.ts
        │   │   │   │   ├── api-unavailable.error.ts
        │   │   │   │   └── index.ts
        │   │   │   ├── cache-errors/
        │   │   │   │   ├── cache-unavailable.error.ts
        │   │   │   │   └── index.ts
        │   │   │   └── index.ts
        │   │   └── index.ts
        │   │
        │   ├── results/
        │   │   ├── infrastructure-result.ts           # Class
        │   │   ├── infrastructure-result.contract.ts  # Interface
        │   │   ├── infrastructure-result.validator.ts # Validator
        │   │   ├── infrastructure-result.type-guard.ts # Type Guard
        │   │   └── index.ts
        │   │
        │   ├── mappers/
        │   │   ├── application-to-infrastructure-error.mapper.ts
        │   │   └── index.ts
        │   │
        │   └── index.ts
        │
        ├── presentation/                    # 🟢 Presentation Layer (DU)
        │   ├── errors/
        │   │   ├── presentation-error.ts              # Discriminated Union
        │   │   ├── presentation-error.contract.ts     # Interface
        │   │   ├── presentation-error.validator.ts    # Validator
        │   │   ├── presentation-error.type-guard.ts   # Type Guard
        │   │   │
        │   │   ├── specific/                          # أخطاء محددة وغيرها من الاخطاء التي تتبعها
        │   │   │   ├── validation-ui-errors/
        │   │   │   │   ├── field-validation.error.ts
        │   │   │   │   └── index.ts
        │   │   │   ├── network-ui-errors/
        │   │   │   │   ├── network-error.error.ts
        │   │   │   │   └── index.ts
        │   │   │   ├── system-ui-errors/
        │   │   │   │   ├── system-error.error.ts
        │   │   │   │   └── index.ts
        │   │   │   └── index.ts
        │   │   │
        │   │   └── index.ts
        │   │
        │   ├── results/
        │   │   ├── presentation-result.ts             # Discriminated Union
        │   │   ├── presentation-result.contract.ts    # Interface
        │   │   ├── presentation-result.validator.ts   # Validator
        │   │   ├── presentation-result.type-guard.ts  # Type Guard
        │   │   └── index.ts
        │   │
        │   ├── mappers/
        │   │   ├── application-to-presentation-error.mapper.ts
        │   │   ├── application-to-presentation-result.mapper.ts
        │   │   └── index.ts
        │   │
        │   └── index.ts
        │
        └── index.ts                         # Public API
    
```

---

## 📏 8. القواعد التنفيذية للفريق (Team Rules)

### 🚫 محظورات صارمة

1. ❌ لا تُرجع DomainError أو ApplicationError من Server Action
2. ❌ لا تستخدم Classes في Presentation Layer
3. ❌ لا تستورد من طبقة أعلى مباشرة
4. ❌ لا تضع stack traces في PresentationError

### ✅ متطلبات إلزامية

1. ✅ كل Domain Entiti OR Domain Aggreagator يعيد `DomainResult<T, DomainError>`
1. ✅ كل UseCase/Handler يعيد `ApplicationResult<T, ApplicationError>`
1. ✅ كل Repository يعيد `InfrastructureResult<T, InfrastructureError>`
1. ✅ كل Server Action يعيد `PresentationResult<T>`
1. ✅ استخدم Mappers صريحة عند التحويل
1. ✅ احفظ `cause` chain للأخطاء
1. ✅ أضف `correlationId` لكل عملية

---

## 📊 9. مقاييس النجاح (Success Metrics)

### 10.1 مقاييس كمية

- ✅ **Zero Serialization Errors**: لا أخطاء تسلسل في Production
- ✅ **Error Traceability**: 100% من الأخطاء يمكن تتبعها لأصلها
- ✅ **Layer Isolation**: 0 انتهاكات للعزل بين الطبقات
- ✅ **Type Safety**: 0 runtime type errors
- ✅ **Audit Compliance**: 100% من العمليات الحساسة مسجلة

### 10.2 مقاييس نوعية

- ✅ **Code Maintainability**: سهولة إضافة ميزات جديدة
- ✅ **Debug Efficiency**: سرعة تشخيص الأخطاء
- ✅ **Team Productivity**: إنتاجية الفريق
- ✅ **System Reliability**: موثوقية النظام
- ✅ **Security**: عدم تسرب المعلومات الحساسة

---

## 📝 10. الخلاصة (Conclusion)

هذا النظام ليس مجرد "نمط"، بل هو **فلسفة معمارية كاملة** تضمن:

- 🛡️ **الموثوقية**: النظام لن ينهار بسبب أخطاء غير متوقعة
- 🔧 **القابلية للصيانة**: سهولة التعديل والإضافة
- 📈 **القابلية للتوسع**: يمكن إضافة طبقات جديدة بسهولة
- 🔒 **الأمان**: لا تسرب للمعلومات الحساسة
- ⚡ **الأداء**: Tree-shaking و Lazy evaluation
- 👥 **تجربة المطور**: Code clarity و Type safety

هذا التصميم يمثل **State of the Art** في بناء أنظمة Enterprise حديثة باستخدام TypeScript و Next.js 15.

---

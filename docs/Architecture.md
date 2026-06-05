# 📘 وثيقة المعمارية الهجينة (Hybrid Architecture Specification)

## 📋 1. النظرة التنفيذية (Executive Summary)

تتبنى هذه المعمارية نهجاً هجيناً يجمع بين **البرمجة الكائنية (OOP)** في الطبقات الداخلية و**النقابات المُميزة (Discriminated Unions)** عند حدود النظام. هذا الدمج يضمن توافقاً تاماً مع قيود Next.js 16 (RSC Payload Serialization) مع الحفاظ على مبادئ Clean Architecture و DDD و CQRS و SOLID.

**القاعدة الذهبية**:
> "OOP للسلوك والتعقيد الداخلي. Discriminated Unions للنقل، الحدود، والتعامل مع الواجهة."

---

## 🏛️ 2. الفلسفة المعمارية (Architectural Philosophy)

### 2.1 المبادئ الأساسية

| المبدأ | الوصف |
|--------|--------|
| **Serialization Boundary Rule** | أي كائن يعبر حدود الشبكة (Server Action → Client) يجب أن يكون Plain Object (DU) |
| **Behavior Encapsulation** | السلوك المعقد (Domain Logic) يبقى داخل Classes في السيرفر |
| **Data-Behavior Separation** | البيانات في الطبقة الخارجية تكون "غبيّة" (Dumb Data) ومفصولة عن السلوك |
| **Type Safety Across Boundaries** | ضمان أمان الأنواع من الـ Domain حتى الـ UI |
| **Tree-Shaking Optimization** | استخدام Static Functions لدعم تشذيب الشجرة بواسطة Turbopack/Webpack |

### 2.2 لماذا هذا الاختيار؟

- **OOP**: مثالي للـ Polymorphism، Dependency Injection، والتغليف (Encapsulation)
- **Discriminated Unions**: مثالية للتسلسل الآمن (JSON-safe)، Pattern Matching، و Type Narrowing
- **Next.js 15 Constraint**: الـ Classes تفقد دوالها عند التسلسل عبر RSC Payload، بينما الـ DUs تبقى سليمة 100%

---

## 🗺️ 3. خريطة التوزيع الطبقي (Layer-by-Layer Mapping)

| الطبقة | النمط المستخدم | السبب المعماري | نطاق الاستخدام |
|--------|---------------|----------------|----------------|
| **Domain** | 🟢 OOP Classes | Aggregates, Entities, Interface Repo Value Objects تحتاج Invariants و Encapsulation | Server-Side فقط |
| **Application** | 🟢 OOP Classes | UseCases و Handlers تحتاج DI و Orchestration | Server-Side فقط |
| **Infrastructure** | 🟢 OOP Classes | Repositories و External Clients تحتاج Polymorphism | Server-Side فقط |
| **Presentation** | 🔵 Discriminated Unions | Server Actions و Client Components تحتاج Serialization Safety | Server + Client |

---

## 🏗️ 4. التكامل مع الأنماط المعمارية

### 4.1 Clean Architecture

- **Dependency Direction**: من الخارج للداخل (Presentation → Application → Domain)
- **Boundary Crossing**: التحويل الصريح (Explicit Mapping) عند عبور كل طبقة
- **Independence**: الـ Domain لا يعرف شيئاً عن Next.js أو الـ UI

### 4.2 Domain-Driven Design (DDD)

- **Ubiquitous Language**: Classes في الـ Domain تحمل أسماء الأعمال
- **Rich Domain Model**: Aggregates تحمل سلوك الأعمال (Domain Services)
- **Bounded Contexts**: كل Module له Domain مستقل ومعزول

### 4.3 CQRS

- **Commands**: Classes تمثل نوايا التغيير (CreateNameCommand)
- **Queries**: Classes تمثل نوايا القراءة (GetNameByIdQuery)
- **Handlers**: Classes منفصلة لتنفيذ كل Command/Query
- **Return Type**: جميع الـ Handlers تعيد `ApplicationResult<T, E>` (OOP داخلياً)

### 4.4 SOLID Principles

- **S**: كل UseCase/Handler لديه مسؤولية واحدة
- **O**: Classes مفتوحة للتوسعة عبر Interfaces
- **L**: Polymorphism في Repositories و Services
- **I**: Interfaces محددة لكل طبقة
- **D**: Dependency Injection عبر Composition Root

---

## 🔄 5. تدفق البيانات (Data Flow)

### 5.1 تدفق ناجح (Success Flow)

```
[Client Component] (FormData)
    ↓
[Server Action] (Presentation - DU)
    ↓ (Create Command)
[Command Handler] (Application - OOP)
    ↓ (Use Domain)
[Domain Service] (Domain - OOP)
    ↓ (Persist)
[Repository] (Infrastructure - OOP)
    ↓ (Return Entity)
[Domain Service] → [Handler]
    ↓ (Map to DTO + wrap in ApplicationResult)
[Server Action]
    ↓ (Map to PresentationResult - DU)
[Client Component] (Pattern Match on DU)
```

### 5.2 نقطة التحول الحرجة (Critical Transformation Point)

التحويل من `ApplicationResult` (OOP) إلى `PresentationResult` (DU) يحدث **فقط** في Server Action قبل الإرجاع للعميل.

---

## 📏 6. القواعد التنفيذية الصارمة (Strict Implementation Rules)

### 🚫 القواعد المحظورة (Forbidden)

1. ❌ لا تُرجع Class أبداً من Server Action أو Route Handler
2. ❌ لا تستدعي دوال على كائنات قادمة من Server Action في Client Component
3. ❌ لا تُرسل Domain Entities مباشرة للـ Client (استخدم DTOs دائماً)
4. ❌ لا تضع سلوكاً (Methods) في Discriminated Unions
5. ❌ لا تستورد Types من طبقة أعلى (Import Boundary Violation)

### ✅ القواعد الإلزامية (Mandatory)

1. ✅ كل UseCase/Handler يجب أن يعيد `ApplicationResult<T, E>`
2. ✅ كل Server Action يجب أن يعيد `PresentationResult<T>` (DU)
3. ✅ استخدم Mappers صريحة عند تحويل البيانات بين الطبقات
4. ✅ استخدم Pattern Matching في Client Components للتعامل مع النتائج
5. ✅ كل Module يجب أن يحترم Import Boundaries

---

## 📁 7. هيكلية المجلدات (Folder Structure)

```
src/
├── core/
│   ├── capabilities/          # Cross-cutting concerns
│   ├── foundations/
│   │   ├── domain/           # DomainResult, DomainError (OOP)
│   │   ├── application/      # ApplicationResult, ApplicationError (OOP)
│   │   ├── infrastructure/   # InfrastructureResult, InfrastructureError (OOP)
│   │   └── presentation/     # PresentationResult, PresentationError (DU)
│   └── kernel/              # Contracts, Primitives
├── modules/
│   ├── NameModel/
│   │   ├── domain/          # Aggregate (OOP)
│   │   ├── application/     # Handler (OOP)
│   │   ├── infrastructure/  # Repository (OOP)
│   │   └── presentation/    # Server Actions (DU)
└── compositions-root/       # DI Container Modern Composition Root Pattern [Bindings, Modules]
```

---

## 📊 8. مقاييس النجاح (Success Metrics)

- ✅ **Zero Serialization Errors**: لا أخطاء `is not a function` في الإنتاج
- ✅ **Type Safety**: 100% Type inference من الـ Domain للـ UI
- ✅ **Bundle Size**: Tree-shaking فعال للدوال غير المستخدمة
- ✅ **Maintainability**: سهولة إضافة ميزات جديدة دون كسر العزل
- ✅ **Performance**: Lazy evaluation و Memoization للعمليات الثقيلة

---

## 📝 9. الخلاصة (Conclusion)

هذه المعمارية الهجينة ليست حلاً وسطاً، بل هي **اختيار استراتيجي** يجمع أفضل ما في العالمين. تمثل State of the Art في بناء أنظمة Enterprise حديثة باستخدام TypeScript و Next.js 16.

---
---

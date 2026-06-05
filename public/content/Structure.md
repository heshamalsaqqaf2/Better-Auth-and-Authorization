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
        │   │   ├── specific/                          # أخطاء محددة
        │   │   │   ├── order-errors/
        │   │   │   │   ├── order-not-found.error.ts
        │   │   │   │   ├── order-already-exists.error.ts
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
        │   │   ├── specific/
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
        │   │   ├── specific/
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
        │   │   ├── specific/
        │   │   │   ├── validation-ui-errors/
        │   │   │   │   ├── field-validation.error.ts
        │   │   │   │   └── index.ts
        │   │   │   │
        │   │   │   ├── network-ui-errors/
        │   │   │   │   ├── network-error.error.ts
        │   │   │   │   └── index.ts
        │   │   │   │
        │   │   │   ├── system-ui-errors/
        │   │   │   │   ├── system-error.error.ts
        │   │   │   │   └── index.ts
        │   │   │   │
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

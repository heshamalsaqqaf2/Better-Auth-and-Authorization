<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:base-system -->
# Base System

This system is the **foundational backbone** of the project. It provides standardized contracts for errors and results across all four layers, with strict isolation ensuring the independence of each layer.

**Key Principles**:

- **Total Isolation**: Each layer has its own unique Error and Result Type.
- **Explicit Transformation**: No automatic transformation between layers.
- **Serialization Safety**: DU only in the view layer.
- **Observability**: Full support for logging, metrics, tracing, and auditing.
<!-- END:base-system -->

<!-- BEGIN:architecture -->
This architecture adopts a hybrid approach that combines object-oriented programming (OOP) in the inner layers with discrete unions at the system boundaries. This integration ensures full compliance with Next.js 16 (RSC Payload Serialization) constraints while maintaining the principles of Clean Architecture, DDD, CQRS, and SOLID.

*The Golden Rule:*
"OOP for behavior and internal complexity. Discriminated Unions for transport, boundaries, and interface handling."
<!-- END:architecture -->

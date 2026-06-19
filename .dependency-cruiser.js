/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "kernel-boundary",
      comment:
        "Kernel must have zero external dependencies — no imports from any Foundation layer.",
      severity: "error",
      from: { path: "^src/Core/Kernel" },
      to: {
        pathNot: [
          "^src/Core/Kernel",
          "^node_modules",
        ],
      },
    },
    {
      name: "base-boundary",
      comment:
        "Base can only import from Kernel — no imports from Domain, Application, Infrastructure, or Presentation.",
      severity: "error",
      from: { path: "^src/Core/Foundations/Base" },
      to: {
        pathNot: [
          "^src/Core/Kernel",
          "^src/Core/Foundations/Base",
          "^node_modules",
        ],
      },
    },
    {
      name: "domain-boundary",
      comment:
        "Domain can only import from Kernel and Base — no imports from Application, Infrastructure, or Presentation.",
      severity: "error",
      from: { path: "^src/Core/Foundations/Domain" },
      to: {
        pathNot: [
          "^src/Core/Kernel",
          "^src/Core/Foundations/Base",
          "^src/Core/Foundations/Domain",
          "^node_modules",
        ],
      },
    },
    {
      name: "application-boundary",
      comment:
        "Application can only import from Kernel, Base, and Domain — no imports from Infrastructure or Presentation.",
      severity: "error",
      from: { path: "^src/Core/Foundations/Application" },
      to: {
        pathNot: [
          "^src/Core/Kernel",
          "^src/Core/Foundations/Base",
          "^src/Core/Foundations/Domain",
          "^src/Core/Foundations/Application",
          "^node_modules",
        ],
      },
    },
    {
      name: "infrastructure-boundary",
      comment:
        "Infrastructure can only import from Kernel, Base, and Application — no imports from Domain or Presentation.",
      severity: "error",
      from: { path: "^src/Core/Foundations/Infrastructure" },
      to: {
        pathNot: [
          "^src/Core/Kernel",
          "^src/Core/Foundations/Base",
          "^src/Core/Foundations/Application",
          "^src/Core/Foundations/Infrastructure",
          "^node_modules",
        ],
      },
    },
    {
      name: "presentation-boundary",
      comment:
        "Presentation can only import from Kernel and Application — no imports from Base, Domain, or Infrastructure.",
      severity: "error",
      from: { path: "^src/Core/Foundations/Presentation" },
      to: {
        pathNot: [
          "^src/Core/Kernel",
          "^src/Core/Foundations/Application",
          "^src/Core/Foundations/Presentation",
          "^node_modules",
        ],
      },
    },
    {
      name: "core-circular-deps",
      comment:
        "Circular dependencies within src/Core/ are architectural debt — any cycle is a failure.",
      severity: "error",
      from: { path: "^src/Core/" },
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      path: "\\.next|\\.nyc_output|dist|build|coverage",
    },
    includeOnly: "^src/Core/",
  },
};

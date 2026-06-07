import type { LayerType } from "../Primitives/Enums/layer-type.enum";

export const LayerNames = {
  DOMAIN: "Domain Layer",
  APPLICATION: "Application Layer",
  INFRASTRUCTURE: "Infrastructure Layer",
  PRESENTATION: "Presentation Layer",
} as const satisfies Record<keyof typeof LayerType, string>;

export type LayerName = (typeof LayerNames)[keyof typeof LayerNames];

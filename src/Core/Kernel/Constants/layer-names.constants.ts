import type { LayerType } from "../Primitives/Enums/layer-type.enum";

export const LAYER_NAMES = {
  DOMAIN: "Domain Layer",
  APPLICATION: "Application Layer",
  INFRASTRUCTURE: "Infrastructure Layer",
  PRESENTATION: "Presentation Layer",
} as const satisfies Record<keyof typeof LayerType, string>;

export type LayerName = (typeof LAYER_NAMES)[keyof typeof LAYER_NAMES];

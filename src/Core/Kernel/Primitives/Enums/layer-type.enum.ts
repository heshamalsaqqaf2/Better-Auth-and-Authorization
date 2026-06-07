export const LayerType = {
  DOMAIN: 'domain',
  APPLICATION: 'application',
  INFRASTRUCTURE: 'infrastructure',
  PRESENTATION: 'presentation',
} as const;

export type LayerType = (typeof LayerType)[keyof typeof LayerType];

export const LAYER_TYPE_VALUES: readonly LayerType[] = Object.values(LayerType);

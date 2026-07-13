// Validated categorical palette (dataviz skill reference instance).
// Fixed order — never cycled or reassigned once a category has a slot.
export const CATEGORICAL_PALETTE_LIGHT = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
];

export const CATEGORICAL_PALETTE_DARK = [
  "#3987e5",
  "#199e70",
  "#c98500",
  "#008300",
  "#9085e9",
  "#e66767",
  "#d55181",
  "#d95926",
];

export function nextCategoryColor(existingCount: number): string {
  return CATEGORICAL_PALETTE_LIGHT[existingCount % CATEGORICAL_PALETTE_LIGHT.length];
}

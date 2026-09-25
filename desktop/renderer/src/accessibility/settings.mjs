export const COLOR_VISION_MODES =
  Object.freeze([
    "none",
    "deuteranopia",
    "protanopia",
    "tritanopia",
  ]);

export function createDefaultAccessibilitySettings({
  reduceMotionDefault = false,
} = {}) {
  return {
    largeText: false,
    highContrast: false,
    colorVision: "none",
    reduceMotion:
      Boolean(
        reduceMotionDefault
      ),
  };
}

export function normalizeAccessibilitySettings(
  input,
  {
    reduceMotionDefault = false,
  } = {}
) {
  const defaults =
    createDefaultAccessibilitySettings({
      reduceMotionDefault,
    });

  if (
    !input ||
    typeof input !==
      "object"
  ) {
    return defaults;
  }

  const colorVision =
    COLOR_VISION_MODES.includes(
      input.colorVision
    )
      ? input.colorVision
      : defaults.colorVision;

  return {
    largeText:
      typeof input.largeText ===
        "boolean"
        ? input.largeText
        : defaults.largeText,
    highContrast:
      typeof input.highContrast ===
        "boolean"
        ? input.highContrast
        : defaults.highContrast,
    colorVision,
    reduceMotion:
      typeof input.reduceMotion ===
        "boolean"
        ? input.reduceMotion
        : defaults.reduceMotion,
  };
}

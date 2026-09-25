import assert from "node:assert/strict";

import {
  COLOR_VISION_MODES,
  createDefaultAccessibilitySettings,
  normalizeAccessibilitySettings,
} from "../desktop/renderer/src/accessibility/settings.mjs";

assert.deepEqual(
  createDefaultAccessibilitySettings(),
  {
    largeText: false,
    highContrast: false,
    colorVision: "none",
    reduceMotion: false,
  }
);

assert.equal(
  createDefaultAccessibilitySettings({
    reduceMotionDefault: true,
  }).reduceMotion,
  true
);

for (
  const mode of
  COLOR_VISION_MODES
) {
  assert.equal(
    normalizeAccessibilitySettings({
      colorVision:
        mode,
    }).colorVision,
    mode
  );
}

const normalized =
  normalizeAccessibilitySettings(
    {
      largeText: true,
      highContrast: true,
      colorVision:
        "unsupported",
      reduceMotion: false,
    },
    {
      reduceMotionDefault:
        true,
    }
  );

assert.deepEqual(
  normalized,
  {
    largeText: true,
    highContrast: true,
    colorVision: "none",
    reduceMotion: false,
  }
);

console.log(
  "Accessibility settings tests passed."
);

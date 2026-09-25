import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  COLOR_VISION_MODES,
  createDefaultAccessibilitySettings,
  normalizeAccessibilitySettings,
} from "./settings.mjs";

const STORAGE_KEY =
  "swingsync.accessibility";

const AccessibilityContext =
  createContext(null);

function systemPrefersReducedMotion() {
  try {
    return Boolean(
      window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      ).matches
    );
  } catch {
    return false;
  }
}

function initialSettings() {
  const reduceMotionDefault =
    systemPrefersReducedMotion();

  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (stored) {
      return normalizeAccessibilitySettings(
        JSON.parse(
          stored
        ),
        {
          reduceMotionDefault,
        }
      );
    }
  } catch {
    // Accessibility preferences remain usable without storage.
  }

  return createDefaultAccessibilitySettings({
    reduceMotionDefault,
  });
}

export function AccessibilityProvider({
  children,
}) {
  const [
    settings,
    setSettings,
  ] = useState(
    initialSettings
  );

  useEffect(() => {
    const root =
      document.documentElement;

    root.dataset.a11yText =
      settings.largeText
        ? "large"
        : "normal";

    root.dataset.a11yContrast =
      settings.highContrast
        ? "high"
        : "normal";

    root.dataset.a11yColorVision =
      settings.colorVision;

    root.dataset.a11yMotion =
      settings.reduceMotion
        ? "reduced"
        : "normal";

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          settings
        )
      );
    } catch {
      // Persistence is optional.
    }
  }, [
    settings,
  ]);

  const setSetting =
    useCallback(
      (
        key,
        value
      ) => {
        setSettings(
          (current) => {
            if (
              key ===
                "colorVision" &&
              !COLOR_VISION_MODES.includes(
                value
              )
            ) {
              return current;
            }

            return {
              ...current,
              [key]:
                value,
            };
          }
        );
      },
      []
    );

  const reset =
    useCallback(
      () => {
        setSettings(
          createDefaultAccessibilitySettings({
            reduceMotionDefault:
              systemPrefersReducedMotion(),
          })
        );
      },
      []
    );

  const value =
    useMemo(
      () => ({
        ...settings,
        colorVisionModes:
          COLOR_VISION_MODES,
        setLargeText:
          (value) =>
            setSetting(
              "largeText",
              Boolean(value)
            ),
        setHighContrast:
          (value) =>
            setSetting(
              "highContrast",
              Boolean(value)
            ),
        setColorVision:
          (value) =>
            setSetting(
              "colorVision",
              value
            ),
        setReduceMotion:
          (value) =>
            setSetting(
              "reduceMotion",
              Boolean(value)
            ),
        reset,
      }),
      [
        settings,
        setSetting,
        reset,
      ]
    );

  return (
    <AccessibilityContext.Provider
      value={value}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context =
    useContext(
      AccessibilityContext
    );

  if (!context) {
    throw new Error(
      "useAccessibility must be used inside AccessibilityProvider"
    );
  }

  return context;
}

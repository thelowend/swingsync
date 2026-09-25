import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useAccessibility,
} from "../accessibility/AccessibilityContext.jsx";

import {
  useLanguage,
} from "../i18n/LanguageContext.jsx";

function AccessibilityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="12"
        cy="7.4"
        r="1.5"
        fill="currentColor"
      />
      <path
        d="M7.8 10.2h8.4M12 9.8v4.2M12 14l-3 4M12 14l3 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SwitchOption({
  checked,
  label,
  description,
  onChange,
}) {
  return (
    <button
      type="button"
      className="accessibility-switch"
      role="switch"
      aria-checked={
        checked
      }
      onClick={() =>
        onChange(
          !checked
        )
      }
    >
      <span className="accessibility-option-copy">
        <strong>
          {label}
        </strong>
        {description && (
          <small>
            {description}
          </small>
        )}
      </span>

      <span
        className={`accessibility-switch-track ${
          checked
            ? "on"
            : ""
        }`}
        aria-hidden="true"
      >
        <span />
      </span>
    </button>
  );
}

export default function AccessibilityMenu() {
  const {
    largeText,
    highContrast,
    colorVision,
    reduceMotion,
    setLargeText,
    setHighContrast,
    setColorVision,
    setReduceMotion,
    reset,
  } = useAccessibility();

  const {
    t,
  } = useLanguage();

  const [
    open,
    setOpen,
  ] = useState(false);

  const rootRef =
    useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onPointerDown(
      event
    ) {
      if (
        !rootRef.current?.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      onPointerDown
    );

    document.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        onPointerDown
      );

      document.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [
    open,
  ]);

  return (
    <div
      className="accessibility-menu"
      ref={rootRef}
    >
      <button
        type="button"
        className={`accessibility-trigger ${
          open
            ? "active"
            : ""
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="accessibility-popover"
        aria-label={t(
          "Accessibility"
        )}
        title={t(
          "Accessibility"
        )}
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
      >
        <AccessibilityIcon />
      </button>

      {open && (
        <section
          id="accessibility-popover"
          className="accessibility-popover"
          role="dialog"
          aria-labelledby="accessibility-title"
        >
          <header className="accessibility-popover-header">
            <div>
              <span className="eyebrow">
                {t(
                  "Display options"
                )}
              </span>
              <strong id="accessibility-title">
                {t(
                  "Accessibility"
                )}
              </strong>
            </div>

            <button
              type="button"
              className="accessibility-reset"
              onClick={
                reset
              }
            >
              {t(
                "Reset"
              )}
            </button>
          </header>

          <div className="accessibility-options">
            <SwitchOption
              checked={
                largeText
              }
              label={t(
                "Larger text"
              )}
              description={t(
                "Increase interface and text size"
              )}
              onChange={
                setLargeText
              }
            />

            <SwitchOption
              checked={
                highContrast
              }
              label={t(
                "High contrast"
              )}
              description={t(
                "Increase separation between text, controls, and surfaces"
              )}
              onChange={
                setHighContrast
              }
            />

            <div className="accessibility-select-option">
              <label
                htmlFor="accessibility-color-vision"
              >
                <strong>
                  {t(
                    "Color vision filter"
                  )}
                </strong>
                <small>
                  {t(
                    "Use an alternate palette for color distinctions"
                  )}
                </small>
              </label>

              <select
                id="accessibility-color-vision"
                value={
                  colorVision
                }
                onChange={(event) =>
                  setColorVision(
                    event.target.value
                  )
                }
              >
                <option value="none">
                  {t(
                    "No color filter"
                  )}
                </option>
                <option value="deuteranopia">
                  {t(
                    "Deuteranopia"
                  )}
                </option>
                <option value="protanopia">
                  {t(
                    "Protanopia"
                  )}
                </option>
                <option value="tritanopia">
                  {t(
                    "Tritanopia"
                  )}
                </option>
              </select>
            </div>

            <SwitchOption
              checked={
                reduceMotion
              }
              label={t(
                "Reduce motion"
              )}
              description={t(
                "Minimize pulses, transitions, and animated emphasis"
              )}
              onChange={
                setReduceMotion
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}

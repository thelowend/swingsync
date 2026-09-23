import {
  useLanguage,
} from "../i18n/LanguageContext.jsx";

import {
  useTheme,
} from "../theme/ThemeContext.jsx";

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M19.2 15.3A7.7 7.7 0 0 1 8.7 4.8 7.7 7.7 0 1 0 19.2 15.3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const {
    theme,
    setTheme,
  } = useTheme();

  const {
    t,
  } = useLanguage();

  return (
    <div
      className="theme-toggle"
      role="group"
      aria-label={t(
        "SwingSync desktop theme"
      )}
      title={t(
        "Theme"
      )}
    >
      <button
        type="button"
        className={
          theme === "light"
            ? "active"
            : ""
        }
        aria-pressed={
          theme === "light"
        }
        aria-label={t(
          "Light"
        )}
        title={t(
          "Light"
        )}
        onClick={() =>
          setTheme(
            "light"
          )
        }
      >
        <SunIcon />
      </button>

      <button
        type="button"
        className={
          theme === "dark"
            ? "active"
            : ""
        }
        aria-pressed={
          theme === "dark"
        }
        aria-label={t(
          "Dark"
        )}
        title={t(
          "Dark"
        )}
        onClick={() =>
          setTheme(
            "dark"
          )
        }
      >
        <MoonIcon />
      </button>
    </div>
  );
}

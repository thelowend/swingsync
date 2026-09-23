import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY =
  "swingsync.theme";

const THEMES =
  Object.freeze([
    "light",
    "dark",
  ]);

const ThemeContext =
  createContext(null);

function initialTheme() {
  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (
      THEMES.includes(
        stored
      )
    ) {
      return stored;
    }
  } catch {
    // Theme persistence is optional.
  }

  // Preserve the current cream theme on first launch.
  return "light";
}

export function ThemeProvider({
  children,
}) {
  const [
    theme,
    setThemeState,
  ] = useState(
    initialTheme
  );

  useEffect(() => {
    document.documentElement.dataset.theme =
      theme;

    document.documentElement.style.colorScheme =
      theme;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        theme
      );
    } catch {
      // Ignore unavailable local storage.
    }
  }, [theme]);

  const setTheme =
    useCallback(
      (nextTheme) => {
        if (
          !THEMES.includes(
            nextTheme
          )
        ) {
          return;
        }

        setThemeState(
          nextTheme
        );
      },
      []
    );

  const toggleTheme =
    useCallback(
      () => {
        setThemeState(
          (current) =>
            current ===
              "light"
              ? "dark"
              : "light"
        );
      },
      []
    );

  const value =
    useMemo(
      () => ({
        theme,
        themes:
          THEMES,
        setTheme,
        toggleTheme,
      }),
      [
        theme,
        setTheme,
        toggleTheme,
      ]
    );

  return (
    <ThemeContext.Provider
      value={value}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(
      ThemeContext
    );

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}

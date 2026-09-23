import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DOMAIN_SOURCES,
  REASON_SOURCES,
  SPANISH_TRANSLATIONS,
  SUPPORTED_LANGUAGES,
} from "./translations.mjs";

const STORAGE_KEY =
  "swingsync.language";

const LanguageContext =
  createContext(null);

function interpolate(
  template,
  params = {}
) {
  return String(template).replace(
    /\{([a-zA-Z0-9_]+)\}/g,
    (
      match,
      key
    ) =>
      Object.prototype.hasOwnProperty.call(
        params,
        key
      )
        ? String(params[key])
        : match
  );
}

function initialLanguage() {
  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (
      SUPPORTED_LANGUAGES.some(
        (item) =>
          item.code === stored
      )
    ) {
      return stored;
    }
  } catch {
    // Storage is a convenience, not a requirement.
  }

  const locale =
    window.navigator
      ?.language
      ?.toLowerCase() ??
    "en";

  return locale.startsWith(
    "es"
  )
    ? "es"
    : "en";
}

export function LanguageProvider({
  children,
}) {
  const [
    language,
    setLanguageState,
  ] = useState(
    initialLanguage
  );

  useEffect(() => {
    document.documentElement.lang =
      language;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        language
      );
    } catch {
      // Ignore unavailable local storage.
    }
  }, [language]);

  const setLanguage =
    useCallback(
      (nextLanguage) => {
        if (
          !SUPPORTED_LANGUAGES.some(
            (item) =>
              item.code ===
              nextLanguage
          )
        ) {
          return;
        }

        setLanguageState(
          nextLanguage
        );
      },
      []
    );

  const t =
    useCallback(
      (
        source,
        params = {}
      ) => {
        if (
          source === null ||
          source === undefined
        ) {
          return "";
        }

        const template =
          language === "es"
            ? (
                SPANISH_TRANSLATIONS[
                  source
                ] ??
                source
              )
            : source;

        return interpolate(
          template,
          params
        );
      },
      [language]
    );

  const plural =
    useCallback(
      (
        singularSource,
        pluralSource,
        count,
        params = {}
      ) =>
        t(
          count === 1
            ? singularSource
            : pluralSource,
          {
            ...params,
            count,
          }
        ),
      [t]
    );

  const domainLabel =
    useCallback(
      (
        domain,
        value
      ) => {
        if (
          value === null ||
          value === undefined
        ) {
          return "—";
        }

        const source =
          DOMAIN_SOURCES[
            domain
          ]?.[value];

        return source
          ? t(source)
          : String(value);
      },
      [t]
    );

  const formatNumber =
    useCallback(
      (
        value,
        digits = 1
      ) => {
        if (
          !Number.isFinite(
            value
          )
        ) {
          return "—";
        }

        return new Intl.NumberFormat(
          language === "es"
            ? "es-AR"
            : "en-US",
          {
            minimumFractionDigits:
              digits,
            maximumFractionDigits:
              digits,
          }
        ).format(
          value
        );
      },
      [language]
    );

  const formatBpm =
    useCallback(
      (
        value,
        digits = 1,
        unavailable = "—"
      ) =>
        Number.isFinite(
          value
        )
          ? `${formatNumber(
              value,
              digits
            )} BPM`
          : unavailable,
      [formatNumber]
    );

  const formatReason =
    useCallback(
      (
        reasonCode,
        reasonParams = {},
        fallback = null
      ) => {
        const source =
          REASON_SOURCES[
            reasonCode
          ];

        if (!source) {
          return fallback
            ? t(fallback)
            : "";
        }

        const params = {
          ...reasonParams,
        };

        if (
          params.profile
        ) {
          params.profile =
            domainLabel(
              "profile",
              params.profile
            );
        }

        const precision = {
          candidateBpm: 2,
          detectedBpm: 2,
          candidateScore: 2,
          maximumScore: 1,
          totalScore: 1,
          requiredScore: 1,
        };

        for (
          const [
            key,
            digits,
          ] of Object.entries(
            precision
          )
        ) {
          if (
            Number.isFinite(
              params[key]
            )
          ) {
            params[key] =
              formatNumber(
                params[key],
                digits
              );
          }
        }

        return t(
          source,
          params
        );
      },
      [
        domainLabel,
        formatNumber,
        t,
      ]
    );

  const metadataSupportReason =
    useCallback(
      (
        file,
        fallback
      ) => {
        const lower =
          String(
            file ?? ""
          ).toLowerCase();

        if (
          lower.endsWith(
            ".wav"
          )
        ) {
          return t(
            "WAV does not have a sufficiently interoperable BPM convention in this version"
          );
        }

        if (
          lower.endsWith(
            ".aac"
          )
        ) {
          return t(
            "Raw AAC does not provide a reliable cross-player metadata container"
          );
        }

        if (fallback) {
          const configured =
            fallback.match(
              /^Metadata BPM writing is not configured for /
            );

          if (configured) {
            return t(
              "Metadata BPM writing is not configured for this file type"
            );
          }

          return t(
            fallback
          );
        }

        return t(
          "Metadata BPM writing is not configured for this file type"
        );
      },
      [t]
    );

  const value =
    useMemo(
      () => ({
        language,
        languages:
          SUPPORTED_LANGUAGES,
        setLanguage,
        t,
        plural,
        domainLabel,
        formatNumber,
        formatBpm,
        formatReason,
        metadataSupportReason,
      }),
      [
        language,
        setLanguage,
        t,
        plural,
        domainLabel,
        formatNumber,
        formatBpm,
        formatReason,
        metadataSupportReason,
      ]
    );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}

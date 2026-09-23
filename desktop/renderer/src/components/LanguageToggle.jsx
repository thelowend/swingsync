import {
  useLanguage,
} from "../i18n/LanguageContext.jsx";

export default function LanguageToggle() {
  const {
    language,
    languages,
    setLanguage,
    t,
  } = useLanguage();

  return (
    <div
      className="language-toggle"
      role="group"
      aria-label={t(
        "SwingSync desktop language"
      )}
      title={t(
        "Language"
      )}
    >
      {languages.map(
        (item) => (
          <button
            key={
              item.code
            }
            type="button"
            className={
              language ===
              item.code
                ? "active"
                : ""
            }
            aria-pressed={
              language ===
              item.code
            }
            aria-label={t(
              item.label
            )}
            title={t(
              item.label
            )}
            onClick={() =>
              setLanguage(
                item.code
              )
            }
          >
            {item.shortLabel}
          </button>
        )
      )}
    </div>
  );
}

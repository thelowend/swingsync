import {
  useLanguage,
} from "../i18n/LanguageContext.jsx";

function Detail({
  label,
  value,
  accent = false,
}) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong
        className={
          accent
            ? "accent-text"
            : ""
        }
      >
        {value}
      </strong>
    </div>
  );
}

export default function TrackInspector({
  track,
  details,
  loading,
  resetting = false,
  onResetAnalysis,
  onClose,
}) {
  const {
    t,
    domainLabel,
    formatBpm,
    formatReason,
  } = useLanguage();

  if (!track) {
    return null;
  }

  const bpm = (
    value
  ) =>
    formatBpm(
      value,
      2,
      t(
        "Not available"
      )
    );

  return (
    <aside className="inspector">
      <div className="inspector-header">
        <div>
          <span className="eyebrow">
            {t(
              "Track inspector"
            )}
          </span>
          <h2>{track.filename}</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onClose}
          aria-label={t(
            "Close inspector"
          )}
        >
          <svg
            className="icon-button-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="inspector-section">
        <Detail
          label={t(
            "Existing tag"
          )}
          value={bpm(
            track.metadata
              ?.existingBpm
          )}
        />
        <Detail
          label={t(
            "Detected"
          )}
          value={bpm(
            track.tempo
              ?.detectedBpm
          )}
        />
        <Detail
          label={t(
            "Suggested"
          )}
          value={bpm(
            track.tempo
              ?.suggestedBpm
          )}
          accent
        />
        <Detail
          label={t(
            "Relationship"
          )}
          value={
            track.tempo
              ?.relationship
              ? domainLabel(
                  "relationship",
                  track.tempo
                    .relationship
                )
              : "—"
          }
        />
      </div>

      <div className="inspector-section">
        <span className="section-label">
          {t(
            "Interpretation"
          )}
        </span>
        <p className="reason-text">
          {track.tempo?.reason
            ? formatReason(
                track.tempo
                  ?.reasonCode,
                track.tempo
                  ?.reasonParams,
                track.tempo
                  ?.reason
              )
            : t(
                "Analyze this track to see the interpretation rationale."
              )}
        </p>
      </div>

      {track.review?.required && (
        <div className="review-callout">
          <span className="section-label">
            {t(
              "Human review needed"
            )}
          </span>
          <p>
            {t(
              "SwingSync found a musically plausible alternate metrical level. Open Review to approve the detected BPM, the suggested interpretation, a custom BPM, or skip this track."
            )}
          </p>
        </div>
      )}

      <div className="inspector-section">
        <span className="section-label">
          {t(
            "Analysis details"
          )}
        </span>

        {loading ? (
          <p className="muted">
            {t(
              "Loading diagnostics…"
            )}
          </p>
        ) : details ? (
          <div className="diagnostics-grid">
            <Detail
              label={t(
                "Rhythm"
              )}
              value={bpm(
                details.analysis
                  ?.rhythm?.bpm
              )}
            />
            <Detail
              label={t(
                "Percival"
              )}
              value={bpm(
                details.analysis
                  ?.percival?.bpm
              )}
            />
            <Detail
              label={t(
                "Beat median"
              )}
              value={bpm(
                details.analysis
                  ?.beats?.medianBpm
              )}
            />
            <Detail
              label={t(
                "Source"
              )}
              value={
                track.analysisSource
                  ? domainLabel(
                      "analysisSource",
                      track.analysisSource
                    )
                  : "—"
              }
            />
          </div>
        ) : (
          <p className="muted">
            {t(
              "No analysis details yet."
            )}
          </p>
        )}
      </div>

      <div className="inspector-section inspector-reset-section">
        <div>
          <span className="section-label">
            {t(
              "Reset analysis"
            )}
          </span>
          <p className="muted">
            {t(
              "Send this track back to Pending and discard its current analysis, review, and Apply state. This does not undo file changes already written."
            )}
          </p>
        </div>
        <button
          type="button"
          className="button secondary-button"
          disabled={
            resetting ||
            track.status ===
              "pending" ||
            track.status ===
              "analyzing"
          }
          onClick={
            onResetAnalysis
          }
        >
          {resetting
            ? t(
                "Resetting…"
              )
            : t(
                "Reset to pending"
              )}
        </button>
      </div>
    </aside>
  );
}

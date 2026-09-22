function bpm(value) {
  return Number.isFinite(value)
    ? `${value.toFixed(2)} BPM`
    : "Not available";
}

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
  onClose,
}) {
  if (!track) {
    return null;
  }

  return (
    <aside className="inspector">
      <div className="inspector-header">
        <div>
          <span className="eyebrow">
            Track inspector
          </span>
          <h2>{track.filename}</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onClose}
          aria-label="Close inspector"
        >
          ×
        </button>
      </div>

      <div className="inspector-section">
        <Detail
          label="Existing tag"
          value={bpm(
            track.metadata
              ?.existingBpm
          )}
        />
        <Detail
          label="Detected"
          value={bpm(
            track.tempo
              ?.detectedBpm
          )}
        />
        <Detail
          label="Suggested"
          value={bpm(
            track.tempo
              ?.suggestedBpm
          )}
          accent
        />
        <Detail
          label="Relationship"
          value={
            track.tempo
              ?.relationship ??
            "—"
          }
        />
      </div>

      <div className="inspector-section">
        <span className="section-label">
          Interpretation
        </span>
        <p className="reason-text">
          {track.tempo?.reason ??
            "Analyze this track to see the interpretation rationale."}
        </p>
      </div>

      {track.review?.required && (
        <div className="review-callout">
          <span className="section-label">
            Human review needed
          </span>
          <p>
            SwingSync found a musically plausible alternate metrical level. Open Review to approve the detected BPM, the suggested interpretation, a custom BPM, or skip this track.
          </p>
        </div>
      )}

      <div className="inspector-section">
        <span className="section-label">
          Analysis details
        </span>

        {loading ? (
          <p className="muted">
            Loading diagnostics…
          </p>
        ) : details ? (
          <div className="diagnostics-grid">
            <Detail
              label="Rhythm"
              value={bpm(
                details.analysis
                  ?.rhythm?.bpm
              )}
            />
            <Detail
              label="Percival"
              value={bpm(
                details.analysis
                  ?.percival?.bpm
              )}
            />
            <Detail
              label="Beat median"
              value={bpm(
                details.analysis
                  ?.beats?.medianBpm
              )}
            />
            <Detail
              label="Source"
              value={
                track.analysisSource ??
                "—"
              }
            />
          </div>
        ) : (
          <p className="muted">
            No analysis details yet.
          </p>
        )}
      </div>
    </aside>
  );
}

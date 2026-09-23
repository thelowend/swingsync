import StatusPill from
  "./StatusPill.jsx";

import {
  useLanguage,
} from "../i18n/LanguageContext.jsx";

function Confidence({
  value,
}) {
  const {
    domainLabel,
  } = useLanguage();

  if (!value) {
    return (
      <span className="muted">
        —
      </span>
    );
  }

  return (
    <span
      className={`confidence confidence-${value}`}
    >
      {domainLabel(
        "confidence",
        value
      )}
    </span>
  );
}

export default function LibraryTable({
  tracks,
  selectedTrackId,
  onSelectTrack,
}) {
  const {
    t,
    formatNumber,
  } = useLanguage();

  function bpm(value) {
    return Number.isFinite(value)
      ? formatNumber(
          value,
          1
        )
      : "—";
  }

  if (tracks.length === 0) {
    return (
      <div className="empty-table">
        <div className="empty-icon">
          ♪
        </div>
        <strong>
          {t(
            "No tracks to show"
          )}
        </strong>
        <span>
          {t(
            "Choose folders and open the library to scan for music."
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="library-table">
        <thead>
          <tr>
            <th>
              {t("Track")}
            </th>
            <th>
              {t("Tag")}
            </th>
            <th>
              {t("Detected")}
            </th>
            <th>
              {t("Suggested")}
            </th>
            <th>
              {t(
                "Confidence"
              )}
            </th>
            <th>
              {t("Status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {tracks.map(
            (track) => (
              <tr
                key={track.id}
                className={
                  selectedTrackId ===
                  track.id
                    ? "is-selected"
                    : ""
                }
                onClick={() =>
                  onSelectTrack(
                    track.id
                  )
                }
              >
                <td>
                  <div className="track-cell">
                    <div className="track-title">
                      {track.filename}
                    </div>
                    <div className="track-path">
                      {track.relativePath}
                    </div>
                  </div>
                </td>
                <td className="numeric">
                  {bpm(
                    track.metadata
                      ?.existingBpm
                  )}
                </td>
                <td className="numeric">
                  {bpm(
                    track.tempo
                      ?.detectedBpm
                  )}
                </td>
                <td className="numeric suggested-bpm">
                  {bpm(
                    track.tempo
                      ?.suggestedBpm
                  )}
                </td>
                <td>
                  <Confidence
                    value={
                      track.tempo
                        ?.interpretationConfidence ??
                      track.tempo
                        ?.detectionConfidence
                    }
                  />
                </td>
                <td>
                  <StatusPill
                    track={track}
                  />
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

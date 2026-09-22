import StatusPill from
  "./StatusPill.jsx";

function bpm(value) {
  return Number.isFinite(value)
    ? value.toFixed(1)
    : "—";
}

function Confidence({ value }) {
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
      {value}
    </span>
  );
}

export default function LibraryTable({
  tracks,
  selectedTrackId,
  onSelectTrack,
}) {
  if (tracks.length === 0) {
    return (
      <div className="empty-table">
        <div className="empty-icon">
          ♪
        </div>
        <strong>
          No tracks to show
        </strong>
        <span>
          Choose folders and open the library to scan for music.
        </span>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="library-table">
        <thead>
          <tr>
            <th>Track</th>
            <th>Tag</th>
            <th>Detected</th>
            <th>Suggested</th>
            <th>Confidence</th>
            <th>Status</th>
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

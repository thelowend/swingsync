const LABELS = {
  pending: "Pending",
  analyzing: "Analyzing",
  analyzed: "Analyzed",
  error: "Error",
  review: "Review",
  ready: "Ready",
  applied: "Applied",
};

export default function StatusPill({
  track,
}) {
  let kind = track.status;

  if (
    track.output?.applied
  ) {
    kind = "applied";
  } else if (
    track.status ===
      "analyzed" &&
    track.review?.required
  ) {
    kind = "review";
  } else if (
    track.status ===
      "analyzed"
  ) {
    kind = "ready";
  }

  return (
    <span
      className={`status-pill status-${kind}`}
    >
      <span
        className="status-dot"
        aria-hidden="true"
      />
      {LABELS[kind] ?? kind}
    </span>
  );
}

import {
  useLanguage,
} from "../i18n/LanguageContext.jsx";

export default function StatusPill({
  track,
}) {
  const {
    domainLabel,
  } = useLanguage();

  let kind = track.status;

  if (
    track.output?.applied
  ) {
    kind = "applied";
  } else if (
    track.review?.skipped
  ) {
    kind = "skipped";
  } else if (
    Number.isFinite(
      track.review?.selectedBpm
    )
  ) {
    kind = "approved";
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
      {domainLabel(
        "status",
        kind
      )}
    </span>
  );
}

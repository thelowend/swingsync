import {
  useEffect,
  useMemo,
  useState,
} from "react";

function bpm(value) {
  return Number.isFinite(value)
    ? `${value.toFixed(1)} BPM`
    : "—";
}

function basename(file) {
  if (!file) {
    return "Unknown track";
  }

  return file.split(/[\\/]/).pop();
}

function ReviewQueueItem({
  item,
  selected,
  onSelect,
}) {
  const decision =
    item.review;

  const state =
    decision?.skipped
      ? "Skipped"
      : Number.isFinite(
          decision?.selectedBpm
        )
      ? `${decision.selectedBpm.toFixed(
          1
        )} BPM`
      : "Needs decision";

  return (
    <button
      type="button"
      className={`review-list-item ${
        selected
          ? "selected"
          : ""
      }`}
      onClick={onSelect}
    >
      <div className="review-list-main">
        <strong>
          {item.filename ??
            basename(item.file)}
        </strong>
        <span>
          {item.relationship ??
            "tempo review"}
        </span>
      </div>
      <span
        className={`review-list-state ${
          decision
            ? decision.skipped
              ? "skipped"
              : "done"
            : ""
        }`}
      >
        {state}
      </span>
    </button>
  );
}

function EvidenceGrid({
  evidence,
}) {
  if (
    !evidence?.breakdown
  ) {
    return null;
  }

  const labels = {
    candidateConsensus:
      "Candidate consensus",
    midpointOnsets:
      "Midpoint onsets",
    rhythmConfidence:
      "Rhythm confidence",
    histogramDominance:
      "Histogram dominance",
  };

  return (
    <div className="evidence-grid">
      {Object.entries(
        evidence.breakdown
      ).map(
        ([key, value]) => (
          <div
            className={`evidence-card ${
              value.passed
                ? "passed"
                : "failed"
            }`}
            key={key}
          >
            <span>
              {labels[key] ?? key}
            </span>
            <strong>
              {value.passed
                ? "Pass"
                : "No"}
            </strong>
            <small>
              {Number.isFinite(
                value.value
              )
                ? `${value.value.toFixed(
                    2
                  )} / ${value.threshold.toFixed(
                    2
                  )}`
                : "No signal"}
            </small>
          </div>
        )
      )}
    </div>
  );
}

export default function ReviewView({
  state,
  actions,
  onBack,
  onContinue,
}) {
  const [queue, setQueue] =
    useState([]);

  const [
    selectedTrackId,
    setSelectedTrackId,
  ] = useState(null);

  const [customBpm, setCustomBpm] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  async function refreshQueue(
    preferredTrackId = null
  ) {
    setLoading(true);

    try {
      const nextQueue =
        await actions.getReviewQueue();

      setQueue(nextQueue);

      const wanted =
        preferredTrackId &&
        nextQueue.some(
          (item) =>
            item.trackId ===
            preferredTrackId
        )
          ? preferredTrackId
          : selectedTrackId &&
            nextQueue.some(
              (item) =>
                item.trackId ===
                selectedTrackId
            )
          ? selectedTrackId
          : nextQueue.find(
              (item) =>
                !item.review
            )?.trackId ??
            nextQueue[0]
              ?.trackId ??
            null;

      setSelectedTrackId(
        wanted
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshQueue().catch(
      () => {}
    );
    // Queue is refreshed after each mutation below. The summary values
    // catch profile/library changes coming from outside this view.
  }, [
    state.summary.needsReview,
    state.library.profile,
  ]);

  const selected =
    queue.find(
      (item) =>
        item.trackId ===
        selectedTrackId
    ) ?? null;

  const currentIndex =
    selected
      ? queue.findIndex(
          (item) =>
            item.trackId ===
            selected.trackId
        )
      : -1;

  const unresolved =
    useMemo(
      () =>
        queue.filter(
          (item) =>
            !item.review
        ),
      [queue]
    );

  async function submit(
    action,
    value = null
  ) {
    if (!selected) {
      return;
    }

    setBusy(true);

    try {
      await actions.submitReview({
        trackId:
          selected.trackId,
        action,
        customBpm:
          value,
      });

      const updatedQueue =
        await actions.getReviewQueue();

      setQueue(updatedQueue);

      const updatedIndex =
        updatedQueue.findIndex(
          (item) =>
            item.trackId ===
            selected.trackId
        );

      const nextUnresolved =
        updatedQueue
          .slice(
            Math.max(
              updatedIndex + 1,
              0
            )
          )
          .find(
            (item) =>
              !item.review
          ) ??
        updatedQueue.find(
          (item) =>
            !item.review
        );

      if (nextUnresolved) {
        setSelectedTrackId(
          nextUnresolved.trackId
        );
      } else {
        setSelectedTrackId(
          selected.trackId
        );
      }

      setCustomBpm("");
    } finally {
      setBusy(false);
    }
  }

  async function clearDecision() {
    if (!selected) {
      return;
    }

    setBusy(true);

    try {
      await actions.clearReview(
        selected.trackId
      );

      await refreshQueue(
        selected.trackId
      );
    } finally {
      setBusy(false);
    }
  }

  const customValue =
    Number(
      customBpm
    );

  const customValid =
    Number.isFinite(
      customValue
    ) &&
    customValue >= 50 &&
    customValue <= 240;

  return (
    <section className="workflow-view">
      <div className="workflow-header">
        <div>
          <button
            type="button"
            className="text-button"
            onClick={onBack}
          >
            ← Library
          </button>
          <span className="eyebrow">
            Human review
          </span>
          <h1>
            Confirm the musical pulse.
          </h1>
          <p>
            These tracks need your judgment. Choosing a BPM only approves the decision—it does not modify the file yet.
          </p>
        </div>

        <div className="workflow-header-actions">
          <div className="workflow-stat">
            <strong>
              {state.summary.reviewRemaining ??
                unresolved.length}
            </strong>
            <span>
              remaining
            </span>
          </div>
          <div className="workflow-stat">
            <strong>
              {state.summary.reviewed}
            </strong>
            <span>
              approved
            </span>
          </div>
          <button
            type="button"
            className="button primary-button"
            onClick={onContinue}
            disabled={
              state.summary.readyToApply ===
              0
            }
          >
            Continue to Apply
          </button>
        </div>
      </div>

      {loading ? (
        <div className="workflow-empty">
          Loading review queue…
        </div>
      ) : queue.length === 0 ? (
        <div className="workflow-empty">
          <div className="empty-icon">
            ✓
          </div>
          <h2>
            Nothing needs review.
          </h2>
          <p>
            All analyzed tracks are either confidently interpreted or there is no reviewable result.
          </p>
          <button
            type="button"
            className="button primary-button"
            onClick={onContinue}
            disabled={
              state.summary.readyToApply ===
              0
            }
          >
            Review apply plan
          </button>
        </div>
      ) : (
        <div className="review-layout">
          <aside className="review-list">
            <div className="review-list-header">
              <strong>
                Review queue
              </strong>
              <span>
                {queue.length} track{queue.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="review-list-scroll">
              {queue.map(
                (item) => (
                  <ReviewQueueItem
                    key={
                      item.trackId
                    }
                    item={item}
                    selected={
                      item.trackId ===
                      selectedTrackId
                    }
                    onSelect={() => {
                      setSelectedTrackId(
                        item.trackId
                      );
                      setCustomBpm("");
                    }}
                  />
                )
              )}
            </div>
          </aside>

          {selected && (
            <article className="review-editor">
              <div className="review-editor-heading">
                <div>
                  <span className="eyebrow">
                    Track {currentIndex + 1} of {queue.length}
                  </span>
                  <h2>
                    {selected.filename ??
                      basename(
                        selected.file
                      )}
                  </h2>
                  <span className="path-copy">
                    {selected.relativePath ??
                      selected.file}
                  </span>
                </div>

                {selected.review && (
                  <div className="approved-badge">
                    {selected.review.skipped
                      ? "Skipped"
                      : `Approved ${selected.review.selectedBpm.toFixed(
                          1
                        )} BPM`}
                  </div>
                )}
              </div>

              <div className="review-tempo-grid">
                <button
                  type="button"
                  className={`tempo-choice ${
                    selected.review
                      ?.action ===
                    "use-detected"
                      ? "selected"
                      : ""
                  }`}
                  disabled={
                    busy ||
                    !Number.isFinite(
                      selected.detectedBpm
                    )
                  }
                  onClick={() =>
                    submit(
                      "use-detected"
                    )
                  }
                >
                  <span>
                    Acoustic detection
                  </span>
                  <strong>
                    {bpm(
                      selected.detectedBpm
                    )}
                  </strong>
                  <small>
                    Confidence: {selected.detectedConfidence ?? "—"}
                  </small>
                  <em>
                    Approve detected
                  </em>
                </button>

                <button
                  type="button"
                  className={`tempo-choice suggested ${
                    selected.review
                      ?.action ===
                    "use-suggested"
                      ? "selected"
                      : ""
                  }`}
                  disabled={
                    busy ||
                    !Number.isFinite(
                      selected.suggestedBpm
                    )
                  }
                  onClick={() =>
                    submit(
                      "use-suggested"
                    )
                  }
                >
                  <span>
                    SwingSync suggestion
                  </span>
                  <strong>
                    {bpm(
                      selected.suggestedBpm
                    )}
                  </strong>
                  <small>
                    {selected.relationship ??
                      "interpreted tempo"} · {selected.interpretationConfidence ?? "—"}
                  </small>
                  <em>
                    Approve suggested
                  </em>
                </button>
              </div>

              <div className="custom-review-row">
                <div>
                  <span className="section-label">
                    Custom BPM
                  </span>
                  <p>
                    Enter your own value if neither interpretation matches how you count the song.
                  </p>
                </div>
                <div className="custom-bpm-control">
                  <input
                    type="number"
                    min="50"
                    max="240"
                    step="0.1"
                    value={customBpm}
                    onChange={(event) =>
                      setCustomBpm(
                        event.target.value
                      )
                    }
                    placeholder="e.g. 178"
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="button secondary-button"
                    disabled={
                      busy ||
                      !customValid
                    }
                    onClick={() =>
                      submit(
                        "use-custom",
                        customValue
                      )
                    }
                  >
                    Approve custom
                  </button>
                </div>
              </div>

              <div className="review-explanation">
                <span className="section-label">
                  Why SwingSync asked
                </span>
                <p>
                  {selected.reason ??
                    "The acoustic and musical interpretations did not produce a sufficiently confident automatic decision."}
                </p>
              </div>

              {selected.doubleTimeEvidence && (
                <div className="review-evidence">
                  <div className="evidence-heading">
                    <div>
                      <span className="section-label">
                        Double-time evidence
                      </span>
                      <p>
                        Multi-signal score used by the genre profile.
                      </p>
                    </div>
                    <strong>
                      {selected.doubleTimeEvidence.totalScore.toFixed(
                        1
                      )}
                      /
                      {selected.doubleTimeEvidence.maximumScore.toFixed(
                        1
                      )}
                    </strong>
                  </div>

                  <EvidenceGrid
                    evidence={
                      selected.doubleTimeEvidence
                    }
                  />
                </div>
              )}

              {selected.candidates?.length > 0 && (
                <div className="candidate-strip">
                  <span className="section-label">
                    Acoustic candidates
                  </span>
                  <div>
                    {selected.candidates.map(
                      (
                        candidate,
                        index
                      ) => (
                        <span
                          className="candidate-chip"
                          key={`${candidate.kind}-${candidate.bpm}-${index}`}
                        >
                          {candidate.bpm.toFixed(
                            1
                          )} BPM
                          {Number.isFinite(
                            candidate.score
                          )
                            ? ` · ${candidate.score.toFixed(
                                2
                              )}`
                            : ""}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="review-footer">
                <button
                  type="button"
                  className="text-button danger-text"
                  disabled={busy}
                  onClick={() =>
                    submit("skip")
                  }
                >
                  Skip this track
                </button>

                {selected.review && (
                  <button
                    type="button"
                    className="text-button"
                    disabled={busy}
                    onClick={
                      clearDecision
                    }
                  >
                    Clear decision
                  </button>
                )}
              </div>
            </article>
          )}
        </div>
      )}
    </section>
  );
}

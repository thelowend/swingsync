import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLanguage,
} from "../i18n/LanguageContext.jsx";

import {
  addTempoTap,
  estimateTapTempoBpm,
} from "../utils/tapTempo.mjs";

function basename(file) {
  if (!file) {
    return null;
  }

  return file.split(/[\\/]/).pop();
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M8.25 5.25v13.5L19 12 8.25 5.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ReviewQueueItem({
  item,
  selected,
  onSelect,
}) {
  const {
    t,
    domainLabel,
    formatBpm,
  } = useLanguage();

  const decision =
    item.review;

  const state =
    decision?.skipped
      ? t("Skipped")
      : Number.isFinite(
          decision?.selectedBpm
        )
      ? formatBpm(
          decision.selectedBpm,
          1
        )
      : t(
          "Needs decision"
        );

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
            basename(item.file) ??
            t(
              "Unknown track"
            )}
        </strong>
        <span>
          {item.relationship
            ? domainLabel(
                "relationship",
                item.relationship
              )
            : t(
                "tempo review"
              )}
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
  const {
    t,
    formatNumber,
  } = useLanguage();

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
    sustainedMidpointPulse:
      "Sustained midpoint pulse",
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
              {t(
                labels[key] ??
                  key
              )}
            </span>
            <strong>
              {value.passed
                ? t("Pass")
                : t("No")}
            </strong>
            <small>
              {Number.isFinite(
                value.value
              )
                ? `${formatNumber(
                    value.value,
                    2
                  )} / ${formatNumber(
                    value.threshold,
                    2
                  )}`
                : t(
                    "No signal"
                  )}
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
  const {
    t,
    plural,
    domainLabel,
    formatBpm,
    formatReason,
  } = useLanguage();

  const [queue, setQueue] =
    useState([]);

  const [
    selectedTrackId,
    setSelectedTrackId,
  ] = useState(null);

  const [customBpm, setCustomBpm] =
    useState("");

  const tapTimesRef =
    useRef([]);

  const [tapBpm, setTapBpm] =
    useState(null);

  const [tapCount, setTapCount] =
    useState(0);

  const [busy, setBusy] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [
    bulkApproving,
    setBulkApproving,
  ] = useState(false);

  const [
    openingTrack,
    setOpeningTrack,
  ] = useState(false);

  const [
    continueApplyPulse,
    setContinueApplyPulse,
  ] = useState(0);

  const [
    continueWarningOpen,
    setContinueWarningOpen,
  ] = useState(false);

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

  const pendingToApply =
    state.summary.pendingToApply ??
    0;

  function pulseContinueToApply() {
    setContinueApplyPulse(
      (current) =>
        current + 1
    );
  }

  function requestContinueToApply() {
    if (
      unresolved.length > 0
    ) {
      setContinueWarningOpen(
        true
      );
      return;
    }

    onContinue();
  }

  function continueWithUnresolved() {
    setContinueWarningOpen(
      false
    );
    onContinue();
  }

  function resetTapTempo({
    clearCustom = false,
  } = {}) {
    tapTimesRef.current = [];
    setTapBpm(null);
    setTapCount(0);

    if (clearCustom) {
      setCustomBpm("");
    }
  }

  function registerTempoTap() {
    const currentTaps =
      tapTimesRef.current;

    const nextTaps =
      addTempoTap(
        currentTaps,
        performance.now()
      );

    if (
      nextTaps ===
      currentTaps
    ) {
      return;
    }

    tapTimesRef.current =
      nextTaps;

    setTapCount(
      nextTaps.length
    );

    const estimate =
      estimateTapTempoBpm(
        nextTaps
      );

    setTapBpm(
      estimate
    );

    if (
      Number.isFinite(
        estimate
      )
    ) {
      setCustomBpm(
        String(
          estimate
        )
      );
    } else if (
      nextTaps.length ===
      1
    ) {
      setCustomBpm("");
    }
  }

  useEffect(() => {
    resetTapTempo();
  }, [
    selectedTrackId,
  ]);

  async function openSelectedTrack() {
    if (
      !selected?.trackId ||
      openingTrack
    ) {
      return;
    }

    setOpeningTrack(
      true
    );

    try {
      await actions.openTrackExternal(
        selected.trackId
      );
    } finally {
      setOpeningTrack(
        false
      );
    }
  }

  async function submit(
    action,
    value = null
  ) {
    if (!selected) {
      return;
    }

    const wasReadyToApply =
      Number.isFinite(
        selected.review
          ?.selectedBpm
      ) &&
      !selected.review
        ?.skipped;

    const becomesReadyToApply =
      action !== "skip";

    const increasesPendingApply =
      becomesReadyToApply &&
      !wasReadyToApply;

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

      if (
        increasesPendingApply
      ) {
        pulseContinueToApply();
      }

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

  async function approveAllSuggestions() {
    if (
      bulkApproving ||
      unresolved.length === 0
    ) {
      return;
    }

    setBulkApproving(
      true
    );

    try {
      const result =
        await actions.approveAllSuggestions();

      const nextQueue =
        await actions.getReviewQueue();

      setQueue(
        nextQueue
      );

      if (
        result?.approved > 0
      ) {
        pulseContinueToApply();
      }

      const firstRemaining =
        nextQueue.find(
          (item) =>
            !item.review
        );

      if (
        firstRemaining
      ) {
        setSelectedTrackId(
          firstRemaining.trackId
        );
      } else if (
        selectedTrackId &&
        nextQueue.some(
          (item) =>
            item.trackId ===
            selectedTrackId
        )
      ) {
        setSelectedTrackId(
          selectedTrackId
        );
      } else {
        setSelectedTrackId(
          nextQueue[0]
            ?.trackId ??
          null
        );
      }

      setCustomBpm("");

      return result;
    } finally {
      setBulkApproving(
        false
      );
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
            {t(
              "← Library"
            )}
          </button>
          <span className="eyebrow">
            {t(
              "Human review"
            )}
          </span>
          <h1>
            {t(
              "Confirm the musical pulse"
            )}
          </h1>
          <p>
            {t(
              "These tracks need your judgment. Choosing a BPM only approves the decision—it does not modify the file yet."
            )}
          </p>
        </div>

        <div className="workflow-header-actions">
          <div className="workflow-stat">
            <strong>
              {state.summary.reviewRemaining ??
                unresolved.length}
            </strong>
            <span>
              {t(
                "remaining"
              )}
            </span>
          </div>
          <div className="workflow-stat">
            <strong>
              {state.summary.reviewed}
            </strong>
            <span>
              {t(
                "approved"
              )}
            </span>
          </div>
          <button
            type="button"
            className="button secondary-button bulk-approve-button"
            onClick={
              approveAllSuggestions
            }
            disabled={
              bulkApproving ||
              unresolved.length ===
                0
            }
            title={t(
              "Approve the suggested BPM for every unresolved review item. Existing manual decisions and skipped tracks are left unchanged."
            )}
          >
            {bulkApproving
              ? t(
                  "Approving suggestions…"
                )
              : t(
                  unresolved.length ===
                    1
                    ? "Approve suggestion"
                    : "Approve suggestions"
                )}
            {!bulkApproving &&
              unresolved.length >
                0 && (
                <span
                  className="workflow-action-count bulk-review-count"
                  aria-label={String(
                    unresolved.length
                  )}
                >
                  {unresolved.length}
                </span>
              )}
          </button>

          <button
            key={`continue-apply-${continueApplyPulse}`}
            type="button"
            className={`button primary-button review-continue-button ${
              continueApplyPulse > 0
                ? "apply-attention"
                : ""
            }`}
            onClick={
              requestContinueToApply
            }
            disabled={
              pendingToApply === 0
            }
          >
            {t(
              "Continue to Apply"
            )}
            {pendingToApply >
              0 && (
              <span
                className="workflow-action-count"
                aria-label={String(
                  pendingToApply
                )}
              >
                {pendingToApply}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="workflow-empty">
          {t(
            "Loading review queue…"
          )}
        </div>
      ) : queue.length === 0 ? (
        <div className="workflow-empty">
          <div className="empty-icon">
            ✓
          </div>
          <h2>
            {t(
              "Nothing needs review."
            )}
          </h2>
          <p>
            {t(
              "All analyzed tracks are either confidently interpreted or there is no reviewable result."
            )}
          </p>
          <button
            type="button"
            className="button primary-button"
            onClick={
              requestContinueToApply
            }
            disabled={
              pendingToApply === 0
            }
          >
            {t(
              "Review apply plan"
            )}
          </button>
        </div>
      ) : (
        <div className="review-layout">
          <aside className="review-list">
            <div className="review-list-header">
              <strong>
                {t(
                  "Review queue"
                )}
              </strong>
              <span>
                {plural(
                  "{count} track",
                  "{count} tracks",
                  queue.length
                )}
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
                    {t(
                      "Track {current} of {total}",
                      {
                        current:
                          currentIndex +
                          1,
                        total:
                          queue.length,
                      }
                    )}
                  </span>
                  <div className="review-title-row">
                    <h2>
                      {selected.filename ??
                        basename(
                          selected.file
                        ) ??
                        t(
                          "Unknown track"
                        )}
                    </h2>

                    <div className="review-play-control">
                      <button
                        type="button"
                        className="review-play-button"
                        onClick={
                          openSelectedTrack
                        }
                        disabled={
                          openingTrack
                        }
                        title={t(
                          "Play in default player"
                        )}
                        aria-label={t(
                          "Play track"
                        )}
                      >
                        <PlayIcon />
                      </button>
                      <span className="review-play-caption">
                        {t("Play")}
                      </span>
                    </div>
                  </div>
                  <span className="path-copy">
                    {selected.relativePath ??
                      selected.file}
                  </span>
                </div>

                {selected.review && (
                  <div className="approved-badge">
                    {selected.review.skipped
                      ? t(
                          "Skipped"
                        )
                      : t(
                          "Approved {bpm}",
                          {
                            bpm:
                              formatBpm(
                                selected.review
                                  .selectedBpm,
                                1
                              ),
                          }
                        )}
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
                    {t(
                      "Acoustic detection"
                    )}
                  </span>
                  <strong>
                    {formatBpm(
                      selected.detectedBpm,
                      1
                    )}
                  </strong>
                  <small>
                    {t(
                      "Confidence: {confidence}",
                      {
                        confidence:
                          selected.detectedConfidence
                            ? domainLabel(
                                "confidence",
                                selected.detectedConfidence
                              )
                            : "—",
                      }
                    )}
                  </small>
                  <em>
                    {t(
                      "Approve detected"
                    )}
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
                    {t(
                      "SwingSync suggestion"
                    )}
                  </span>
                  <strong>
                    {formatBpm(
                      selected.suggestedBpm,
                      1
                    )}
                  </strong>
                  <small>
                    {t(
                      "{relationship} · {confidence}",
                      {
                        relationship:
                          selected.relationship
                            ? domainLabel(
                                "relationship",
                                selected.relationship
                              )
                            : t(
                                "Interpretation"
                              ),
                        confidence:
                          selected.interpretationConfidence
                            ? domainLabel(
                                "confidence",
                                selected.interpretationConfidence
                              )
                            : "—",
                      }
                    )}
                  </small>
                  <em>
                    {t(
                      "Approve suggested"
                    )}
                  </em>
                </button>
              </div>

              <div className="tap-tempo-row">
                <div className="tap-tempo-copy">
                  <span className="section-label">
                    {t(
                      "Find BPM by tapping"
                    )}
                  </span>
                  <p>
                    {t(
                      "Play the track and tap this button once per beat. The estimate will fill Custom BPM automatically."
                    )}
                  </p>
                </div>

                <div className="tap-tempo-controls">
                  <button
                    type="button"
                    className="button secondary-button tap-tempo-button"
                    disabled={busy}
                    onClick={
                      registerTempoTap
                    }
                    title={t(
                      "Tap once on every beat"
                    )}
                  >
                    {t(
                      "Tap BPM"
                    )}
                  </button>

                  <div
                    className={`tap-tempo-readout ${
                      Number.isFinite(
                        tapBpm
                      )
                        ? "has-value"
                        : ""
                    }`}
                    aria-live="polite"
                  >
                    <strong>
                      {Number.isFinite(
                        tapBpm
                      )
                        ? tapBpm
                        : "—"}
                    </strong>
                    <span>BPM</span>
                    <small>
                      {tapCount === 0
                        ? t(
                            "Tap to start"
                          )
                        : plural(
                            "{count} tap",
                            "{count} taps",
                            tapCount
                          )}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="text-button tap-tempo-reset"
                    disabled={
                      busy ||
                      tapCount === 0
                    }
                    onClick={() =>
                      resetTapTempo({
                        clearCustom:
                          true,
                      })
                    }
                  >
                    {t(
                      "Reset taps"
                    )}
                  </button>
                </div>
              </div>

              <div className="custom-review-row">
                <div>
                  <span className="section-label">
                    {t(
                      "Custom BPM"
                    )}
                  </span>
                  <p>
                    {t(
                      "Enter your own value if neither interpretation matches how you count the song."
                    )}
                  </p>
                </div>
                <div className="custom-bpm-control">
                  <input
                    type="number"
                    min="50"
                    max="240"
                    step="1"
                    value={customBpm}
                    onChange={(event) =>
                      setCustomBpm(
                        event.target.value
                      )
                    }
                    placeholder="178"
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
                    {t(
                      "Approve custom"
                    )}
                  </button>
                </div>
              </div>

              <div className="review-explanation">
                <span className="section-label">
                  {t(
                    "Why SwingSync asked"
                  )}
                </span>
                <p>
                  {selected.reason
                    ? formatReason(
                        selected.reasonCode,
                        selected.reasonParams,
                        selected.reason
                      )
                    : t(
                        "The acoustic and musical interpretations did not produce a sufficiently confident automatic decision."
                      )}
                </p>
              </div>

              {selected.doubleTimeEvidence && (
                <div className="review-evidence">
                  <div className="evidence-heading">
                    <div>
                      <span className="section-label">
                        {t(
                          "Double-time evidence"
                        )}
                      </span>
                      <p>
                        {t(
                          "Multi-signal score used by the genre profile."
                        )}
                      </p>
                    </div>
                    <strong>
                      {`${selected.doubleTimeEvidence.totalScore.toFixed(
                        1
                      )}/${selected.doubleTimeEvidence.maximumScore.toFixed(
                        1
                      )}`}
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
                    {t(
                      "Acoustic candidates"
                    )}
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
                          {formatBpm(
                            candidate.bpm,
                            1
                          )}
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
                  className="button secondary-button skip-track-button"
                  disabled={busy}
                  onClick={() =>
                    submit("skip")
                  }
                >
                  {t(
                    "Skip this track"
                  )}
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
                    {t(
                      "Clear decision"
                    )}
                  </button>
                )}
              </div>
            </article>
          )}
        </div>
      )}

      {continueWarningOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() =>
            setContinueWarningOpen(
              false
            )
          }
        >
          <div
            className="confirm-modal review-warning-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-continue-warning-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <span className="eyebrow">
              {t(
                "Review incomplete"
              )}
            </span>

            <h2 id="review-continue-warning-title">
              {t(
                "Some tracks still need a decision"
              )}
            </h2>

            <p>
              {plural(
                "{count} track still needs a decision before Apply.",
                "{count} tracks still need a decision before Apply.",
                unresolved.length
              )}
            </p>

            <p className="muted">
              {t(
                "If you continue, unresolved tracks will be left out of this Apply pass. You can keep reviewing them now or continue with only the approved tracks."
              )}
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary-button"
                onClick={
                  continueWithUnresolved
                }
              >
                {t(
                  "Continue to Apply"
                )}
              </button>

              <button
                type="button"
                className="button primary-button"
                onClick={() =>
                  setContinueWarningOpen(
                    false
                  )
                }
              >
                {t(
                  "Keep reviewing"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

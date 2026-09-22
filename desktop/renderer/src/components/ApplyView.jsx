import {
  useEffect,
  useState,
} from "react";

function bpm(value) {
  return Number.isFinite(value)
    ? `${value.toFixed(1)} BPM`
    : "—";
}

function PlanStatus({
  item,
}) {
  const labels = {
    "will-change":
      "Will change",
    unchanged:
      "Already matches",
    unsupported:
      "Unsupported",
  };

  return (
    <span
      className={`plan-status plan-${item.status}`}
    >
      {labels[item.status] ??
        item.status}
    </span>
  );
}

export default function ApplyView({
  state,
  actions,
  onBack,
  onDone,
}) {
  const [plan, setPlan] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [applying, setApplying] =
    useState(false);

  const [confirming, setConfirming] =
    useState(false);

  const [lastResults, setLastResults] =
    useState(null);

  async function refreshPlan() {
    setLoading(true);

    try {
      const next =
        await actions.getApplyPlan();

      setPlan(next);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshPlan().catch(
      () => {}
    );
  }, [
    state.library.outputMode,
    state.summary.readyToApply,
    state.summary.outputApplied,
  ]);

  async function applyChanges() {
    setApplying(true);

    try {
      const results =
        await actions.applyAllApproved({
          applyChanges: true,
        });

      setLastResults(
        results
      );

      setConfirming(false);

      await refreshPlan();
    } finally {
      setApplying(false);
    }
  }

  const summary =
    plan?.summary ?? {
      total: 0,
      willChange: 0,
      unchanged: 0,
      unsupported: 0,
      humanApproved: 0,
      automaticApproved: 0,
      alreadyApplied: 0,
      unresolvedReview: 0,
      skippedReview: 0,
    };

  const isApplying =
    applying ||
    state.progress?.phase ===
      "output";

  const completed =
    state.progress?.phase ===
      "output"
      ? state.progress.completed +
        state.progress.failed
      : 0;

  return (
    <section className="workflow-view">
      <div className="workflow-header">
        <div>
          <button
            type="button"
            className="text-button"
            onClick={onBack}
            disabled={isApplying}
          >
            ← Review
          </button>
          <span className="eyebrow">
            Apply summary
          </span>
          <h1>
            Commit the approved BPMs.
          </h1>
          <p>
            This is the write boundary. Nothing on this screen changes your files until you explicitly confirm the final action.
          </p>
        </div>

        <div className="apply-mode-card">
          <span>
            Output mode
          </span>
          <strong>
            {state.library.outputMode}
          </strong>
          <small>
            {state.library.outputMode ===
            "metadata"
              ? "BPM tags only"
              : state.library.outputMode ===
                "filename"
              ? "Filename changes only"
              : "Metadata + filename"}
          </small>
        </div>
      </div>

      {lastResults && (
        <div className="success-banner">
          <div>
            <strong>
              Apply pass complete.
            </strong>
            <span>
              {
                lastResults.filter(
                  (item) =>
                    item.result
                      ?.applied
                ).length
              } applied · {
                lastResults.filter(
                  (item) =>
                    item.error
                ).length
              } errors
            </span>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={onDone}
          >
            Back to Library
          </button>
        </div>
      )}

      <div className="apply-summary-grid">
        <article className="summary-card">
          <span>
            Approved pending
          </span>
          <strong>
            {summary.total}
          </strong>
          <small>
            {summary.humanApproved} human · {summary.automaticApproved} automatic
          </small>
        </article>

        <article className="summary-card">
          <span>
            Will change
          </span>
          <strong>
            {summary.willChange}
          </strong>
          <small>
            Files with a real output change
          </small>
        </article>

        <article className="summary-card">
          <span>
            Already matches
          </span>
          <strong>
            {summary.unchanged}
          </strong>
          <small>
            No tag/filename rewrite needed
          </small>
        </article>

        <article className="summary-card">
          <span>
            Unsupported
          </span>
          <strong>
            {summary.unsupported}
          </strong>
          <small>
            Cannot use selected output mode
          </small>
        </article>
      </div>

      {summary.unresolvedReview > 0 && (
        <div className="warning-banner">
          <strong>
            {summary.unresolvedReview} review item{summary.unresolvedReview === 1 ? "" : "s"} still unresolved.
          </strong>
          <span>
            They will not be written. You can go back to Review or apply only the approved tracks now.
          </span>
        </div>
      )}

      {loading ? (
        <div className="workflow-empty">
          Building apply plan…
        </div>
      ) : !plan ||
        plan.items.length === 0 ? (
        <div className="workflow-empty">
          <div className="empty-icon">
            ✓
          </div>
          <h2>
            No pending approved changes.
          </h2>
          <p>
            Everything approved has already been applied, or no analyzed tracks are currently eligible.
          </p>
          <button
            type="button"
            className="button secondary-button"
            onClick={onDone}
          >
            Return to Library
          </button>
        </div>
      ) : (
        <section className="apply-panel">
          <div className="apply-table-scroll">
            <table className="apply-table">
              <thead>
                <tr>
                  <th>Track</th>
                  <th>Approval</th>
                  <th>Existing tag</th>
                  <th>Approved BPM</th>
                  <th>Metadata</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {plan.items.map(
                  (item) => (
                    <tr
                      key={
                        item.trackId
                      }
                    >
                      <td>
                        <strong>
                          {item.filename}
                        </strong>
                        <span>
                          {item.relativePath}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`approval-source ${
                            item.approvalSource
                          }`}
                        >
                          {item.approvalSource ===
                          "human"
                            ? "Human"
                            : "Automatic"}
                        </span>
                      </td>
                      <td>
                        {bpm(
                          item.existingMetadataBpm
                        )}
                      </td>
                      <td className="accent-text">
                        {bpm(
                          item.selectedBpm
                        )}
                      </td>
                      <td>
                        {item.metadataStatus ===
                        "will-write"
                          ? `Write ${item.normalizedTargetBpm}`
                          : item.metadataStatus ===
                            "already-matches"
                          ? "Already matches"
                          : item.metadataStatus ===
                            "unsupported"
                          ? item.metadataSupportReason ??
                            "Unsupported"
                          : "Not requested"}
                      </td>
                      <td>
                        <PlanStatus
                          item={item}
                        />
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {isApplying && (
            <div className="apply-progress">
              <strong>
                Writing changes…
              </strong>
              <span>
                {completed} / {state.progress.total}
              </span>
            </div>
          )}

          <div className="apply-action-bar">
            <div>
              <strong>
                {summary.total} approved track{summary.total === 1 ? "" : "s"} pending
              </strong>
              <span>
                Metadata writes use FFmpeg stream copy; audio is not re-encoded.
              </span>
            </div>

            <button
              type="button"
              className="button primary-button"
              disabled={
                isApplying ||
                summary.total === 0
              }
              onClick={() =>
                setConfirming(true)
              }
            >
              Apply changes
            </button>
          </div>
        </section>
      )}

      {confirming && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            if (!isApplying) {
              setConfirming(false);
            }
          }}
        >
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-confirm-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <span className="eyebrow">
              Final confirmation
            </span>
            <h2 id="apply-confirm-title">
              Write approved BPM changes?
            </h2>
            <p>
              SwingSync will now modify {summary.total} approved file{summary.total === 1 ? "" : "s"} using the <strong>{state.library.outputMode}</strong> output mode.
            </p>

            <div className="confirm-summary">
              <div>
                <span>
                  Will change
                </span>
                <strong>
                  {summary.willChange}
                </strong>
              </div>
              <div>
                <span>
                  Already matches
                </span>
                <strong>
                  {summary.unchanged}
                </strong>
              </div>
              <div>
                <span>
                  Unsupported
                </span>
                <strong>
                  {summary.unsupported}
                </strong>
              </div>
            </div>

            <p className="muted">
              Review choices alone never write files. This confirmation is the point where SwingSync commits them.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary-button"
                disabled={isApplying}
                onClick={() =>
                  setConfirming(false)
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary-button"
                disabled={isApplying}
                onClick={
                  applyChanges
                }
              >
                {isApplying
                  ? "Applying…"
                  : "Confirm & write"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

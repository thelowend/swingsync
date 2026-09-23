import {
  useEffect,
  useState,
} from "react";

import {
  useLanguage,
} from "../i18n/LanguageContext.jsx";

function PlanStatus({
  item,
}) {
  const {
    t,
  } = useLanguage();

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
      {t(
        labels[item.status] ??
          item.status
      )}
    </span>
  );
}

export default function ApplyView({
  state,
  actions,
  onBack,
  onDone,
}) {
  const {
    t,
    plural,
    domainLabel,
    formatBpm,
    metadataSupportReason,
  } = useLanguage();

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

  const appliedCount =
    lastResults
      ? lastResults.filter(
          (item) =>
            item.result
              ?.applied
        ).length
      : 0;

  const errorCount =
    lastResults
      ? lastResults.filter(
          (item) =>
            item.error
        ).length
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
            {t(
              "← Review"
            )}
          </button>
          <span className="eyebrow">
            {t(
              "Apply summary"
            )}
          </span>
          <h1>
            {t(
              "Commit the approved BPMs."
            )}
          </h1>
          <p>
            {t(
              "This is the write boundary. Nothing on this screen changes your files until you explicitly confirm the final action."
            )}
          </p>
        </div>

        <div className="apply-mode-card">
          <span>
            {t(
              "Output mode"
            )}
          </span>
          <strong>
            {domainLabel(
              "outputMode",
              state.library.outputMode
            )}
          </strong>
          <small>
            {state.library.outputMode ===
            "metadata"
              ? t(
                  "BPM tags only"
                )
              : state.library.outputMode ===
                "filename"
              ? t(
                  "Filename changes only"
                )
              : t(
                  "Metadata + filename"
                )}
          </small>
        </div>
      </div>

      {lastResults && (
        <div className="success-banner">
          <div>
            <strong>
              {t(
                "Apply pass complete."
              )}
            </strong>
            <span>
              {t(
                "{applied} applied · {errors} errors",
                {
                  applied:
                    appliedCount,
                  errors:
                    errorCount,
                }
              )}
            </span>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={onDone}
          >
            {t(
              "Back to Library"
            )}
          </button>
        </div>
      )}

      <div className="apply-summary-grid">
        <article className="summary-card">
          <span>
            {t(
              "Approved pending"
            )}
          </span>
          <strong>
            {summary.total}
          </strong>
          <small>
            {t(
              "{human} human · {automatic} automatic",
              {
                human:
                  summary.humanApproved,
                automatic:
                  summary.automaticApproved,
              }
            )}
          </small>
        </article>

        <article className="summary-card">
          <span>
            {t(
              "Will change"
            )}
          </span>
          <strong>
            {summary.willChange}
          </strong>
          <small>
            {t(
              "Files with a real output change"
            )}
          </small>
        </article>

        <article className="summary-card">
          <span>
            {t(
              "Already matches"
            )}
          </span>
          <strong>
            {summary.unchanged}
          </strong>
          <small>
            {t(
              "No tag/filename rewrite needed"
            )}
          </small>
        </article>

        <article className="summary-card">
          <span>
            {t(
              "Unsupported"
            )}
          </span>
          <strong>
            {summary.unsupported}
          </strong>
          <small>
            {t(
              "Cannot use selected output mode"
            )}
          </small>
        </article>
      </div>

      {summary.unresolvedReview > 0 && (
        <div className="warning-banner">
          <strong>
            {plural(
              "{count} review item still unresolved.",
              "{count} review items still unresolved.",
              summary.unresolvedReview
            )}
          </strong>
          <span>
            {t(
              "They will not be written. You can go back to Review or apply only the approved tracks now."
            )}
          </span>
        </div>
      )}

      {loading ? (
        <div className="workflow-empty">
          {t(
            "Building apply plan…"
          )}
        </div>
      ) : !plan ||
        plan.items.length === 0 ? (
        <div className="workflow-empty">
          <div className="empty-icon">
            ✓
          </div>
          <h2>
            {t(
              "No pending approved changes."
            )}
          </h2>
          <p>
            {t(
              "Everything approved has already been applied, or no analyzed tracks are currently eligible."
            )}
          </p>
          <button
            type="button"
            className="button secondary-button"
            onClick={onDone}
          >
            {t(
              "Return to Library"
            )}
          </button>
        </div>
      ) : (
        <section className="apply-panel">
          <div className="apply-table-scroll">
            <table className="apply-table">
              <thead>
                <tr>
                  <th>
                    {t(
                      "Track"
                    )}
                  </th>
                  <th>
                    {t(
                      "Approval"
                    )}
                  </th>
                  <th>
                    {t(
                      "Existing tag"
                    )}
                  </th>
                  <th>
                    {t(
                      "Approved BPM"
                    )}
                  </th>
                  <th>
                    {t(
                      "Metadata"
                    )}
                  </th>
                  <th>
                    {t(
                      "Status"
                    )}
                  </th>
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
                          {domainLabel(
                            "approvalSource",
                            item.approvalSource
                          )}
                        </span>
                      </td>
                      <td>
                        {formatBpm(
                          item.existingMetadataBpm,
                          1
                        )}
                      </td>
                      <td className="accent-text">
                        {formatBpm(
                          item.selectedBpm,
                          1
                        )}
                      </td>
                      <td>
                        {item.metadataStatus ===
                        "will-write"
                          ? t(
                              "Write {bpm}",
                              {
                                bpm:
                                  item.normalizedTargetBpm,
                              }
                            )
                          : item.metadataStatus ===
                            "already-matches"
                          ? t(
                              "Already matches"
                            )
                          : item.metadataStatus ===
                            "unsupported"
                          ? metadataSupportReason(
                              item.file,
                              item.metadataSupportReason
                            )
                          : t(
                              "Not requested"
                            )}
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
                {t(
                  "Writing changes…"
                )}
              </strong>
              <span>
                {completed} / {state.progress.total}
              </span>
            </div>
          )}

          <div className="apply-action-bar">
            <div>
              <strong>
                {plural(
                  "{count} approved track pending",
                  "{count} approved tracks pending",
                  summary.total
                )}
              </strong>
              <span>
                {t(
                  "Metadata writes use FFmpeg stream copy; audio is not re-encoded."
                )}
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
              {t(
                "Apply changes"
              )}
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
              {t(
                "Final confirmation"
              )}
            </span>
            <h2 id="apply-confirm-title">
              {t(
                "Write approved BPM changes?"
              )}
            </h2>
            <p>
              {plural(
                "SwingSync will now modify {count} approved file using the {mode} output mode.",
                "SwingSync will now modify {count} approved files using the {mode} output mode.",
                summary.total,
                {
                  mode:
                    domainLabel(
                      "outputMode",
                      state.library
                        .outputMode
                    ),
                }
              )}
            </p>

            <div className="confirm-summary">
              <div>
                <span>
                  {t(
                    "Will change"
                  )}
                </span>
                <strong>
                  {summary.willChange}
                </strong>
              </div>
              <div>
                <span>
                  {t(
                    "Already matches"
                  )}
                </span>
                <strong>
                  {summary.unchanged}
                </strong>
              </div>
              <div>
                <span>
                  {t(
                    "Unsupported"
                  )}
                </span>
                <strong>
                  {summary.unsupported}
                </strong>
              </div>
            </div>

            <p className="muted">
              {t(
                "Review choices alone never write files. This confirmation is the point where SwingSync commits them."
              )}
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
                {t(
                  "Cancel"
                )}
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
                  ? t(
                      "Applying…"
                    )
                  : t(
                      "Confirm & write"
                    )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

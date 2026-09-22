import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSwingSync,
} from "./hooks/useSwingSync.js";

import LibraryTable from
  "./components/LibraryTable.jsx";

import TrackInspector from
  "./components/TrackInspector.jsx";

import ReviewView from
  "./components/ReviewView.jsx";

import ApplyView from
  "./components/ApplyView.jsx";

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M3.75 6.5h5l1.5 1.75h10v8.5a1.75 1.75 0 0 1-1.75 1.75h-13a1.75 1.75 0 0 1-1.75-1.75V6.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnalyzeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M4 15h2V9H4v6Zm4 4h2V5H8v14Zm4-7h2V3h-2v9Zm4 5h2V7h-2v10Zm4-4h2V9h-2v4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function formatProgress(
  progress
) {
  if (
    progress.phase !==
      "analysis" ||
    progress.total === 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      ((progress.completed +
        progress.failed) /
        progress.total) *
        100
    )
  );
}

export default function App() {
  const {
    state,
    capabilities,
    loading,
    actionError,
    selectedFolders,
    actions,
  } = useSwingSync();

  const [view, setView] =
    useState("library");

  const [profile, setProfile] =
    useState("boogie");

  const [outputMode, setOutputMode] =
    useState("metadata");

  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [
    selectedTrackId,
    setSelectedTrackId,
  ] = useState(null);

  const [
    trackDetails,
    setTrackDetails,
  ] = useState(null);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [busyAction, setBusyAction] =
    useState(null);

  useEffect(() => {
    if (
      state.library?.folders
        ?.length
    ) {
      actions.setSelectedFolders(
        state.library.folders
      );
    }

    if (
      state.library?.profile
    ) {
      setProfile(
        state.library.profile
      );
    }

    if (
      state.library?.outputMode
    ) {
      setOutputMode(
        state.library.outputMode
      );
    }
  }, [
    state.library?.folders,
    state.library?.profile,
    state.library?.outputMode,
    actions,
  ]);

  const openFolders =
    state.library?.folders ?? [];

  const selectedFoldersMatchOpenLibrary =
    openFolders.length > 0 &&
    openFolders.length ===
      selectedFolders.length &&
    openFolders.every(
      (folder, index) =>
        folder ===
        selectedFolders[index]
    );

  const isLibraryOpen =
    selectedFoldersMatchOpenLibrary;

  const isAnalyzing =
    state.status ===
      "analyzing" ||
    state.progress?.phase ===
      "analysis";

  const isApplying =
    state.status ===
      "applying" ||
    state.progress?.phase ===
      "output";

  const progressPercent =
    formatProgress(
      state.progress
    );

  const filteredTracks =
    useMemo(() => {
      const normalized =
        query.trim().toLowerCase();

      return state.tracks.filter(
        (track) => {
          if (
            normalized &&
            !`${track.filename} ${track.relativePath}`
              .toLowerCase()
              .includes(normalized)
          ) {
            return false;
          }

          if (
            filter === "review"
          ) {
            return Boolean(
              track.review
                ?.required
            );
          }

          if (
            filter === "ready"
          ) {
            return (
              track.status ===
                "analyzed" &&
              (
                !track.review
                  ?.required ||
                Number.isFinite(
                  track.review
                    ?.selectedBpm
                )
              ) &&
              !track.review
                ?.skipped
            );
          }

          if (
            filter === "errors"
          ) {
            return (
              track.status ===
              "error"
            );
          }

          return true;
        }
      );
    }, [
      state.tracks,
      query,
      filter,
    ]);

  const selectedTrack =
    state.tracks.find(
      (track) =>
        track.id ===
        selectedTrackId
    ) ?? null;

  async function runBusy(
    name,
    operation
  ) {
    setBusyAction(name);

    try {
      await operation();
    } catch {
      // useSwingSync surfaces the error.
    } finally {
      setBusyAction(null);
    }
  }

  async function chooseFolders() {
    await actions.chooseFolders();
  }

  async function openLibrary() {
    setView("library");
    setSelectedTrackId(null);

    await runBusy(
      "open",
      () =>
        actions.openLibrary({
          folders:
            selectedFolders,
          profile,
          outputMode,
        })
    );
  }

  async function analyzeAll() {
    await runBusy(
      "analyze",
      () =>
        actions.analyzeAll()
    );
  }

  async function changeProfile(
    nextProfile
  ) {
    setProfile(nextProfile);

    if (!isLibraryOpen) {
      return;
    }

    await runBusy(
      "profile",
      () =>
        actions.setProfile(
          nextProfile
        )
    );
  }

  async function changeOutputMode(
    nextMode
  ) {
    setOutputMode(nextMode);

    if (!isLibraryOpen) {
      return;
    }

    await runBusy(
      "output",
      () =>
        actions.setOutputMode(
          nextMode
        )
    );
  }

  async function selectTrack(
    trackId
  ) {
    setSelectedTrackId(
      trackId
    );
    setTrackDetails(null);
    setDetailsLoading(true);

    try {
      const details =
        await actions.getTrackDetails(
          trackId
        );

      setTrackDetails(
        details
      );
    } catch {
      setTrackDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  function goToReview() {
    setSelectedTrackId(null);
    setTrackDetails(null);
    setView("review");
  }

  function goToApply() {
    setSelectedTrackId(null);
    setTrackDetails(null);
    setView("apply");
  }

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="brand-mark large">
          SS
        </div>
        <div>
          <h1>SwingSync</h1>
          <p>
            Starting the music library engine…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">
            SS
          </div>
          <div>
            <div className="brand-name">
              SwingSync
            </div>
            <div className="brand-tagline">
              Tempo intelligence for swing music
            </div>
          </div>
        </div>

        <nav
          className="app-navigation"
          aria-label="Workflow"
        >
          <button
            type="button"
            className={
              view === "library"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("library")
            }
          >
            Library
          </button>

          <button
            type="button"
            className={
              view === "review"
                ? "active"
                : ""
            }
            disabled={
              state.summary.needsReview ===
              0
            }
            onClick={goToReview}
          >
            Review
            {state.summary.reviewRemaining >
              0 && (
              <span>
                {
                  state.summary
                    .reviewRemaining
                }
              </span>
            )}
          </button>

          <button
            type="button"
            className={
              view === "apply"
                ? "active"
                : ""
            }
            disabled={
              state.summary.readyToApply ===
                0 &&
              state.summary.outputApplied ===
                0
            }
            onClick={goToApply}
          >
            Apply
            {state.summary.readyToApply >
              0 && (
              <span>
                {
                  state.summary
                    .readyToApply -
                  state.summary
                    .outputApplied
                }
              </span>
            )}
          </button>
        </nav>

        <div className="topbar-controls">
          <label className="compact-field">
            <span>Profile</span>
            <select
              value={profile}
              onChange={(event) =>
                changeProfile(
                  event.target.value
                )
              }
              disabled={
                isAnalyzing ||
                isApplying ||
                busyAction ===
                  "profile"
              }
            >
              {(capabilities?.profiles ?? []).map(
                (item) => (
                  <option
                    key={item.name}
                    value={item.name}
                  >
                    {item.name[0].toUpperCase() +
                      item.name.slice(1)}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="compact-field">
            <span>Output</span>
            <select
              value={outputMode}
              onChange={(event) =>
                changeOutputMode(
                  event.target.value
                )
              }
              disabled={
                isAnalyzing ||
                isApplying
              }
            >
              {(capabilities?.outputModes ?? []).map(
                (mode) => (
                  <option
                    key={mode}
                    value={mode}
                  >
                    {mode[0].toUpperCase() +
                      mode.slice(1)}
                  </option>
                )
              )}
            </select>
          </label>
        </div>
      </header>

      {actionError && (
        <div
          className="error-banner"
          role="alert"
        >
          <span>
            {actionError}
          </span>
          <button
            type="button"
            onClick={
              actions.clearError
            }
          >
            Dismiss
          </button>
        </div>
      )}

      {view === "review" ? (
        <ReviewView
          state={state}
          actions={actions}
          onBack={() =>
            setView("library")
          }
          onContinue={goToApply}
        />
      ) : view === "apply" ? (
        <ApplyView
          state={state}
          actions={actions}
          onBack={() =>
            state.summary.needsReview >
            0
              ? goToReview()
              : setView("library")
          }
          onDone={() =>
            setView("library")
          }
        />
      ) : (
        <section className="workspace">
          <div className="library-heading">
            <div>
              <span className="eyebrow">
                Music library
              </span>
              <h1>
                Find the right pulse.
              </h1>
              <p>
                Analyze your collection, review ambiguous musical interpretations, then explicitly commit approved BPM metadata.
              </p>
            </div>

            <div className="primary-actions">
              <button
                type="button"
                className="button secondary-button"
                onClick={
                  chooseFolders
                }
                disabled={
                  isAnalyzing ||
                  isApplying ||
                  busyAction !== null
                }
              >
                <FolderIcon />
                Choose folders
              </button>

              <button
                type="button"
                className="button secondary-button"
                onClick={
                  openLibrary
                }
                disabled={
                  selectedFolders.length ===
                    0 ||
                  isAnalyzing ||
                  isApplying ||
                  busyAction !== null
                }
              >
                Open library
              </button>

              <button
                type="button"
                className="button primary-button"
                onClick={
                  analyzeAll
                }
                disabled={
                  !isLibraryOpen ||
                  state.tracks.length ===
                    0 ||
                  isAnalyzing ||
                  isApplying ||
                  busyAction !== null
                }
              >
                <AnalyzeIcon />
                {isAnalyzing
                  ? "Analyzing…"
                  : "Analyze library"}
              </button>
            </div>
          </div>

          <div className="folder-strip">
            <div className="folder-strip-label">
              <FolderIcon />
              <span>
                {isLibraryOpen
                  ? "Open roots"
                  : openFolders.length >
                    0
                  ? "New selection"
                  : "Selected roots"}
              </span>
            </div>

            <div className="folder-chips">
              {(selectedFolders.length >
              0
                ? selectedFolders
                : [
                    "No folders selected",
                  ]
              ).map(
                (folder) => (
                  <span
                    className="folder-chip"
                    key={folder}
                    title={folder}
                  >
                    {folder}
                  </span>
                )
              )}
            </div>
          </div>

          {isAnalyzing && (
            <div className="progress-panel">
              <div className="progress-copy">
                <strong>
                  Analyzing library
                </strong>
                <span>
                  {state.progress.completed +
                    state.progress.failed}
                  {" / "}
                  {state.progress.total}
                  {state.progress.currentFile
                    ? ` · ${state.progress.currentFile
                        .split(
                          /[\\/]/
                        )
                        .pop()}`
                    : ""}
                </span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={
                  progressPercent
                }
              >
                <div
                  className="progress-value"
                  style={{
                    width:
                      `${progressPercent}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="summary-grid">
            <article className="summary-card">
              <span>
                Tracks
              </span>
              <strong>
                {state.summary.total}
              </strong>
              <small>
                Across {state.library?.folders?.length ?? 0} root{(state.library?.folders?.length ?? 0) === 1 ? "" : "s"}
              </small>
            </article>

            <article className="summary-card review-card">
              <span>
                Review remaining
              </span>
              <strong>
                {state.summary.reviewRemaining ??
                  state.summary.needsReview}
              </strong>
              <small>
                {state.summary.reviewed} approved · {state.summary.reviewSkipped} skipped
              </small>
            </article>

            <article className="summary-card">
              <span>
                Ready to apply
              </span>
              <strong>
                {Math.max(
                  0,
                  state.summary.readyToApply -
                    state.summary.outputApplied
                )}
              </strong>
              <small>
                Trusted or human-approved
              </small>
            </article>

            <article className="summary-card">
              <span>
                Applied
              </span>
              <strong>
                {state.summary.outputApplied}
              </strong>
              <small>
                File changes committed
              </small>
            </article>
          </div>

          {(state.summary.needsReview >
            0 ||
            state.summary.readyToApply >
              0) && (
            <div className="workflow-cta">
              <div>
                <strong>
                  Analysis complete?
                </strong>
                <span>
                  Review uncertain tracks, then inspect the exact write plan before committing anything.
                </span>
              </div>
              <div>
                {state.summary.needsReview >
                  0 && (
                  <button
                    type="button"
                    className="button secondary-button"
                    onClick={
                      goToReview
                    }
                  >
                    Review {
                      state.summary.reviewRemaining ??
                      state.summary.needsReview
                    } remaining
                  </button>
                )}
                {state.summary.readyToApply >
                  0 && (
                  <button
                    type="button"
                    className="button primary-button"
                    onClick={
                      goToApply
                    }
                  >
                    Review apply plan
                  </button>
                )}
              </div>
            </div>
          )}

          <section className="library-panel">
            <div className="library-toolbar">
              <div className="segmented-control">
                {[
                  [
                    "all",
                    "All",
                    state.summary.total,
                  ],
                  [
                    "review",
                    "Review",
                    state.summary.needsReview,
                  ],
                  [
                    "ready",
                    "Ready",
                    state.summary.readyToApply,
                  ],
                  [
                    "errors",
                    "Errors",
                    state.summary.errors,
                  ],
                ].map(
                  ([
                    value,
                    label,
                    count,
                  ]) => (
                    <button
                      key={value}
                      type="button"
                      className={
                        filter ===
                        value
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setFilter(
                          value
                        )
                      }
                    >
                      {label}
                      <span>
                        {count}
                      </span>
                    </button>
                  )
                )}
              </div>

              <label className="search-field">
                <span className="sr-only">
                  Search tracks
                </span>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="m16 16 4 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search tracks"
                />
              </label>
            </div>

            <LibraryTable
              tracks={filteredTracks}
              selectedTrackId={
                selectedTrackId
              }
              onSelectTrack={
                selectTrack
              }
            />
          </section>
        </section>
      )}

      <footer className="statusbar">
        <div>
          <span
            className={`connection-dot ${
              actionError
                ? "has-error"
                : ""
            }`}
          />
          Engine {actionError ? "needs attention" : isApplying ? "writing changes" : isAnalyzing ? "analyzing" : "ready"}
        </div>
        <div>
          SwingSync v0.14
        </div>
      </footer>

      {view === "library" && (
        <TrackInspector
          track={selectedTrack}
          details={trackDetails}
          loading={detailsLoading}
          onClose={() => {
            setSelectedTrackId(null);
            setTrackDetails(null);
          }}
        />
      )}
    </main>
  );
}

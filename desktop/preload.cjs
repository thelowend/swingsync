const {
  contextBridge,
  ipcRenderer,
} = require("electron");

const EVENT_CHANNEL =
  "swingsync:event";

const api = Object.freeze({
  bootstrap: () =>
    ipcRenderer.invoke(
      "swingsync:bootstrap"
    ),

  chooseMusicFolders: () =>
    ipcRenderer.invoke(
      "swingsync:choose-music-folders"
    ),

  openLibrary: (options) =>
    ipcRenderer.invoke(
      "swingsync:open-library",
      options
    ),

  analyzeAll: () =>
    ipcRenderer.invoke(
      "swingsync:analyze-all"
    ),

  analyzeOne: (trackId) =>
    ipcRenderer.invoke(
      "swingsync:analyze-one",
      trackId
    ),

  getTrackDetails: (trackId) =>
    ipcRenderer.invoke(
      "swingsync:get-track-details",
      trackId
    ),

  resetTrackAnalysis: (trackId) =>
    ipcRenderer.invoke(
      "swingsync:reset-track-analysis",
      trackId
    ),

  getReviewQueue: () =>
    ipcRenderer.invoke(
      "swingsync:get-review-queue"
    ),

  openTrackExternal: (trackId) =>
    ipcRenderer.invoke(
      "swingsync:open-track-external",
      trackId
    ),

  submitReview: (decision) =>
    ipcRenderer.invoke(
      "swingsync:submit-review",
      decision
    ),

  approveAllSuggestions: () =>
    ipcRenderer.invoke(
      "swingsync:approve-all-suggestions"
    ),

  clearReview: (trackId) =>
    ipcRenderer.invoke(
      "swingsync:clear-review",
      trackId
    ),

  setProfile: (profile) =>
    ipcRenderer.invoke(
      "swingsync:set-profile",
      profile
    ),

  setOutputMode: (outputMode) =>
    ipcRenderer.invoke(
      "swingsync:set-output-mode",
      outputMode
    ),

  getApplyPlan: () =>
    ipcRenderer.invoke(
      "swingsync:get-apply-plan"
    ),

  getBackupStatus: () =>
    ipcRenderer.invoke(
      "swingsync:get-backup-status"
    ),

  undoLastApply: () =>
    ipcRenderer.invoke(
      "swingsync:undo-last-apply"
    ),

  applyTrack: (
    trackId,
    options = {}
  ) =>
    ipcRenderer.invoke(
      "swingsync:apply-track",
      trackId,
      options
    ),

  applyAllApproved: (
    options = {}
  ) =>
    ipcRenderer.invoke(
      "swingsync:apply-all-approved",
      options
    ),

  subscribe: (listener) => {
    if (
      typeof listener !==
      "function"
    ) {
      throw new TypeError(
        "SwingSync event listener must be a function"
      );
    }

    const wrapped =
      (_event, message) => {
        listener(message);
      };

    ipcRenderer.on(
      EVENT_CHANNEL,
      wrapped
    );

    return () => {
      ipcRenderer.removeListener(
        EVENT_CHANNEL,
        wrapped
      );
    };
  },
});

contextBridge.exposeInMainWorld(
  "swingSync",
  api
);

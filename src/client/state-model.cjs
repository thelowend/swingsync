const path = require("node:path");

const APPLICATION_STATUS =
  Object.freeze({
    IDLE: "idle",
    LIBRARY_OPEN:
      "library-open",
    ANALYZING:
      "analyzing",
    READY: "ready",
    APPLYING:
      "applying",
    ERROR: "error",
    CLOSED: "closed",
  });

const TRACK_STATUS =
  Object.freeze({
    PENDING: "pending",
    ANALYZING:
      "analyzing",
    ANALYZED:
      "analyzed",
    ERROR: "error",
  });

function cloneSerializable(
  value
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value)
  );
}

function finiteOrNull(value) {
  return Number.isFinite(value)
    ? value
    : null;
}

function createInitialState({
  cache = null,
} = {}) {
  return {
    status:
      APPLICATION_STATUS.IDLE,

    library: {
      folders: [],
      // Backward-compatible alias for the first configured root.
      folder: null,
      profile: null,
      outputMode:
        "metadata",
    },

    progress: {
      phase: "idle",
      total: 0,
      completed: 0,
      failed: 0,
      currentTrackId: null,
      currentFile: null,
    },

    summary: {
      total: 0,
      pending: 0,
      analyzing: 0,
      analyzed: 0,
      errors: 0,
      needsReview: 0,
      reviewRemaining: 0,
      reviewed: 0,
      reviewSkipped: 0,
      readyToApply: 0,
      outputApplied: 0,
    },

    tracks: [],

    cache:
      cache ?? null,

    lastError: null,
  };
}

function createTrackState({
  id,
  file,
  folder,
}) {
  return {
    id,
    file,
    filename:
      path.basename(file),
    relativePath:
      folder
        ? path.relative(
            folder,
            file
          )
        : path.basename(file),

    status:
      TRACK_STATUS.PENDING,
    error: null,

    analysisSource: null,

    metadata: {
      existingBpm: null,
      readError: null,
      supported:
        null,
    },

    tempo: {
      detectedBpm: null,
      detectionConfidence:
        null,
      detectionScore: null,

      suggestedBpm: null,
      interpretationConfidence:
        null,

      adjusted: false,
      relationship: null,
      reason: null,
      reasonCode: null,
      reasonParams: null,
      autoApply: false,
    },

    review: {
      required: false,
      decision: null,
      selectedBpm: null,
      source: null,
      skipped: false,
    },

    output: {
      status: null,
      applied: false,
      mode: null,
      metadataWritten:
        null,
      metadataUnchanged:
        null,
      metadataReason:
        null,
      finalPath: file,
    },
  };
}

function projectTrackResult({
  trackState,
  trackResult,
  review = null,
  outputResult = null,
}) {
  const next = {
    ...trackState,

    file:
      trackResult.file,
    filename:
      path.basename(
        trackResult.file
      ),

    status:
      TRACK_STATUS.ANALYZED,
    error: null,

    analysisSource:
      trackResult.analysisSource,

    metadata: {
      existingBpm:
        finiteOrNull(
          trackResult
            .existingMetadataBpm
        ),
      readError:
        trackResult.metadata
          ?.readError ?? null,
      supported:
        outputResult
          ?.metadataSupport
          ?.supported ?? null,
    },

    tempo: {
      detectedBpm:
        finiteOrNull(
          trackResult.detection
            ?.bpm
        ),
      detectionConfidence:
        trackResult.detection
          ?.confidence ?? null,
      detectionScore:
        finiteOrNull(
          trackResult.detection
            ?.score
        ),

      suggestedBpm:
        finiteOrNull(
          trackResult
            .interpretation
            ?.bpm
        ),
      interpretationConfidence:
        trackResult
          .interpretation
          ?.confidence ?? null,

      adjusted:
        Boolean(
          trackResult
            .interpretation
            ?.adjusted
        ),
      relationship:
        trackResult
          .interpretation
          ?.relationship ?? null,
      reason:
        trackResult
          .interpretation
          ?.reason ?? null,
      reasonCode:
        trackResult
          .interpretation
          ?.reasonCode ?? null,
      reasonParams:
        trackResult
          .interpretation
          ?.reasonParams ?? null,
      autoApply:
        Boolean(
          trackResult
            .interpretation
            ?.autoApply
        ),
    },

    review: {
      required:
        Boolean(
          trackResult
            .needsReview
        ),
      decision:
        review?.action ?? null,
      selectedBpm:
        finiteOrNull(
          review?.selectedBpm
        ),
      source:
        review?.source ?? null,
      skipped:
        Boolean(
          review?.skipped
        ),
    },

    output: {
      status:
        outputResult?.status ??
        trackState.output
          ?.status ??
        null,
      applied:
        Boolean(
          outputResult?.applied ??
          trackState.output
            ?.applied
        ),
      mode:
        outputResult
          ?.outputMode ??
        trackState.output
          ?.mode ??
        null,
      metadataWritten:
        outputResult
          ?.metadataResult
          ?.written ??
        trackState.output
          ?.metadataWritten ??
        null,
      metadataUnchanged:
        outputResult
          ?.metadataResult
          ?.unchanged ??
        trackState.output
          ?.metadataUnchanged ??
        null,
      metadataReason:
        outputResult
          ?.metadataResult
          ?.reason ??
        trackState.output
          ?.metadataReason ??
        null,
      finalPath:
        outputResult
          ?.finalPath ??
        trackState.output
          ?.finalPath ??
        trackResult.file,
    },
  };

  return next;
}

function calculateSummary(
  tracks
) {
  const summary = {
    total: tracks.length,
    pending: 0,
    analyzing: 0,
    analyzed: 0,
    errors: 0,
    needsReview: 0,
    reviewRemaining: 0,
    reviewed: 0,
    reviewSkipped: 0,
    readyToApply: 0,
    outputApplied: 0,
  };

  for (
    const track of tracks
  ) {
    if (
      track.status ===
      TRACK_STATUS.PENDING
    ) {
      summary.pending++;
    } else if (
      track.status ===
      TRACK_STATUS.ANALYZING
    ) {
      summary.analyzing++;
    } else if (
      track.status ===
      TRACK_STATUS.ANALYZED
    ) {
      summary.analyzed++;
    } else if (
      track.status ===
      TRACK_STATUS.ERROR
    ) {
      summary.errors++;
    }

    if (
      track.review.required
    ) {
      summary.needsReview++;

      if (
        !track.review.decision
      ) {
        summary.reviewRemaining++;
      }
    }

    if (
      track.review.decision &&
      !track.review.skipped
    ) {
      summary.reviewed++;
    }

    if (
      track.review.skipped
    ) {
      summary.reviewSkipped++;
    }

    const autoReady =
      track.status ===
        TRACK_STATUS.ANALYZED &&
      !track.review.required &&
      track.tempo.autoApply &&
      Number.isFinite(
        track.tempo.suggestedBpm
      );

    const reviewedReady =
      track.status ===
        TRACK_STATUS.ANALYZED &&
      Number.isFinite(
        track.review.selectedBpm
      ) &&
      !track.review.skipped;

    if (
      autoReady ||
      reviewedReady
    ) {
      summary.readyToApply++;
    }

    if (
      track.output.applied
    ) {
      summary.outputApplied++;
    }
  }

  return summary;
}

module.exports = {
  APPLICATION_STATUS,
  TRACK_STATUS,
  cloneSerializable,
  createInitialState,
  createTrackState,
  projectTrackResult,
  calculateSummary,
};

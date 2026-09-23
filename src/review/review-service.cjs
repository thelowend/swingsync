const {
  MIN_BPM,
  MAX_BPM,
} = require("../config.cjs");

const REVIEW_ACTIONS = Object.freeze({
  USE_DETECTED: "use-detected",
  USE_SUGGESTED: "use-suggested",
  USE_CUSTOM: "use-custom",
  SKIP: "skip",
});

function finiteOrNull(value) {
  return Number.isFinite(value)
    ? value
    : null;
}

function isValidReviewBpm(value) {
  return (
    Number.isFinite(value) &&
    value >= MIN_BPM &&
    value <= MAX_BPM
  );
}

function dedupeCandidates(
  candidates,
  tolerance = 0.25
) {
  const result = [];

  for (const candidate of candidates) {
    if (
      !Number.isFinite(
        candidate.bpm
      )
    ) {
      continue;
    }

    const duplicate =
      result.some(
        (existing) =>
          Math.abs(
            existing.bpm -
            candidate.bpm
          ) <= tolerance
      );

    if (!duplicate) {
      result.push(candidate);
    }
  }

  return result;
}

function buildReviewCandidates(
  trackResult
) {
  const candidates = [];

  const detectedBpm =
    finiteOrNull(
      trackResult.detection?.bpm
    );

  const suggestedBpm =
    finiteOrNull(
      trackResult.interpretation?.bpm
    );

  if (detectedBpm !== null) {
    candidates.push({
      kind: "detected",
      bpm: detectedBpm,
      score:
        finiteOrNull(
          trackResult.detection
            ?.score
        ),
      label:
        "Acoustic detection",
    });
  }

  if (suggestedBpm !== null) {
    candidates.push({
      kind: "suggested",
      bpm: suggestedBpm,
      score:
        finiteOrNull(
          trackResult.interpretation
            ?.suggestedCandidateScore
        ),
      label:
        trackResult.interpretation
          ?.adjusted
          ? "Profile suggestion"
          : "Interpreted BPM",
    });
  }

  for (
    const candidate of
    trackResult.detection
      ?.candidates ?? []
  ) {
    candidates.push({
      kind: "alternative",
      bpm:
        finiteOrNull(
          candidate.bpm
        ),
      score:
        finiteOrNull(
          candidate.score
        ),
      label:
        "Acoustic alternative",
    });
  }

  return dedupeCandidates(
    candidates
  ).slice(0, 8);
}

function createReviewItem(
  trackResult
) {
  return {
    id: trackResult.file,
    file: trackResult.file,

    profile:
      trackResult.interpretation
        ?.profile ?? null,

    existingMetadataBpm:
      finiteOrNull(
        trackResult.existingMetadataBpm
      ),

    metadataReadError:
      trackResult.metadata
        ?.readError ?? null,

    detectedBpm:
      finiteOrNull(
        trackResult.detection?.bpm
      ),

    detectedConfidence:
      trackResult.detection
        ?.confidence ?? null,

    suggestedBpm:
      finiteOrNull(
        trackResult.interpretation
          ?.bpm
      ),

    interpretationConfidence:
      trackResult.interpretation
        ?.confidence ?? null,

    adjusted:
      Boolean(
        trackResult.interpretation
          ?.adjusted
      ),

    relationship:
      trackResult.interpretation
        ?.relationship ?? null,

    reason:
      trackResult.interpretation
        ?.reason ??
      trackResult.detection
        ?.reason ??
      null,

    reasonCode:
      trackResult.interpretation
        ?.reasonCode ??
      null,

    reasonParams:
      trackResult.interpretation
        ?.reasonParams ??
      null,

    doubleTimeEvidence:
      trackResult.interpretation
        ?.doubleTimeEvidence ??
      null,

    candidates:
      buildReviewCandidates(
        trackResult
      ),

    needsReview:
      Boolean(
        trackResult.needsReview
      ),
  };
}

function createReviewDecision({
  item,
  action,
  customBpm = null,
}) {
  if (
    !item ||
    typeof item.id !== "string"
  ) {
    throw new Error(
      "A valid review item is required"
    );
  }

  if (
    !Object.values(
      REVIEW_ACTIONS
    ).includes(action)
  ) {
    throw new Error(
      `Unknown review action: ${action}`
    );
  }

  if (
    action ===
    REVIEW_ACTIONS.SKIP
  ) {
    return {
      itemId: item.id,
      action,
      selectedBpm: null,
      source: null,
    };
  }

  if (
    action ===
    REVIEW_ACTIONS.USE_DETECTED
  ) {
    if (
      !isValidReviewBpm(
        item.detectedBpm
      )
    ) {
      throw new Error(
        "The detected BPM is not available"
      );
    }

    return {
      itemId: item.id,
      action,
      selectedBpm:
        item.detectedBpm,
      source: "detected",
    };
  }

  if (
    action ===
    REVIEW_ACTIONS.USE_SUGGESTED
  ) {
    if (
      !isValidReviewBpm(
        item.suggestedBpm
      )
    ) {
      throw new Error(
        "The suggested BPM is not available"
      );
    }

    return {
      itemId: item.id,
      action,
      selectedBpm:
        item.suggestedBpm,
      source: "suggested",
    };
  }

  if (
    !isValidReviewBpm(
      customBpm
    )
  ) {
    throw new Error(
      `Custom BPM must be between ${MIN_BPM} and ${MAX_BPM}`
    );
  }

  return {
    itemId: item.id,
    action,
    selectedBpm:
      customBpm,
    source: "custom",
  };
}

function applyReviewDecision(
  trackResult,
  decision
) {
  if (
    decision.itemId !==
    trackResult.file
  ) {
    throw new Error(
      "Review decision does not belong to this track"
    );
  }

  return {
    ...trackResult,
    review: {
      action:
        decision.action,
      selectedBpm:
        decision.selectedBpm,
      source:
        decision.source,
      accepted:
        Number.isFinite(
          decision.selectedBpm
        ),
      skipped:
        decision.action ===
        REVIEW_ACTIONS.SKIP,
    },
  };
}

module.exports = {
  REVIEW_ACTIONS,
  isValidReviewBpm,
  createReviewItem,
  createReviewDecision,
  applyReviewDecision,
};

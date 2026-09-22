const {
  TEMPO_MATCH_TOLERANCE,
} = require("../config.cjs");

const {
  differencePercent,
  approximatelyDouble,
  approximatelyThreeTwoLower,
} = require("../utils/stats.cjs");

function candidateHasDirectSupport(candidate) {
  return Boolean(
    candidate?.supporters?.some(
      (supporter) =>
        supporter.relationship === "same" &&
        differencePercent(
          supporter.rawBpm,
          candidate.bpm
        ) <= TEMPO_MATCH_TOLERANCE
    )
  );
}

function findSupportedThreeTwoCandidate(
  detection,
  profile
) {
  const config = profile.threeTwo;

  if (
    !config?.enabled ||
    !Number.isFinite(detection.bpm)
  ) {
    return null;
  }

  const candidates = detection.candidates
    .filter((candidate) => {
      if (
        !Number.isFinite(candidate.bpm) ||
        candidate.bpm >= detection.bpm
      ) {
        return false;
      }

      if (
        !approximatelyThreeTwoLower(
          candidate.bpm,
          detection.bpm
        )
      ) {
        return false;
      }

      if (
        candidate.bpm < config.preferredMinBpm ||
        candidate.bpm > config.preferredMaxBpm
      ) {
        return false;
      }

      if (candidate.score < config.minimumScore) {
        return false;
      }

      if (
        config.requireDirectSupport &&
        !candidateHasDirectSupport(candidate)
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => b.score - a.score);

  return candidates[0] ?? null;
}

function calculateHistogramDominance(analysis) {
  const first =
    analysis.histogram?.firstPeak?.weight;
  const second =
    analysis.histogram?.secondPeak?.weight;

  if (
    !Number.isFinite(first) ||
    !Number.isFinite(second) ||
    first < 0 ||
    second < 0
  ) {
    return null;
  }

  const total = first + second;

  if (total <= 0) {
    return null;
  }

  return first / total;
}

function findBestDoubleCandidate(
  detection,
  profile
) {
  const config = profile.doubleTime;

  if (
    !config?.enabled ||
    !Number.isFinite(detection.bpm)
  ) {
    return null;
  }

  return (
    detection.candidates
      .filter(
        (candidate) =>
          Number.isFinite(candidate.bpm) &&
          candidate.bpm > detection.bpm &&
          approximatelyDouble(
            candidate.bpm,
            detection.bpm
          ) &&
          candidate.bpm >=
            config.preferredMinBpm &&
          candidate.bpm <=
            config.preferredMaxBpm &&
          candidate.score >=
            config.minimumScore
      )
      .sort((a, b) => b.score - a.score)[0] ??
    null
  );
}

function evaluateDoubleTimeEvidence(
  analysis,
  candidate,
  profile
) {
  const config = profile.doubleTime;
  const points = config.evidencePoints;

  const midpointRatio =
    analysis.onsets?.midpointRatio;

  const rhythmConfidence =
    analysis.rhythm?.confidence;

  const histogramDominance =
    calculateHistogramDominance(
      analysis
    );

  const candidateConsensusPassed =
    Boolean(
      candidate &&
        candidate.score >=
          config.minimumScore
    );

  const midpointOnsetsPassed =
    Number.isFinite(midpointRatio) &&
    midpointRatio >=
      config.minimumMidpointOnsetRatio;

  const rhythmConfidencePassed =
    Number.isFinite(rhythmConfidence) &&
    rhythmConfidence >=
      config.minimumRhythmConfidence;

  const histogramDominancePassed =
    Number.isFinite(histogramDominance) &&
    histogramDominance >=
      config.minimumHistogramDominance;

  const breakdown = {
    candidateConsensus: {
      passed:
        candidateConsensusPassed,
      points:
        candidateConsensusPassed
          ? points.candidateConsensus
          : 0,
      maximum:
        points.candidateConsensus,
      value:
        candidate?.score ?? null,
      threshold:
        config.minimumScore,
    },

    midpointOnsets: {
      passed:
        midpointOnsetsPassed,
      points:
        midpointOnsetsPassed
          ? points.midpointOnsets
          : 0,
      maximum:
        points.midpointOnsets,
      value:
        midpointRatio,
      threshold:
        config.minimumMidpointOnsetRatio,
    },

    rhythmConfidence: {
      passed:
        rhythmConfidencePassed,
      points:
        rhythmConfidencePassed
          ? points.rhythmConfidence
          : 0,
      maximum:
        points.rhythmConfidence,
      value:
        rhythmConfidence,
      threshold:
        config.minimumRhythmConfidence,
    },

    histogramDominance: {
      passed:
        histogramDominancePassed,
      points:
        histogramDominancePassed
          ? points.histogramDominance
          : 0,
      maximum:
        points.histogramDominance,
      value:
        histogramDominance,
      threshold:
        config.minimumHistogramDominance,
    },
  };

  const totalScore =
    Object.values(breakdown).reduce(
      (sum, item) =>
        sum + item.points,
      0
    );

  const maximumScore =
    Object.values(breakdown).reduce(
      (sum, item) =>
        sum + item.maximum,
      0
    );

  return {
    totalScore,
    maximumScore,
    requiredScore:
      config.minimumEvidenceScore,
    passed:
      candidateConsensusPassed &&
      totalScore >=
        config.minimumEvidenceScore,

    candidateScore:
      candidate?.score ?? null,

    midpointRatio,
    rhythmConfidence,
    histogramDominance,

    breakdown,
  };
}

function getDoubleTimeDecision(
  detection,
  analysis,
  profile
) {
  const config = profile.doubleTime;

  if (
    !config?.enabled ||
    !Number.isFinite(detection.bpm)
  ) {
    return null;
  }

  const candidate =
    findBestDoubleCandidate(
      detection,
      profile
    );

  if (!candidate) {
    return null;
  }

  const evidence =
    evaluateDoubleTimeEvidence(
      analysis,
      candidate,
      profile
    );

  return {
    candidate,
    evidence,
    accepted: evidence.passed,
    evidenceMode:
      "multi-signal-double-time-classifier",
  };
}

function createUnadjustedInterpretation(
  detection,
  profile,
  reason,
  metadata = {}
) {
  return {
    profile: profile.name,
    bpm: detection.bpm,
    confidence: detection.confidence,
    adjusted: false,
    adjustment: null,
    relationship: "same",
    sourceBpm: detection.bpm,
    sourceScore: detection.score,
    suggestedCandidateScore: null,
    directSupport: null,
    autoApply: detection.autoApply,
    reason,
    ...metadata,
  };
}

function interpretTempo(
  detection,
  analysis,
  profile
) {
  if (!Number.isFinite(detection.bpm)) {
    return {
      profile: profile.name,
      bpm: null,
      confidence: "low",
      adjusted: false,
      adjustment: null,
      relationship: null,
      sourceBpm: null,
      sourceScore: 0,
      suggestedCandidateScore: null,
      directSupport: null,
      autoApply: false,
      reason:
        "No musical interpretation is possible because no usable BPM was detected",
    };
  }

  if (
    !profile.doubleTime?.enabled &&
    !profile.threeTwo?.enabled
  ) {
    return createUnadjustedInterpretation(
      detection,
      profile,
      "Generic profile preserves the detector's preferred metrical level"
    );
  }

  // First priority: a 3:2 lower-tempo interpretation.
  // This requires strong support and, for the current genre profiles,
  // at least one estimator that found the lower BPM directly.
  const threeTwoCandidate =
    findSupportedThreeTwoCandidate(
      detection,
      profile
    );

  if (threeTwoCandidate) {
    const directSupport =
      candidateHasDirectSupport(
        threeTwoCandidate
      );

    return {
      profile: profile.name,
      bpm: threeTwoCandidate.bpm,
      confidence: "medium",
      adjusted: true,
      adjustment: "prefer-three-two-lower",
      relationship: "3:2-triplet-feel",
      sourceBpm: detection.bpm,
      sourceScore: detection.score,
      suggestedCandidateScore:
        threeTwoCandidate.score,
      directSupport,
      autoApply: false,
      reason:
        `The ${profile.name} profile prefers the supported 3:2 lower-tempo interpretation ` +
        `${threeTwoCandidate.bpm.toFixed(2)} BPM over the detector's ${detection.bpm.toFixed(2)} BPM result. ` +
        `The candidate scored ${threeTwoCandidate.score.toFixed(2)}/${detection.maximumScore.toFixed(2)}` +
        (directSupport
          ? " and has direct acoustic-estimator support."
          : "."),
    };
  }

  // Second priority: half/double-time reinterpretation.
  //
  // Unlike earlier versions, there is NO automatic BPM zone.
  // Every double-time suggestion must pass a multi-signal classifier
  // combining:
  //
  //   - candidate consensus
  //   - midpoint-onset support
  //   - rhythm confidence
  //   - histogram dominance
  //
  // This is specifically meant to distinguish cases such as a genuinely
  // slow ~105 BPM song from a fast song whose tracker locks near half-time.
  const doubleDecision =
    getDoubleTimeDecision(
      detection,
      analysis,
      profile
    );

  if (
    doubleDecision &&
    doubleDecision.accepted
  ) {
    const doubleCandidate =
      doubleDecision.candidate;

    return {
      profile: profile.name,
      bpm: doubleCandidate.bpm,
      confidence: "medium",
      adjusted: true,
      adjustment: "prefer-double-time",
      relationship: "double-time",
      sourceBpm: detection.bpm,
      sourceScore: detection.score,
      suggestedCandidateScore:
        doubleCandidate.score,
      directSupport:
        candidateHasDirectSupport(
          doubleCandidate
        ),
      midpointOnsetRatio:
        doubleDecision.evidence
          .midpointRatio,
      evidenceMode:
        doubleDecision.evidenceMode,
      doubleTimeEvidence:
        doubleDecision.evidence,
      autoApply: false,
      reason:
        `The ${profile.name} profile prefers the double-time interpretation ` +
        `${doubleCandidate.bpm.toFixed(
          2
        )} BPM over the detector's ${detection.bpm.toFixed(
          2
        )} BPM result because its multi-signal evidence score was ` +
        `${doubleDecision.evidence.totalScore.toFixed(
          1
        )}/${doubleDecision.evidence.maximumScore.toFixed(
          1
        )}, meeting the required ${doubleDecision.evidence.requiredScore.toFixed(
          1
        )}.`,
    };
  }

  if (doubleDecision) {
    return createUnadjustedInterpretation(
      detection,
      profile,
      `The ${profile.name} profile kept the detector BPM because the double-time candidate ` +
        `${doubleDecision.candidate.bpm.toFixed(
          2
        )} BPM scored only ${doubleDecision.evidence.totalScore.toFixed(
          1
        )}/${doubleDecision.evidence.maximumScore.toFixed(
          1
        )} on the multi-signal evidence classifier, below the required ` +
        `${doubleDecision.evidence.requiredScore.toFixed(
          1
        )}.`,
      {
        suggestedCandidateScore:
          doubleDecision.candidate.score,
        evidenceMode:
          doubleDecision.evidenceMode,
        midpointOnsetRatio:
          doubleDecision.evidence
            .midpointRatio,
        doubleTimeEvidence:
          doubleDecision.evidence,
      }
    );
  }

  return createUnadjustedInterpretation(
    detection,
    profile,
    `The ${profile.name} profile found no sufficiently supported alternative metrical interpretation`
  );
}

module.exports = {
  interpretTempo,
};

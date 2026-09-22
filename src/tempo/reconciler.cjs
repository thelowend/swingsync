const {
  HYPOTHESIS_CLUSTER_TOLERANCE,
  SOURCE_WEIGHTS,
} = require("../config.cjs");

const {
  differencePercent,
} = require("../utils/stats.cjs");

const {
  buildTempoSources,
  buildTempoHypotheses,
  scoreHypothesis,
  calculateFinalBpm,
  areOctaveRelated,
} = require("./hypotheses.cjs");

function buildDetectionReason(
  best,
  second,
  confidence,
  octaveAmbiguous
) {
  if (octaveAmbiguous) {
    return (
      "Strong half/double-tempo ambiguity between the leading acoustic candidates"
    );
  }

  if (confidence === "high") {
    return `${best.supporters.length} acoustic tempo signals strongly agree`;
  }

  if (confidence === "medium") {
    return (
      "Most acoustic tempo signals agree, but the evidence is not conclusive"
    );
  }

  if (second) {
    return (
      "Acoustic tempo estimators disagree or multiple candidates are plausible"
    );
  }

  return "Insufficient acoustic tempo evidence";
}

function materializeCandidate(result) {
  return {
    bpm:
      calculateFinalBpm(result) ??
      result.hypothesis,
    hypothesis: result.hypothesis,
    score: result.score,
    supporters: result.supporters,
  };
}

function consolidateCandidates(results) {
  const materialized = results
    .map(materializeCandidate)
    .filter((candidate) => Number.isFinite(candidate.bpm))
    .sort((a, b) => b.score - a.score);

  const consolidated = [];

  for (const candidate of materialized) {
    const existing = consolidated.find(
      (item) =>
        differencePercent(item.bpm, candidate.bpm) <=
        HYPOTHESIS_CLUSTER_TOLERANCE
    );

    if (!existing) {
      consolidated.push({ ...candidate });
      continue;
    }

    // Keep only one representation of essentially the same tempo.
    // Prefer the stronger score; if tied, prefer the candidate with
    // more distinct supporting sources.
    const existingSources = new Set(
      existing.supporters.map((supporter) => supporter.source)
    ).size;
    const candidateSources = new Set(
      candidate.supporters.map((supporter) => supporter.source)
    ).size;

    if (
      candidate.score > existing.score ||
      (candidate.score === existing.score &&
        candidateSources > existingSources)
    ) {
      Object.assign(existing, candidate);
    }
  }

  return consolidated.sort((a, b) => b.score - a.score);
}

function reconcileTempo(analysis) {
  const sources = buildTempoSources(analysis);
  const hypotheses = buildTempoHypotheses(sources);

  const maximumScore = Object.values(
    SOURCE_WEIGHTS
  ).reduce((sum, weight) => sum + weight, 0);

  if (hypotheses.length === 0) {
    return {
      bpm: null,
      confidence: "low",
      autoApply: false,
      octaveAmbiguous: false,
      score: 0,
      maximumScore,
      supporters: [],
      candidates: [],
      alternatives: [],
      reason: "No usable acoustic tempo estimates",
    };
  }

  const rawResults = hypotheses.map((hypothesis) =>
    scoreHypothesis(hypothesis, sources)
  );

  // IMPORTANT: interpretation uses the complete, deduplicated list.
  // Console display can still show only a handful of alternatives.
  const candidates = consolidateCandidates(rawResults);

  const bestCandidate = candidates[0];
  const secondCandidate = candidates[1] ?? null;

  const coverage =
    maximumScore === 0
      ? 0
      : bestCandidate.score / maximumScore;

  const lead = secondCandidate
    ? (bestCandidate.score - secondCandidate.score) /
      maximumScore
    : coverage;

  const octaveAmbiguous = Boolean(
    secondCandidate &&
      areOctaveRelated(
        bestCandidate.bpm,
        secondCandidate.bpm
      ) &&
      Math.abs(
        bestCandidate.score - secondCandidate.score
      ) /
        maximumScore <
        0.1
  );

  let confidence;

  if (
    coverage >= 0.75 &&
    lead >= 0.15 &&
    !octaveAmbiguous &&
    bestCandidate.supporters.length >= 3
  ) {
    confidence = "high";
  } else if (
    coverage >= 0.55 &&
    lead >= 0.08 &&
    !octaveAmbiguous
  ) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  const alternatives = candidates.slice(1, 6);

  // buildDetectionReason expects a best/second object with supporters.
  const bestForReason = {
    supporters: bestCandidate.supporters,
  };

  const secondForReason = secondCandidate
    ? { supporters: secondCandidate.supporters }
    : null;

  return {
    bpm: bestCandidate.bpm,
    confidence,
    autoApply: confidence === "high",
    octaveAmbiguous,
    score: bestCandidate.score,
    maximumScore,
    supporters: bestCandidate.supporters,

    // Complete internal candidate list for interpretation logic.
    candidates,

    // Display-only shortlist.
    alternatives,

    reason: buildDetectionReason(
      bestForReason,
      secondForReason,
      confidence,
      octaveAmbiguous
    ),
  };
}

// ---------------------------------------------------------
// Musical interpretation
//
// This layer answers:
// "Given the selected genre/profile, which metrical level
// should a human-facing BPM label prefer?"
//
// The acoustic detection is kept intact and returned separately.
// ---------------------------------------------------------

module.exports = {
  reconcileTempo,
};

const {
  MIN_BPM,
  MAX_BPM,
  TEMPO_MATCH_TOLERANCE,
  HYPOTHESIS_CLUSTER_TOLERANCE,
  SOURCE_WEIGHTS,
} = require("../config.cjs");

const {
  differencePercent,
} = require("../utils/stats.cjs");

function tempoVariants(bpm) {
  if (!Number.isFinite(bpm) || bpm <= 0) {
    return [];
  }

  const variants = [
    {
      bpm,
      relationship: "same",
      penalty: 1,
    },
    {
      bpm: bpm * 2,
      relationship: "raw-is-half",
      penalty: 0.75,
    },
    {
      bpm: bpm / 2,
      relationship: "raw-is-double",
      penalty: 0.75,
    },
    {
      bpm: bpm * (2 / 3),
      relationship: "raw-is-three-two-upper",
      penalty: 0.75,
    },
    {
      bpm: bpm * (3 / 2),
      relationship: "raw-is-three-two-lower",
      penalty: 0.75,
    },
  ];

  return variants.filter(
    (variant) =>
      variant.bpm >= MIN_BPM &&
      variant.bpm <= MAX_BPM
  );
}

function buildTempoSources(analysis) {
  const sources = [];

  if (
    Number.isFinite(analysis.rhythm?.bpm) &&
    analysis.rhythm.bpm > 0
  ) {
    sources.push({
      name: "rhythm",
      weight: SOURCE_WEIGHTS.rhythm,
      values: [analysis.rhythm.bpm],
    });
  }

  if (
    Number.isFinite(analysis.percival?.bpm) &&
    analysis.percival.bpm > 0
  ) {
    sources.push({
      name: "percival",
      weight: SOURCE_WEIGHTS.percival,
      values: [analysis.percival.bpm],
    });
  }

  if (
    Number.isFinite(analysis.beats?.medianBpm) &&
    analysis.beats.medianBpm > 0
  ) {
    sources.push({
      name: "beats",
      weight: SOURCE_WEIGHTS.beats,
      values: [analysis.beats.medianBpm],
    });
  }

  const histogramValues = [];

  if (
    Number.isFinite(analysis.histogram?.firstPeak?.bpm) &&
    analysis.histogram.firstPeak.bpm > 0
  ) {
    histogramValues.push(
      analysis.histogram.firstPeak.bpm
    );
  }

  if (
    Number.isFinite(analysis.histogram?.secondPeak?.bpm) &&
    analysis.histogram.secondPeak.bpm > 0
  ) {
    histogramValues.push(
      analysis.histogram.secondPeak.bpm
    );
  }

  if (histogramValues.length > 0) {
    sources.push({
      name: "histogram",
      weight: SOURCE_WEIGHTS.histogram,

      // Both peaks are alternatives from ONE acoustic source,
      // not two independent votes.
      values: histogramValues,
    });
  }

  return sources;
}

function buildTempoHypotheses(sources) {
  const rawHypotheses = [];

  for (const source of sources) {
    for (const value of source.values) {
      for (const variant of tempoVariants(value)) {
        rawHypotheses.push(variant.bpm);
      }
    }
  }

  rawHypotheses.sort((a, b) => a - b);

  const clusters = [];

  for (const bpm of rawHypotheses) {
    let matchingCluster = null;

    for (const cluster of clusters) {
      if (
        differencePercent(bpm, cluster.average) <=
        HYPOTHESIS_CLUSTER_TOLERANCE
      ) {
        matchingCluster = cluster;
        break;
      }
    }

    if (matchingCluster) {
      matchingCluster.values.push(bpm);

      matchingCluster.average =
        matchingCluster.values.reduce(
          (sum, value) => sum + value,
          0
        ) / matchingCluster.values.length;
    } else {
      clusters.push({
        values: [bpm],
        average: bpm,
      });
    }
  }

  return clusters.map((cluster) => cluster.average);
}

function matchSourceToHypothesis(source, hypothesis) {
  let best = null;

  for (const rawBpm of source.values) {
    const variants = tempoVariants(rawBpm);

    for (const variant of variants) {
      const difference = differencePercent(
        variant.bpm,
        hypothesis
      );

      if (difference > TEMPO_MATCH_TOLERANCE) {
        continue;
      }

      const score =
        source.weight * variant.penalty;

      if (
        !best ||
        score > best.score ||
        (score === best.score &&
          difference < best.difference)
      ) {
        best = {
          source: source.name,
          rawBpm,
          matchedBpm: variant.bpm,
          relationship: variant.relationship,
          difference,
          score,
        };
      }
    }
  }

  return best;
}

function scoreHypothesis(hypothesis, sources) {
  const supporters = [];
  let score = 0;

  for (const source of sources) {
    const match = matchSourceToHypothesis(
      source,
      hypothesis
    );

    if (match) {
      supporters.push(match);
      score += match.score;
    }
  }

  return {
    hypothesis,
    score,
    supporters,
  };
}

function calculateFinalBpm(result) {
  if (!result || result.supporters.length === 0) {
    return null;
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const supporter of result.supporters) {
    weightedSum +=
      supporter.matchedBpm * supporter.score;

    totalWeight += supporter.score;
  }

  if (totalWeight === 0) {
    return null;
  }

  return weightedSum / totalWeight;
}

function areOctaveRelated(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return false;
  }

  return (
    differencePercent(a * 2, b) <=
      TEMPO_MATCH_TOLERANCE ||
    differencePercent(a / 2, b) <=
      TEMPO_MATCH_TOLERANCE
  );
}

module.exports = {
  buildTempoSources,
  buildTempoHypotheses,
  scoreHypothesis,
  calculateFinalBpm,
  areOctaveRelated,
};

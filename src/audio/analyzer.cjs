const esPkg = require("essentia.js");

const {
  SAMPLE_RATE,
  MIN_BPM,
  MAX_BPM,
} = require("../config.cjs");

const { median } = require("../utils/stats.cjs");
const {
  decodeAudio,
  pcmBufferToFloat32,
} = require("./decoder.cjs");

const essentia = new esPkg.Essentia(esPkg.EssentiaWASM);

function bpmFromBeatTicks(ticks) {
  if (!ticks || ticks.length < 3) {
    return null;
  }

  const bpms = [];

  for (let i = 1; i < ticks.length; i++) {
    const interval = ticks[i] - ticks[i - 1];

    if (interval <= 0) {
      continue;
    }

    const bpm = 60 / interval;

    if (bpm >= MIN_BPM && bpm <= MAX_BPM) {
      bpms.push(bpm);
    }
  }

  if (bpms.length === 0) {
    return null;
  }

  const medianBpm = median(bpms);

  const deviations = bpms.map((bpm) =>
    Math.abs(bpm - medianBpm)
  );

  const mad = median(deviations);

  return {
    bpm: medianBpm,
    samples: bpms.length,
    variationPercent:
      medianBpm === 0 ? 0 : (mad / medianBpm) * 100,
  };
}

// ---------------------------------------------------------
// Midpoint-onset evidence
// ---------------------------------------------------------

function calculateMidpointOnsetEvidence(ticks, onsets) {
  if (
    !Array.isArray(ticks) ||
    ticks.length < 3 ||
    !Array.isArray(onsets) ||
    onsets.length === 0
  ) {
    return {
      ratio: null,
      hits: 0,
      testedIntervals: 0,
      onsetCount: Array.isArray(onsets) ? onsets.length : 0,
    };
  }

  const sortedOnsets = [...onsets].sort((a, b) => a - b);

  let hits = 0;
  let testedIntervals = 0;
  let onsetIndex = 0;

  for (let i = 0; i < ticks.length - 1; i++) {
    const start = ticks[i];
    const end = ticks[i + 1];
    const interval = end - start;

    // Ignore obviously broken beat intervals.
    if (interval < 0.20 || interval > 1.50) {
      continue;
    }

    const midpoint = start + interval / 2;

    // Give the onset detector a modest timing window around the exact
    // midpoint. The window scales with beat length but is capped so
    // ordinary off-beat activity does not count too easily.
    const tolerance = Math.min(
      0.09,
      Math.max(0.04, interval * 0.15)
    );

    while (
      onsetIndex < sortedOnsets.length &&
      sortedOnsets[onsetIndex] < midpoint - tolerance
    ) {
      onsetIndex++;
    }

    testedIntervals++;

    const current = sortedOnsets[onsetIndex];
    const previous =
      onsetIndex > 0 ? sortedOnsets[onsetIndex - 1] : null;

    const currentHit =
      Number.isFinite(current) &&
      Math.abs(current - midpoint) <= tolerance;

    const previousHit =
      Number.isFinite(previous) &&
      Math.abs(previous - midpoint) <= tolerance;

    if (currentHit || previousHit) {
      hits++;
    }
  }

  return {
    ratio:
      testedIntervals > 0
        ? hits / testedIntervals
        : null,
    hits,
    testedIntervals,
    onsetCount: sortedOnsets.length,
  };
}

// ---------------------------------------------------------
// Essentia BPM analysis
// ---------------------------------------------------------

async function detectBPM(filePath) {
  const pcmBuffer = await decodeAudio(filePath);
  const samples = pcmBufferToFloat32(pcmBuffer);

  if (samples.length === 0) {
    throw new Error("Decoded audio contained no samples.");
  }

  const signal = essentia.arrayToVector(samples);

  let rhythmResult = null;
  let histogramResult = null;
  let onsetResult = null;

  try {
    rhythmResult = essentia.RhythmExtractor2013(
      signal,
      MAX_BPM,
      "multifeature",
      MIN_BPM
    );

    const percivalResult =
      essentia.PercivalBpmEstimator(
        signal,
        1024,
        2048,
        128,
        128,
        MAX_BPM,
        MIN_BPM,
        SAMPLE_RATE
      );

    histogramResult =
      essentia.BpmHistogramDescriptors(
        rhythmResult.bpmIntervals
      );

    // Essentia OnsetRate returns both onset density and detected onset
    // timestamps. OnsetRate requires 44.1 kHz audio, which our FFmpeg
    // decode stage already guarantees.
    onsetResult = essentia.OnsetRate(signal);

    const ticks = Array.from(
      essentia.vectorToArray(rhythmResult.ticks)
    );

    const estimates = Array.from(
      essentia.vectorToArray(rhythmResult.estimates)
    );

    const onsets = Array.from(
      essentia.vectorToArray(onsetResult.onsets)
    );

    const tickAnalysis = bpmFromBeatTicks(ticks);
    const midpointEvidence =
      calculateMidpointOnsetEvidence(ticks, onsets);

    return {
      rhythm: {
        bpm: rhythmResult.bpm,
        confidence: rhythmResult.confidence,
      },

      percival: {
        bpm: percivalResult.bpm,
      },

      beats: {
        count: ticks.length,
        medianBpm: tickAnalysis?.bpm ?? null,
        variationPercent:
          tickAnalysis?.variationPercent ?? null,
      },

      onsets: {
        count: onsets.length,
        rate: onsetResult.onsetRate,
        midpointHits: midpointEvidence.hits,
        midpointIntervals:
          midpointEvidence.testedIntervals,
        midpointRatio: midpointEvidence.ratio,
      },

      estimates: {
        count: estimates.length,
        median: median(estimates),
      },

      histogram: {
        firstPeak: {
          bpm: histogramResult.firstPeakBPM,
          weight: histogramResult.firstPeakWeight,
          spread: histogramResult.firstPeakSpread,
        },

        secondPeak: {
          bpm: histogramResult.secondPeakBPM,
          weight: histogramResult.secondPeakWeight,
          spread: histogramResult.secondPeakSpread,
        },
      },
    };
  } finally {
    onsetResult?.onsets?.delete?.();
    histogramResult?.histogram?.delete?.();

    rhythmResult?.ticks?.delete?.();
    rhythmResult?.estimates?.delete?.();
    rhythmResult?.bpmIntervals?.delete?.();

    signal?.delete?.();
  }
}

module.exports = {
  detectBPM,
};

const fs = require("node:fs/promises");
const path = require("node:path");

const {
  TEMPO_PROFILES,
  DEFAULT_PROFILE,
} = require("../tempo/profiles.cjs");

const { detectBPM } = require("../audio/analyzer.cjs");
const { reconcileTempo } = require("../tempo/reconciler.cjs");
const { interpretTempo } = require("../tempo/interpreter.cjs");
const {
  formatNumber,
  formatBpm,
} = require("./output.cjs");

const DEFAULT_BENCHMARK_ABSOLUTE_TOLERANCE = 2;
const DEFAULT_BENCHMARK_RELATIVE_TOLERANCE_PERCENT = 2;

function bpmError(expected, actual) {
  if (
    !Number.isFinite(expected) ||
    !Number.isFinite(actual) ||
    expected <= 0 ||
    actual <= 0
  ) {
    return {
      absolute: Infinity,
      percent: Infinity,
    };
  }

  return {
    absolute: Math.abs(actual - expected),
    percent:
      (Math.abs(actual - expected) / expected) * 100,
  };
}

function bpmMatches(
  expected,
  actual,
  absoluteTolerance,
  relativeTolerancePercent
) {
  const error = bpmError(expected, actual);

  return (
    error.absolute <= absoluteTolerance ||
    error.percent <= relativeTolerancePercent
  );
}

function classifyBenchmarkResult(
  expected,
  actual,
  absoluteTolerance,
  relativeTolerancePercent
) {
  if (!Number.isFinite(actual)) {
    return "no-result";
  }

  if (
    bpmMatches(
      expected,
      actual,
      absoluteTolerance,
      relativeTolerancePercent
    )
  ) {
    return "correct";
  }

  const relationships = [
    {
      label: "half-tempo",
      transformed: actual * 2,
    },
    {
      label: "double-tempo",
      transformed: actual / 2,
    },
    {
      label: "3:2-upper",
      transformed: actual * (2 / 3),
    },
    {
      label: "3:2-lower",
      transformed: actual * (3 / 2),
    },
  ];

  for (const relationship of relationships) {
    if (
      bpmMatches(
        expected,
        relationship.transformed,
        absoluteTolerance,
        relativeTolerancePercent
      )
    ) {
      return relationship.label;
    }
  }

  return "other";
}

function normalizeBenchmarkConfig(
  rawConfig,
  fallbackProfileName = DEFAULT_PROFILE
) {
  let defaults = {};
  let tracks;

  if (Array.isArray(rawConfig)) {
    tracks = rawConfig;
  } else if (
    rawConfig &&
    typeof rawConfig === "object" &&
    Array.isArray(rawConfig.tracks)
  ) {
    defaults = rawConfig.defaults ?? {};
    tracks = rawConfig.tracks;
  } else {
    throw new Error(
      "Benchmark JSON must be an array or an object containing a tracks array."
    );
  }

  if (tracks.length === 0) {
    throw new Error("Benchmark contains no tracks.");
  }

  const defaultProfile =
    normalizeProfileName(
      defaults.profile ??
      fallbackProfileName
    );

  if (!getTempoProfile(defaultProfile)) {
    throw new Error(
      `Unknown benchmark default profile \"${defaultProfile}\".`
    );
  }

  const absoluteTolerance = Number.isFinite(
    defaults.absoluteTolerance
  )
    ? defaults.absoluteTolerance
    : DEFAULT_BENCHMARK_ABSOLUTE_TOLERANCE;

  const relativeTolerancePercent = Number.isFinite(
    defaults.relativeTolerancePercent
  )
    ? defaults.relativeTolerancePercent
    : DEFAULT_BENCHMARK_RELATIVE_TOLERANCE_PERCENT;

  const normalizedTracks = tracks.map((track, index) => {
    if (!track || typeof track !== "object") {
      throw new Error(
        `Benchmark track ${index + 1} must be an object.`
      );
    }

    if (
      typeof track.file !== "string" ||
      track.file.trim() === ""
    ) {
      throw new Error(
        `Benchmark track ${index + 1} is missing a valid file field.`
      );
    }

    if (
      !Number.isFinite(track.expectedBpm) ||
      track.expectedBpm <= 0
    ) {
      throw new Error(
        `Benchmark track \"${track.file}\" is missing a positive expectedBpm.`
      );
    }

    const profileName =
      normalizeProfileName(
        track.profile ??
        defaultProfile
      );

    if (!getTempoProfile(profileName)) {
      throw new Error(
        `Unknown profile \"${profileName}\" for benchmark track \"${track.file}\".`
      );
    }

    return {
      file: track.file,
      expectedBpm: track.expectedBpm,
      profileName,
      absoluteTolerance: Number.isFinite(
        track.absoluteTolerance
      )
        ? track.absoluteTolerance
        : absoluteTolerance,
      relativeTolerancePercent: Number.isFinite(
        track.relativeTolerancePercent
      )
        ? track.relativeTolerancePercent
        : relativeTolerancePercent,
      notes:
        typeof track.notes === "string"
          ? track.notes
          : null,
    };
  });

  return {
    defaults: {
      profile: defaultProfile,
      absoluteTolerance,
      relativeTolerancePercent,
    },
    tracks: normalizedTracks,
  };
}

async function loadBenchmarkConfig(
  benchmarkPath,
  fallbackProfileName = DEFAULT_PROFILE
) {
  const contents = await fs.readFile(
    benchmarkPath,
    "utf8"
  );

  let parsed;

  try {
    parsed = JSON.parse(contents);
  } catch (error) {
    throw new Error(
      `Could not parse benchmark JSON: ${error.message}`
    );
  }

  return normalizeBenchmarkConfig(
    parsed,
    fallbackProfileName
  );
}

function incrementCounter(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function printBenchmarkRow(result, index, total) {
  const status =
    result.classification === "correct"
      ? "PASS"
      : "FAIL";

  console.log(
    `[${index + 1}/${total}] ${status.padEnd(4)} ` +
      `${result.track.file}`
  );

  if (result.error) {
    console.log(
      `       ERROR: ${result.error}`
    );
    return;
  }

  console.log(
    `       Expected:     ${formatBpm(
      result.track.expectedBpm
    )} BPM`
  );
  console.log(
    `       Detected:     ${formatBpm(
      result.detectedBpm
    )} BPM (${result.detectionConfidence.toUpperCase()})`
  );
  console.log(
    `       Interpreted:  ${formatBpm(
      result.actualBpm
    )} BPM (${result.interpretationConfidence.toUpperCase()})`
  );
  console.log(
    `       Profile:      ${result.track.profileName}`
  );
  console.log(
    `       Analysis:     ${
      result.analysisSource === "cache"
        ? "CACHE"
        : "COMPUTED"
    }`
  );
  console.log(
    `       Error:        ${formatNumber(
      result.absoluteError
    )} BPM / ${formatNumber(
      result.percentError
    )}%`
  );
  console.log(
    `       Classification: ${result.classification}`
  );

  if (result.interpretationAdjusted) {
    console.log(
      `       Adjustment:   ${result.adjustment}`
    );
  }

  if (result.doubleTimeEvidence) {
    console.log(
      `       Double evidence: ${result.doubleTimeEvidence.totalScore.toFixed(
        1
      )}/${result.doubleTimeEvidence.maximumScore.toFixed(
        1
      )} ` +
        `(required ${result.doubleTimeEvidence.requiredScore.toFixed(
          1
        )})`
    );

    console.log(
      `         Midpoint:   ${
        Number.isFinite(
          result.doubleTimeEvidence.midpointRatio
        )
          ? `${(
              result.doubleTimeEvidence.midpointRatio *
              100
            ).toFixed(1)}%`
          : "N/A"
      }`
    );

    console.log(
      `         Rhythm:     ${
        Number.isFinite(
          result.doubleTimeEvidence.rhythmConfidence
        )
          ? result.doubleTimeEvidence.rhythmConfidence.toFixed(
              3
            )
          : "N/A"
      }`
    );

    console.log(
      `         Histogram:  ${
        Number.isFinite(
          result.doubleTimeEvidence.histogramDominance
        )
          ? `${(
              result.doubleTimeEvidence.histogramDominance *
              100
            ).toFixed(1)}%`
          : "N/A"
      } dominance`
    );
  }

  if (result.track.notes) {
    console.log(
      `       Notes:        ${result.track.notes}`
    );
  }
}

function printBenchmarkSummary(results) {
  const completed = results.filter(
    (result) => !result.error
  );
  const errors = results.filter(
    (result) => result.error
  );
  const correct = completed.filter(
    (result) => result.classification === "correct"
  );

  const classificationCounts = new Map();
  const confidenceTotals = new Map();
  const confidenceCorrect = new Map();
  const profileTotals = new Map();
  const profileCorrect = new Map();

  for (const result of completed) {
    incrementCounter(
      classificationCounts,
      result.classification
    );

    incrementCounter(
      confidenceTotals,
      result.interpretationConfidence
    );

    incrementCounter(
      profileTotals,
      result.track.profileName
    );

    if (result.classification === "correct") {
      incrementCounter(
        confidenceCorrect,
        result.interpretationConfidence
      );
      incrementCounter(
        profileCorrect,
        result.track.profileName
      );
    }
  }

  const accuracy =
    completed.length > 0
      ? (correct.length / completed.length) * 100
      : 0;

  console.log();
  console.log(
    "=================================================="
  );
  console.log("BENCHMARK SUMMARY");
  console.log(
    "=================================================="
  );
  console.log(
    `Tracks configured:          ${results.length}`
  );
  console.log(
    `Completed:                  ${completed.length}`
  );
  console.log(
    `Errors/missing files:       ${errors.length}`
  );
  console.log(
    `Correct:                    ${correct.length}`
  );
  console.log(
    `Accuracy:                   ${accuracy.toFixed(1)}%`
  );

  const orderedClasses = [
    "half-tempo",
    "double-tempo",
    "3:2-upper",
    "3:2-lower",
    "other",
    "no-result",
  ];

  console.log();
  console.log("Failure modes:");

  let printedFailureMode = false;

  for (const classification of orderedClasses) {
    const count =
      classificationCounts.get(classification) ?? 0;

    if (count > 0) {
      printedFailureMode = true;
      console.log(
        `  ${classification.padEnd(18)} ${count}`
      );
    }
  }

  if (!printedFailureMode) {
    console.log("  none");
  }

  console.log();
  console.log("Accuracy by interpretation confidence:");

  for (const confidence of [
    "high",
    "medium",
    "low",
  ]) {
    const total = confidenceTotals.get(confidence) ?? 0;
    const passing = confidenceCorrect.get(confidence) ?? 0;

    if (total === 0) {
      continue;
    }

    console.log(
      `  ${confidence.toUpperCase().padEnd(8)} ` +
        `${passing}/${total} ` +
        `(${((passing / total) * 100).toFixed(1)}%)`
    );
  }

  console.log();
  console.log("Accuracy by profile:");

  for (const profileName of Object.keys(TEMPO_PROFILES)) {
    const total = profileTotals.get(profileName) ?? 0;
    const passing = profileCorrect.get(profileName) ?? 0;

    if (total === 0) {
      continue;
    }

    console.log(
      `  ${profileName.padEnd(8)} ` +
        `${passing}/${total} ` +
        `(${((passing / total) * 100).toFixed(1)}%)`
    );
  }

  console.log();
}

async function resolveBenchmarkTrackPath(
  folders,
  trackFile
) {
  if (
    path.isAbsolute(
      trackFile
    )
  ) {
    return path.resolve(
      trackFile
    );
  }

  const matches = [];

  for (
    const folder of folders
  ) {
    const candidate =
      path.resolve(
        folder,
        trackFile
      );

    try {
      const stats =
        await fs.stat(
          candidate
        );

      if (
        stats.isFile()
      ) {
        matches.push(
          candidate
        );
      }
    } catch (error) {
      if (
        error.code !== "ENOENT"
      ) {
        throw error;
      }
    }
  }

  if (
    matches.length === 0
  ) {
    throw new Error(
      `Could not find "${trackFile}" under any configured music folder`
    );
  }

  if (
    matches.length > 1
  ) {
    throw new Error(
      `Benchmark file "${trackFile}" is ambiguous across multiple music folders: ${matches.join(
        ", "
      )}`
    );
  }

  return matches[0];
}

async function runBenchmark(
  folders,
  benchmarkPath,
  fallbackProfileName = DEFAULT_PROFILE,
  cache
) {
  const config = await loadBenchmarkConfig(
    benchmarkPath,
    fallbackProfileName
  );

  console.log();
  console.log(
    "Benchmark music folders:"
  );

  for (
    const folder of folders
  ) {
    console.log(
      `  - ${folder}`
    );
  }

  console.log(
    `Benchmark file:   ${benchmarkPath}`
  );
  console.log(
    `Default profile:  ${config.defaults.profile}`
  );
  console.log(
    `Tolerance:        ±${config.defaults.absoluteTolerance} BPM OR ±${config.defaults.relativeTolerancePercent}%`
  );
  console.log();

  const results = [];

  for (
    let index = 0;
    index < config.tracks.length;
    index++
  ) {
    const track =
      config.tracks[index];

    let result;

    try {
      const filePath =
        await resolveBenchmarkTrackPath(
          folders,
          track.file
        );

      const analysisResult =
        await cache.getOrAnalyze(
          filePath,
          detectBPM
        );

      const analysis =
        analysisResult.analysis;

      const detection =
        reconcileTempo(analysis);
      const profile =
        getTempoProfile(
          track.profileName
        );
      const interpretation = interpretTempo(
        detection,
        analysis,
        profile
      );

      const actualBpm = interpretation.bpm;
      const error = bpmError(
        track.expectedBpm,
        actualBpm
      );
      const classification = classifyBenchmarkResult(
        track.expectedBpm,
        actualBpm,
        track.absoluteTolerance,
        track.relativeTolerancePercent
      );

      result = {
        track,
        analysisSource:
          analysisResult.source,
        detectedBpm: detection.bpm,
        actualBpm,
        detectionConfidence: detection.confidence,
        interpretationConfidence:
          interpretation.confidence,
        interpretationAdjusted:
          interpretation.adjusted,
        adjustment: interpretation.adjustment,
        doubleTimeEvidence:
          interpretation.doubleTimeEvidence ?? null,
        absoluteError: error.absolute,
        percentError: error.percent,
        classification,
        error: null,
      };
    } catch (error) {
      result = {
        track,
        analysisSource: null,
        detectedBpm: null,
        actualBpm: null,
        detectionConfidence: "low",
        interpretationConfidence: "low",
        interpretationAdjusted: false,
        adjustment: null,
        doubleTimeEvidence: null,
        absoluteError: Infinity,
        percentError: Infinity,
        classification: "no-result",
        error: error.message,
      };
    }

    results.push(result);
    printBenchmarkRow(
      result,
      index,
      config.tracks.length
    );
    console.log();
  }

  printBenchmarkSummary(results);

  return results;
}

module.exports = {
  runBenchmark,
  loadBenchmarkConfig,
  normalizeBenchmarkConfig,
  classifyBenchmarkResult,
};

function formatNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) {
    return "N/A";
  }

  return value.toFixed(decimals);
}

function formatBpm(value) {
  return formatNumber(value, 2);
}

function printDoubleTimeEvidence(
  evidence,
  indent = "    "
) {
  if (!evidence) {
    return;
  }

  const status =
    evidence.passed
      ? "DOUBLE"
      : "KEEP BASE";

  console.log(
    `${indent}Double evidence:   ${evidence.totalScore.toFixed(
      1
    )}/${evidence.maximumScore.toFixed(
      1
    )} ` +
      `(required ${evidence.requiredScore.toFixed(
        1
      )}) → ${status}`
  );

  const candidate =
    evidence.breakdown
      .candidateConsensus;

  console.log(
    `${indent}  Candidate:       ${
      Number.isFinite(candidate.value)
        ? candidate.value.toFixed(2)
        : "N/A"
    }/${candidate.threshold.toFixed(
      2
    )} score ` +
      `(${candidate.points}/${candidate.maximum} pts)`
  );

  const midpoint =
    evidence.breakdown
      .midpointOnsets;

  console.log(
    `${indent}  Midpoint onsets: ${
      Number.isFinite(midpoint.value)
        ? `${(midpoint.value * 100).toFixed(
            1
          )}%`
        : "N/A"
    } / ${(midpoint.threshold * 100).toFixed(
      1
    )}% ` +
      `(${midpoint.points}/${midpoint.maximum} pts)`
  );

  const rhythm =
    evidence.breakdown
      .rhythmConfidence;

  console.log(
    `${indent}  Rhythm conf.:    ${
      Number.isFinite(rhythm.value)
        ? rhythm.value.toFixed(3)
        : "N/A"
    } / ${rhythm.threshold.toFixed(
      3
    )} ` +
      `(${rhythm.points}/${rhythm.maximum} pts)`
  );

  const histogram =
    evidence.breakdown
      .histogramDominance;

  console.log(
    `${indent}  Hist dominance:  ${
      Number.isFinite(histogram.value)
        ? `${(histogram.value * 100).toFixed(
            1
          )}%`
        : "N/A"
    } / ${(histogram.threshold * 100).toFixed(
      1
    )}% ` +
      `(${histogram.points}/${histogram.maximum} pts)`
  );
}

function printAnalysis(
  analysis,
  detection,
  interpretation
) {
  console.log("  Acoustic analysis:");
  console.log(
    `    Rhythm:           ${formatBpm(
      analysis.rhythm.bpm
    )}`
  );
  console.log(
    `    Percival:         ${formatBpm(
      analysis.percival.bpm
    )}`
  );
  console.log(
    `    Beat median:      ${formatBpm(
      analysis.beats.medianBpm
    )}`
  );
  console.log(
    `    Beat variation:   ${
      Number.isFinite(
        analysis.beats.variationPercent
      )
        ? `${analysis.beats.variationPercent.toFixed(
            2
          )}%`
        : "N/A"
    }`
  );
  console.log(
    `    Beats detected:   ${analysis.beats.count}`
  );
  console.log(
    `    Onsets detected:  ${analysis.onsets.count}`
  );
  console.log(
    `    Onset rate:       ${formatNumber(
      analysis.onsets.rate,
      3
    )}/s`
  );
  console.log(
    `    Midpoint onsets:  ${
      Number.isFinite(analysis.onsets.midpointRatio)
        ? `${(analysis.onsets.midpointRatio * 100).toFixed(1)}% (${analysis.onsets.midpointHits}/${analysis.onsets.midpointIntervals})`
        : "N/A"
    }`
  );
  console.log(
    `    Rhythm confidence:${formatNumber(
      analysis.rhythm.confidence,
      3
    ).padStart(8)}`
  );
  console.log(
    `    Estimate median:  ${formatBpm(
      analysis.estimates.median
    )}`
  );
  console.log(
    `    Hist peak 1:      ${formatBpm(
      analysis.histogram.firstPeak.bpm
    )} (weight ${formatNumber(
      analysis.histogram.firstPeak.weight,
      3
    )})`
  );
  console.log(
    `    Hist peak 2:      ${formatBpm(
      analysis.histogram.secondPeak.bpm
    )} (weight ${formatNumber(
      analysis.histogram.secondPeak.weight,
      3
    )})`
  );

  console.log();
  console.log("  Detection decision:");
  console.log(
    `    Detected BPM:     ${formatBpm(
      detection.bpm
    )}`
  );
  console.log(
    `    Confidence:       ${detection.confidence.toUpperCase()}`
  );
  console.log(
    `    Score:            ${formatNumber(
      detection.score
    )}/${formatNumber(
      detection.maximumScore
    )}`
  );
  console.log(
    `    Reason:           ${detection.reason}`
  );

  if (detection.octaveAmbiguous) {
    console.log(
      "    Octave ambiguity: YES"
    );
  }

  if (detection.supporters.length > 0) {
    console.log();
    console.log("    Detection evidence:");

    for (const supporter of detection.supporters) {
      console.log(
        "      " +
          supporter.source.padEnd(10) +
          " " +
          formatBpm(
            supporter.rawBpm
          ).padStart(7) +
          " BPM " +
          `(${supporter.relationship}, ` +
          `${supporter.difference.toFixed(
            2
          )}% diff, ` +
          `score ${supporter.score.toFixed(
            2
          )})`
      );
    }
  }

  if (detection.alternatives.length > 0) {
    console.log();
    console.log("    Alternative candidates:");

    for (const alternative of detection.alternatives) {
      console.log(
        `      ${formatBpm(
          alternative.bpm
        )} BPM ` +
          `(score ${alternative.score.toFixed(
            2
          )})`
      );
    }
  }

  console.log();
  console.log("  Musical interpretation:");
  console.log(
    `    Profile:          ${interpretation.profile}`
  );
  console.log(
    `    Suggested BPM:    ${formatBpm(
      interpretation.bpm
    )}`
  );
  console.log(
    `    Confidence:       ${interpretation.confidence.toUpperCase()}`
  );
  console.log(
    `    Adjusted:         ${
      interpretation.adjusted
        ? "YES"
        : "NO"
    }`
  );

  if (interpretation.adjusted) {
    console.log(
      `    Original BPM:     ${formatBpm(
        interpretation.sourceBpm
      )}`
    );
    console.log(
      `    Relationship:     ${interpretation.relationship}`
    );
    console.log(
      `    Adjustment:       ${interpretation.adjustment}`
    );
    console.log(
      `    Candidate score:  ${formatNumber(
        interpretation.suggestedCandidateScore
      )}/${formatNumber(
        detection.maximumScore
      )}`
    );

    if (interpretation.directSupport !== null) {
      console.log(
        `    Direct support:   ${
          interpretation.directSupport ? "YES" : "NO"
        }`
      );
    }

    if (interpretation.evidenceMode) {
      console.log(
        `    Evidence mode:    ${interpretation.evidenceMode}`
      );
    }

    if (
      Number.isFinite(
        interpretation.midpointOnsetRatio
      )
    ) {
      console.log(
        `    Midpoint support: ${(interpretation.midpointOnsetRatio * 100).toFixed(1)}%`
      );
    }
  }

  if (interpretation.doubleTimeEvidence) {
    console.log();
    printDoubleTimeEvidence(
      interpretation.doubleTimeEvidence,
      "    "
    );
  }

  console.log(
    `    Reason:           ${interpretation.reason}`
  );
}

module.exports = {
  formatNumber,
  formatBpm,
  printDoubleTimeEvidence,
  printAnalysis,
};

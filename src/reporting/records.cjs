const path = require("node:path");

function finiteOrNull(value) {
  return Number.isFinite(value)
    ? value
    : null;
}

function buildAnalysisReportRow({
  folder,
  file,
  analysisSource,
  analysis,
  detection,
  interpretation,
  proposedPath = null,
  outputResult = null,
  outputMode = null,
  status,
  review = null,
  error = null,
}) {
  const evidence =
    interpretation?.doubleTimeEvidence;

  return {
    file:
      path.basename(file),
    relativePath:
      path.relative(folder, file),
    fullPath:
      path.resolve(file),

    status,
    profile:
      interpretation?.profile ?? null,
    analysisSource,

    detectedBpm:
      finiteOrNull(
        detection?.bpm
      ),
    detectionConfidence:
      detection?.confidence ?? null,
    detectionScore:
      finiteOrNull(
        detection?.score
      ),
    detectionMaximumScore:
      finiteOrNull(
        detection?.maximumScore
      ),

    interpretedBpm:
      finiteOrNull(
        interpretation?.bpm
      ),
    interpretationConfidence:
      interpretation?.confidence ?? null,
    adjusted:
      interpretation?.adjusted ?? false,
    adjustment:
      interpretation?.adjustment ?? null,
    relationship:
      interpretation?.relationship ?? null,
    autoApply:
      interpretation?.autoApply ?? false,

    existingMetadataBpm:
      finiteOrNull(
        outputResult?.existingMetadataBpm
      ),
    outputMode,
    outputApplied:
      outputResult?.applied ?? null,
    outputStatus:
      outputResult?.status ?? null,
    metadataSupported:
      outputResult?.metadataSupport
        ?.supported ?? null,
    metadataWritten:
      outputResult?.metadataResult
        ?.written ?? null,
    metadataUnchanged:
      outputResult?.metadataResult
        ?.unchanged ?? null,
    metadataWrittenBpm:
      finiteOrNull(
        outputResult?.metadataResult
          ?.bpm
      ),
    metadataReason:
      outputResult?.metadataResult
        ?.reason ?? null,
    finalPath:
      outputResult?.finalPath ??
      path.resolve(file),

    proposedFilename:
      proposedPath
        ? path.basename(proposedPath)
        : null,

    reviewAction:
      review?.action ?? null,
    reviewedBpm:
      finiteOrNull(
        review?.selectedBpm
      ),
    reviewSource:
      review?.source ?? null,
    reviewAccepted:
      review?.accepted ?? null,

    rhythmBpm:
      finiteOrNull(
        analysis?.rhythm?.bpm
      ),
    percivalBpm:
      finiteOrNull(
        analysis?.percival?.bpm
      ),
    beatMedianBpm:
      finiteOrNull(
        analysis?.beats?.medianBpm
      ),
    beatVariationPercent:
      finiteOrNull(
        analysis?.beats
          ?.variationPercent
      ),
    beatsDetected:
      finiteOrNull(
        analysis?.beats?.count
      ),

    onsetsDetected:
      finiteOrNull(
        analysis?.onsets?.count
      ),
    onsetRate:
      finiteOrNull(
        analysis?.onsets?.rate
      ),
    midpointOnsetRatio:
      finiteOrNull(
        analysis?.onsets
          ?.midpointRatio
      ),

    rhythmConfidence:
      finiteOrNull(
        analysis?.rhythm
          ?.confidence
      ),

    histogramPeak1Bpm:
      finiteOrNull(
        analysis?.histogram
          ?.firstPeak?.bpm
      ),
    histogramPeak1Weight:
      finiteOrNull(
        analysis?.histogram
          ?.firstPeak?.weight
      ),
    histogramPeak2Bpm:
      finiteOrNull(
        analysis?.histogram
          ?.secondPeak?.bpm
      ),
    histogramPeak2Weight:
      finiteOrNull(
        analysis?.histogram
          ?.secondPeak?.weight
      ),

    doubleEvidenceScore:
      finiteOrNull(
        evidence?.totalScore
      ),
    doubleEvidenceMaximum:
      finiteOrNull(
        evidence?.maximumScore
      ),
    doubleEvidenceRequired:
      finiteOrNull(
        evidence?.requiredScore
      ),

    reason:
      interpretation?.reason ??
      detection?.reason ??
      null,

    error,
  };
}

function buildErrorReportRow({
  folder,
  file,
  analysisSource = null,
  error,
}) {
  return buildAnalysisReportRow({
    folder,
    file,
    analysisSource,
    analysis: null,
    detection: null,
    interpretation: null,
    proposedPath: null,
    status: "error",
    error,
  });
}

function buildBenchmarkReportRow(
  result
) {
  return {
    file:
      result.track.file,
    expectedBpm:
      result.track.expectedBpm,
    profile:
      result.track.profileName,
    analysisSource:
      result.analysisSource ?? null,

    detectedBpm:
      result.detectedBpm,
    interpretedBpm:
      result.actualBpm,

    detectionConfidence:
      result.detectionConfidence,
    interpretationConfidence:
      result.interpretationConfidence,

    adjusted:
      result.interpretationAdjusted,
    adjustment:
      result.adjustment,

    absoluteError:
      Number.isFinite(
        result.absoluteError
      )
        ? result.absoluteError
        : null,

    percentError:
      Number.isFinite(
        result.percentError
      )
        ? result.percentError
        : null,

    classification:
      result.classification,

    doubleEvidenceScore:
      result.doubleTimeEvidence
        ?.totalScore ?? null,

    doubleEvidenceMaximum:
      result.doubleTimeEvidence
        ?.maximumScore ?? null,

    midpointOnsetRatio:
      result.doubleTimeEvidence
        ?.midpointRatio ?? null,

    rhythmConfidence:
      result.doubleTimeEvidence
        ?.rhythmConfidence ?? null,

    histogramDominance:
      result.doubleTimeEvidence
        ?.histogramDominance ?? null,

    notes:
      result.track.notes ?? null,
    error:
      result.error ?? null,
  };
}

module.exports = {
  buildAnalysisReportRow,
  buildErrorReportRow,
  buildBenchmarkReportRow,
};

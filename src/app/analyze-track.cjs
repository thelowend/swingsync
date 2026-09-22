const {
  detectBPM,
} = require("../audio/analyzer.cjs");

const {
  reconcileTempo,
} = require("../tempo/reconciler.cjs");

const {
  interpretTempo,
} = require("../tempo/interpreter.cjs");

const {
  readTrackMetadata,
} = require("../metadata/metadata-reader.cjs");

async function analyzeTrack({
  file,
  profile,
  cache,
}) {
  const [
    analysisResult,
    metadata,
  ] = await Promise.all([
    cache.getOrAnalyze(
      file,
      detectBPM
    ),

    // Metadata is intentionally not part of the acoustic-analysis cache.
    // A BPM tag may change while the audio stream itself stays identical.
    readTrackMetadata(
      file
    ),
  ]);

  const analysis =
    analysisResult.analysis;

  const detection =
    reconcileTempo(
      analysis
    );

  const interpretation =
    interpretTempo(
      detection,
      analysis,
      profile
    );

  const needsReview =
    !Number.isFinite(
      interpretation.bpm
    ) ||
    !interpretation.autoApply;

  return {
    file,
    analysisSource:
      analysisResult.source,
    analysis,
    metadata,
    existingMetadataBpm:
      Number.isFinite(
        metadata.bpm
      )
        ? metadata.bpm
        : null,
    detection,
    interpretation,
    needsReview,
  };
}

module.exports = {
  analyzeTrack,
};

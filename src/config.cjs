// Core acoustic-analysis configuration.

// Increment ANALYZER_VERSION whenever detectBPM() changes in a way that
// makes previously cached acoustic-analysis results unsafe to reuse.
const ANALYZER_VERSION = "2026-09-22-v1";
const CACHE_SCHEMA_VERSION = 1;


const SAMPLE_RATE = 44100;
const MIN_BPM = 50;
const MAX_BPM = 240;

const TEMPO_MATCH_TOLERANCE = 3;
const HYPOTHESIS_CLUSTER_TOLERANCE = 1.5;

const SOURCE_WEIGHTS = {
  rhythm: 3,
  percival: 2,
  beats: 2,
  histogram: 2,
};

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".flac",
  ".m4a",
  ".aac",
  ".ogg",
]);

module.exports = {
  ANALYZER_VERSION,
  CACHE_SCHEMA_VERSION,
  SAMPLE_RATE,
  MIN_BPM,
  MAX_BPM,
  TEMPO_MATCH_TOLERANCE,
  HYPOTHESIS_CLUSTER_TOLERANCE,
  SOURCE_WEIGHTS,
  AUDIO_EXTENSIONS,
};

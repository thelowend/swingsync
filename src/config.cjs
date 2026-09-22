// SwingSync application and acoustic-analysis configuration.

const path = require("node:path");

require("dotenv").config();

const MUSIC_FOLDERS_ENV_VAR =
  "SWINGSYNC_MUSIC_FOLDERS";

function parseMusicFolders(
  rawValue
) {
  if (
    typeof rawValue !==
      "string" ||
    rawValue.trim() === ""
  ) {
    return [];
  }

  const trimmed =
    rawValue.trim();

  // JSON array is supported for users who prefer an explicit structured
  // representation in .env:
  //
  // SWINGSYNC_MUSIC_FOLDERS=["D:\\Music\\Swing","E:\\Boogie"]
  if (
    trimmed.startsWith("[")
  ) {
    try {
      const parsed =
        JSON.parse(trimmed);

      if (
        !Array.isArray(parsed) ||
        parsed.some(
          (value) =>
            typeof value !==
            "string"
        )
      ) {
        throw new Error(
          "value must be an array of strings"
        );
      }

      return parsed
        .map((value) =>
          value.trim()
        )
        .filter(Boolean);
    } catch (error) {
      throw new Error(
        `${MUSIC_FOLDERS_ENV_VAR} contains invalid JSON: ${error.message}`
      );
    }
  }

  // Semicolons are the default delimiter because they do not conflict with
  // Windows drive-letter paths such as D:\Music.
  return trimmed
    .split(";")
    .map((value) =>
      value.trim()
    )
    .filter(Boolean);
}

const DEFAULT_MUSIC_FOLDERS =
  parseMusicFolders(
    process.env[
      MUSIC_FOLDERS_ENV_VAR
    ] ?? ""
  );

function resolveMusicFolders(
  folders =
    DEFAULT_MUSIC_FOLDERS,
  {
    cwd = process.cwd(),
  } = {}
) {
  const normalized =
    (
      Array.isArray(folders)
        ? folders
        : [folders]
    )
      .filter(
        (folder) =>
          typeof folder ===
            "string" &&
          folder.trim() !== ""
      )
      .map((folder) =>
        path.resolve(
          cwd,
          folder.trim()
        )
      );

  // Preserve order while removing duplicate roots.
  return [
    ...new Set(
      normalized
    ),
  ];
}

// Increment ANALYZER_VERSION whenever detectBPM() changes in a way that
// makes previously cached acoustic-analysis results unsafe to reuse.
const ANALYZER_VERSION =
  "2026-09-22-v1";

const CACHE_SCHEMA_VERSION =
  1;

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

const AUDIO_EXTENSIONS =
  new Set([
    ".mp3",
    ".wav",
    ".flac",
    ".m4a",
    ".aac",
    ".ogg",
  ]);

module.exports = {
  MUSIC_FOLDERS_ENV_VAR,
  DEFAULT_MUSIC_FOLDERS,
  parseMusicFolders,
  resolveMusicFolders,

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

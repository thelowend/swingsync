const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const {
  readTrackMetadata,
} = require("./metadata-reader.cjs");

const WRITE_FORMATS = Object.freeze({
  ".mp3": {
    name: "MP3 / ID3v2",
    key: "TBPM",
    extraArgs: [
      "-id3v2_version",
      "3",
    ],
  },

  ".flac": {
    name: "FLAC / Vorbis Comment",
    key: "BPM",
    extraArgs: [],
  },

  ".ogg": {
    name: "Ogg / Vorbis Comment",
    key: "BPM",
    extraArgs: [],
  },

  ".m4a": {
    name: "M4A / iTunes metadata",
    key: "tmpo",
    extraArgs: [],
  },

  ".mp4": {
    name: "MP4 / iTunes metadata",
    key: "tmpo",
    extraArgs: [],
  },
});

function normalizeBpmForMetadata(
  bpm
) {
  if (
    !Number.isFinite(bpm) ||
    bpm <= 0
  ) {
    throw new Error(
      "BPM must be a positive finite number"
    );
  }

  // The most interoperable representation across the supported
  // formats is an integer tempo. MP4's tmpo is integer-valued.
  return Math.round(bpm);
}

function getMetadataWriteSupport(
  filePath
) {
  const extension =
    path.extname(
      filePath
    ).toLowerCase();

  const format =
    WRITE_FORMATS[
      extension
    ];

  if (!format) {
    return {
      supported: false,
      extension,
      formatName: null,
      tagKey: null,
      reason:
        extension === ".wav"
          ? "WAV does not have a sufficiently interoperable BPM convention in this version"
          : extension === ".aac"
          ? "Raw AAC does not provide a reliable cross-player metadata container"
          : `Metadata BPM writing is not configured for ${extension || "this file type"}`,
    };
  }

  return {
    supported: true,
    extension,
    formatName:
      format.name,
    tagKey:
      format.key,
    reason: null,
  };
}

function buildFfmpegMetadataArgs({
  inputPath,
  outputPath,
  bpm,
}) {
  const support =
    getMetadataWriteSupport(
      inputPath
    );

  if (!support.supported) {
    throw new Error(
      support.reason
    );
  }

  const format =
    WRITE_FORMATS[
      support.extension
    ];

  const normalizedBpm =
    normalizeBpmForMetadata(
      bpm
    );

  return [
    "-v",
    "error",
    "-y",

    "-i",
    inputPath,

    // Preserve all streams including embedded artwork when possible.
    "-map",
    "0",

    // Preserve existing file-level metadata, then override/add BPM.
    "-map_metadata",
    "0",

    // Preserve chapters where the container supports them.
    "-map_chapters",
    "0",

    // Stream-copy: no audio re-encoding.
    "-c",
    "copy",

    "-metadata",
    `${format.key}=${normalizedBpm}`,

    ...format.extraArgs,

    outputPath,
  ];
}

function runFfmpeg(
  args
) {
  // Resolve the binary only when an actual metadata write occurs.
  // This keeps the pure planning/format helpers independent from the
  // runtime FFmpeg dependency and easier to reuse/test.
  const ffmpegPath =
    require("ffmpeg-static");

  return new Promise(
    (resolve, reject) => {
      const process =
        spawn(
          ffmpegPath,
          args,
          {
            windowsHide: true,
          }
        );

      const errors = [];

      process.stderr.on(
        "data",
        (chunk) => {
          errors.push(chunk);
        }
      );

      process.on(
        "error",
        reject
      );

      process.on(
        "close",
        (code) => {
          if (code !== 0) {
            reject(
              new Error(
                Buffer.concat(
                  errors
                ).toString() ||
                  `FFmpeg exited with code ${code}`
              )
            );

            return;
          }

          resolve();
        }
      );
    }
  );
}

function temporarySiblingPath(
  filePath,
  label
) {
  const directory =
    path.dirname(
      filePath
    );

  const extension =
    path.extname(
      filePath
    );

  const base =
    path.basename(
      filePath,
      extension
    );

  const unique =
    `${process.pid}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;

  return path.join(
    directory,
    `.${base}.bpm-renamer-${label}-${unique}${extension}`
  );
}

async function verifyWrittenBpm({
  filePath,
  expectedBpm,
}) {
  const metadata =
    await readTrackMetadata(
      filePath
    );

  if (metadata.readError) {
    throw new Error(
      `Could not verify BPM metadata: ${metadata.readError}`
    );
  }

  if (
    !Number.isFinite(
      metadata.bpm
    )
  ) {
    throw new Error(
      "BPM metadata was not readable after writing"
    );
  }

  if (
    Math.abs(
      metadata.bpm -
      expectedBpm
    ) > 1
  ) {
    throw new Error(
      `BPM verification failed: expected ${expectedBpm}, read ${metadata.bpm}`
    );
  }

  return metadata;
}

async function replaceOriginalSafely({
  originalPath,
  replacementPath,
}) {
  const backupPath =
    temporarySiblingPath(
      originalPath,
      "backup"
    );

  let originalMoved =
    false;

  try {
    await fs.rename(
      originalPath,
      backupPath
    );

    originalMoved = true;

    await fs.rename(
      replacementPath,
      originalPath
    );

    await fs.rm(
      backupPath,
      {
        force: true,
      }
    );
  } catch (error) {
    if (originalMoved) {
      try {
        await fs.rm(
          originalPath,
          {
            force: true,
          }
        );
      } catch {
        // Ignore cleanup error and continue rollback attempt.
      }

      try {
        await fs.rename(
          backupPath,
          originalPath
        );
      } catch (rollbackError) {
        throw new Error(
          `${error.message}. Rollback also failed: ${rollbackError.message}`
        );
      }
    }

    throw error;
  }
}

async function writeBpmMetadata(
  filePath,
  bpm,
  {
    verify = true,
    existingMetadata = null,
  } = {}
) {
  const support =
    getMetadataWriteSupport(
      filePath
    );

  if (!support.supported) {
    return {
      written: false,
      unchanged: false,
      supported: false,
      bpm: null,
      support,
      metadata: existingMetadata,
      reason:
        support.reason,
    };
  }

  const normalizedBpm =
    normalizeBpmForMetadata(
      bpm
    );

  const before =
    existingMetadata ??
    (await readTrackMetadata(
      filePath
    ));

  if (
    Number.isFinite(
      before.bpm
    ) &&
    Math.round(
      before.bpm
    ) === normalizedBpm
  ) {
    return {
      written: false,
      unchanged: true,
      supported: true,
      bpm:
        normalizedBpm,
      support,
      metadata:
        before,
      reason:
        "Existing BPM metadata already matches",
    };
  }

  const tempPath =
    temporarySiblingPath(
      filePath,
      "metadata"
    );

  try {
    const args =
      buildFfmpegMetadataArgs({
        inputPath:
          filePath,
        outputPath:
          tempPath,
        bpm:
          normalizedBpm,
      });

    await runFfmpeg(
      args
    );

    const stats =
      await fs.stat(
        tempPath
      );

    if (
      !stats.isFile() ||
      stats.size <= 0
    ) {
      throw new Error(
        "Metadata rewrite produced an empty output file"
      );
    }

    const verified =
      verify
        ? await verifyWrittenBpm({
            filePath:
              tempPath,
            expectedBpm:
              normalizedBpm,
          })
        : null;

    await replaceOriginalSafely({
      originalPath:
        filePath,
      replacementPath:
        tempPath,
    });

    return {
      written: true,
      unchanged: false,
      supported: true,
      bpm:
        normalizedBpm,
      support,
      metadata:
        verified ?? {
          ...before,
          bpm:
            normalizedBpm,
        },
      reason:
        null,
    };
  } finally {
    await fs.rm(
      tempPath,
      {
        force: true,
      }
    ).catch(() => {});
  }
}

module.exports = {
  WRITE_FORMATS,
  normalizeBpmForMetadata,
  getMetadataWriteSupport,
  buildFfmpegMetadataArgs,
  writeBpmMetadata,
};

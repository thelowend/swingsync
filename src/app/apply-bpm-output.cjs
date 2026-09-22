const {
  buildNewFilename,
} = require("../files/naming.cjs");

const {
  renameFileSafely,
} = require("../files/renamer.cjs");

const {
  getMetadataWriteSupport,
  writeBpmMetadata,
} = require("../metadata/ffmpeg-metadata-writer.cjs");

const OUTPUT_MODES =
  Object.freeze({
    METADATA: "metadata",
    FILENAME: "filename",
    BOTH: "both",
  });

function validateOutputMode(
  outputMode
) {
  if (
    !Object.values(
      OUTPUT_MODES
    ).includes(
      outputMode
    )
  ) {
    throw new Error(
      `Unknown output mode: ${outputMode}`
    );
  }
}

function planBpmOutput({
  file,
  bpm,
  outputMode,
  existingMetadata = null,
}) {
  validateOutputMode(
    outputMode
  );

  if (
    !Number.isFinite(bpm) ||
    bpm <= 0
  ) {
    throw new Error(
      "A valid BPM is required"
    );
  }

  const metadataRequested =
    outputMode ===
      OUTPUT_MODES.METADATA ||
    outputMode ===
      OUTPUT_MODES.BOTH;

  const filenameRequested =
    outputMode ===
      OUTPUT_MODES.FILENAME ||
    outputMode ===
      OUTPUT_MODES.BOTH;

  const metadataSupport =
    metadataRequested
      ? getMetadataWriteSupport(
          file
        )
      : null;

  return {
    outputMode,
    bpm,
    metadataRequested,
    filenameRequested,
    metadataSupport,
    existingMetadataBpm:
      Number.isFinite(
        existingMetadata?.bpm
      )
        ? existingMetadata.bpm
        : null,
    proposedPath:
      filenameRequested
        ? buildNewFilename(
            file,
            bpm
          )
        : null,
  };
}

async function applyBpmOutput({
  file,
  bpm,
  outputMode,
  applyChanges,
  existingMetadata = null,
  cache = null,

  // Dependency injection keeps this service testable and lets a future
  // GUI or platform adapter swap implementations without changing the
  // domain/application workflow.
  metadataWriter =
    writeBpmMetadata,
  fileRenamer =
    renameFileSafely,
}) {
  const plan =
    planBpmOutput({
      file,
      bpm,
      outputMode,
      existingMetadata,
    });

  if (!applyChanges) {
    return {
      ...plan,
      applied: false,
      status: "preview",
      finalPath:
        file,
      metadataResult:
        null,
      filenameResult:
        null,
    };
  }

  if (
    plan.metadataRequested &&
    !plan.metadataSupport
      .supported
  ) {
    return {
      ...plan,
      applied: false,
      status:
        "unsupported-metadata",
      finalPath:
        file,
      metadataResult: {
        written: false,
        supported: false,
        reason:
          plan.metadataSupport
            .reason,
      },
      filenameResult:
        null,
    };
  }

  let currentPath =
    file;

  let metadataResult =
    null;

  let filenameResult =
    null;

  if (
    plan.metadataRequested
  ) {
    metadataResult =
      await metadataWriter(
        currentPath,
        bpm,
        {
          existingMetadata,
        }
      );

    if (
      !metadataResult.supported
    ) {
      return {
        ...plan,
        applied: false,
        status:
          "unsupported-metadata",
        finalPath:
          currentPath,
        metadataResult,
        filenameResult,
      };
    }

    if (
      cache &&
      (
        metadataResult.written ||
        metadataResult.unchanged
      )
    ) {
      await cache.refreshFingerprint(
        currentPath
      );
    }
  }

  if (
    plan.filenameRequested
  ) {
    filenameResult =
      await fileRenamer(
        currentPath,
        plan.proposedPath
      );

    if (
      filenameResult.renamed
    ) {
      const previousPath =
        currentPath;

      currentPath =
        plan.proposedPath;

      if (cache) {
        await cache.moveEntry(
          previousPath,
          currentPath
        );
      }
    }
  }

  const metadataApplied =
    metadataResult
      ? (
          metadataResult.written ||
          metadataResult.unchanged
        )
      : true;

  const filenameApplied =
    filenameResult
      ? (
          filenameResult.renamed ||
          filenameResult.reason ===
            "filename already matches"
        )
      : true;

  return {
    ...plan,
    applied:
      metadataApplied &&
      filenameApplied,
    status:
      metadataApplied &&
      filenameApplied
        ? "applied"
        : "partial",
    finalPath:
      currentPath,
    metadataResult,
    filenameResult,
  };
}

module.exports = {
  OUTPUT_MODES,
  validateOutputMode,
  planBpmOutput,
  applyBpmOutput,
};

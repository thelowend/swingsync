const fs = require("node:fs/promises");
const path = require("node:path");

const {
  DEFAULT_CACHE_FILENAME,
  LEGACY_CACHE_FILENAMES,
} = require("../branding.cjs");

async function fileExists(
  filePath
) {
  try {
    const stats =
      await fs.stat(filePath);

    return stats.isFile();
  } catch (error) {
    if (
      error.code === "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

async function resolveDefaultCachePath({
  cwd = process.cwd(),
} = {}) {
  const preferredPath =
    path.resolve(
      cwd,
      DEFAULT_CACHE_FILENAME
    );

  if (
    await fileExists(
      preferredPath
    )
  ) {
    return {
      filePath:
        preferredPath,
      migratedFrom:
        null,
    };
  }

  for (
    const legacyName of
    LEGACY_CACHE_FILENAMES
  ) {
    const legacyPath =
      path.resolve(
        cwd,
        legacyName
      );

    if (
      !(await fileExists(
        legacyPath
      ))
    ) {
      continue;
    }

    // Copy rather than rename so an older project version can still use its
    // legacy cache if the user temporarily switches back.
    await fs.copyFile(
      legacyPath,
      preferredPath
    );

    return {
      filePath:
        preferredPath,
      migratedFrom:
        legacyPath,
    };
  }

  return {
    filePath:
      preferredPath,
    migratedFrom:
      null,
  };
}

module.exports = {
  resolveDefaultCachePath,
};

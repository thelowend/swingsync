const fs = require("node:fs/promises");

async function renameFileSafely(
  oldPath,
  newPath
) {
  if (oldPath === newPath) {
    return {
      renamed: false,
      reason: "filename already matches",
    };
  }

  try {
    await fs.access(newPath);

    return {
      renamed: false,
      reason: "destination already exists",
    };
  } catch {
    // Destination does not exist.
  }

  await fs.rename(oldPath, newPath);

  return {
    renamed: true,
    reason: null,
  };
}

module.exports = {
  renameFileSafely,
};

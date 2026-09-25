const path = require("node:path");

function cleanExistingBpmDecoration(
  originalName
) {
  return originalName
    // Canonical prefix: [215 BPM] Song
    // Also accepts the older SwingSync prefix: [215] Song
    .replace(
      /^\s*\[\d+(?:\.\d+)?(?:\s*BPM)?\]\s*/i,
      ""
    )
    // Legacy SwingSync suffix: Song [215 BPM]
    .replace(
      /\s*\[\d+(?:\.\d+)?\s*BPM\]\s*$/i,
      ""
    )
    .trim();
}

function buildNewFilename(
  filePath,
  bpm
) {
  const directory =
    path.dirname(filePath);

  const extension =
    path.extname(filePath);

  const originalName =
    path.basename(
      filePath,
      extension
    );

  const cleanName =
    cleanExistingBpmDecoration(
      originalName
    );

  const roundedBpm =
    Math.round(bpm);

  return path.join(
    directory,
    `[${roundedBpm} BPM] ${cleanName}${extension}`
  );
}

module.exports = {
  cleanExistingBpmDecoration,
  buildNewFilename,
};

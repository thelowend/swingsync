const path = require("node:path");

function buildNewFilename(filePath, bpm) {
  const directory = path.dirname(filePath);
  const extension = path.extname(filePath);
  const originalName = path.basename(
    filePath,
    extension
  );

  const cleanName = originalName.replace(
    /\s*\[\d+(?:\.\d+)?\s*BPM\]\s*$/i,
    ""
  );

  const roundedBPM = Math.round(bpm);

  return path.join(
    directory,
    `${cleanName} [${roundedBPM} BPM]${extension}`
  );
}

module.exports = {
  buildNewFilename,
};

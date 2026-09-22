const fs = require("node:fs/promises");
const path = require("node:path");

const { AUDIO_EXTENSIONS } = require("../config.cjs");

async function findAudioFiles(folder) {
  const entries = await fs.readdir(folder, {
    withFileTypes: true,
  });

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(folder, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findAudioFiles(fullPath)));
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (AUDIO_EXTENSIONS.has(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

module.exports = {
  findAudioFiles,
};

const fs =
  require("node:fs/promises");

const path =
  require("node:path");

const {
  AUDIO_EXTENSIONS,
} = require("../config.cjs");

async function findAudioFiles(
  folder
) {
  const entries =
    await fs.readdir(
      folder,
      {
        withFileTypes: true,
      }
    );

  const files = [];

  for (
    const entry of entries
  ) {
    const fullPath =
      path.join(
        folder,
        entry.name
      );

    if (
      entry.isDirectory()
    ) {
      files.push(
        ...(
          await findAudioFiles(
            fullPath
          )
        )
      );

      continue;
    }

    const extension =
      path
        .extname(
          entry.name
        )
        .toLowerCase();

    if (
      AUDIO_EXTENSIONS.has(
        extension
      )
    ) {
      files.push(
        fullPath
      );
    }
  }

  return files;
}

async function findAudioFilesInFolders(
  folders
) {
  const roots =
    Array.isArray(folders)
      ? folders
      : [folders];

  const seenFiles =
    new Set();

  const results = [];

  for (
    const folder of roots
  ) {
    const rootFolder =
      path.resolve(
        folder
      );

    const files =
      await findAudioFiles(
        rootFolder
      );

    for (
      const file of files
    ) {
      const absoluteFile =
        path.resolve(
          file
        );

      // If configured roots overlap, analyze a physical path only once.
      if (
        seenFiles.has(
          absoluteFile
        )
      ) {
        continue;
      }

      seenFiles.add(
        absoluteFile
      );

      results.push({
        file:
          absoluteFile,
        rootFolder,
      });
    }
  }

  results.sort(
    (a, b) =>
      a.file.localeCompare(
        b.file
      )
  );

  return results;
}

module.exports = {
  findAudioFiles,
  findAudioFilesInFolders,
};

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const originalLoad = Module._load;
Module._load = function patchedLoad(
  request,
  parent,
  isMain
) {
  if (request === "dotenv") {
    return { config() {} };
  }
  return originalLoad.call(
    this,
    request,
    parent,
    isMain
  );
};

const {
  BpmApplication,
} = require("../src/client/bpm-application.cjs");
const {
  AnalysisCache,
} = require("../src/cache/analysis-cache.cjs");
const {
  buildNewFilename,
} = require("../src/files/naming.cjs");

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function main() {
  const root = await fs.mkdtemp(
    path.join(
      os.tmpdir(),
      "swingsync-apply-backup-flow-"
    )
  );

  try {
    const file = path.join(
      root,
      "Jump.mp3"
    );
    await fs.writeFile(
      file,
      "original",
      "utf8"
    );

    const cache =
      await AnalysisCache.open({
        enabled: true,
        filePath: path.join(
          root,
          ".swingsync-cache.json"
        ),
      });

    const app =
      new BpmApplication({
        cache,
        services: {
          async findAudioFilesInFolders() {
            return [
              {
                file,
                rootFolder: root,
              },
            ];
          },
          async analyzeTrack({ file: current }) {
            return {
              file: current,
              analysisSource: "computed",
              existingMetadataBpm: null,
              metadata: {
                bpm: null,
                readError: null,
              },
              analysis: {},
              detection: {
                bpm: 120,
                confidence: "high",
                score: 1,
              },
              interpretation: {
                bpm: 120,
                confidence: "high",
                adjusted: false,
                relationship: "same",
                reason: "test",
                reasonCode: null,
                reasonParams: null,
                autoApply: true,
              },
              needsReview: false,
              review: null,
            };
          },
          async applyBpmOutput({
            file: current,
            bpm,
            outputMode,
            applyChanges,
          }) {
            const proposedPath =
              buildNewFilename(
                current,
                bpm
              );

            if (applyChanges) {
              await fs.rename(
                current,
                proposedPath
              );
            }

            return {
              outputMode,
              bpm,
              metadataRequested: false,
              filenameRequested: true,
              metadataSupport: null,
              existingMetadataBpm: null,
              proposedPath,
              applied: true,
              status: "applied",
              finalPath: proposedPath,
              metadataResult: null,
              filenameResult: {
                renamed: true,
                reason: null,
              },
            };
          },
        },
      });

    await app.openLibrary({
      folders: [root],
      profile: "generic",
      outputMode: "filename",
    });

    const track =
      app.getTracks()[0];
    await app.analyzeOne(track.id);

    const results =
      await app.applyAllApproved({
        applyChanges: true,
        createBackup: true,
      });

    assert.equal(
      results[0].result.applied,
      true
    );

    const renamed =
      path.join(
        root,
        "[120 BPM] Jump.mp3"
      );

    assert.equal(
      await exists(file),
      false
    );
    assert.equal(
      await exists(renamed),
      true
    );

    const status =
      await app.getBackupStatus();
    assert.equal(status.available, true);
    assert.equal(status.itemCount, 1);

    const undo =
      await app.undoLastApply();
    assert.equal(undo.restored, 1);
    assert.equal(await exists(file), true);
    assert.equal(await exists(renamed), false);
    assert.equal(
      await fs.readFile(file, "utf8"),
      "original"
    );

    const restoredTrack =
      app.getTrack(track.id);
    assert.equal(
      restoredTrack.file,
      file
    );
    assert.equal(
      restoredTrack.output.applied,
      false
    );
    assert.equal(
      restoredTrack.status,
      "analyzed"
    );

    console.log(
      "Apply backup/undo flow tests passed."
    );
  } finally {
    await fs.rm(
      root,
      {
        recursive: true,
        force: true,
      }
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

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
    return {
      config() {},
    };
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

async function main() {
  const root = await fs.mkdtemp(
    path.join(
      os.tmpdir(),
      "swingsync-reset-test-"
    )
  );

  try {
    const audio = path.join(
      root,
      "Song.mp3"
    );

    await fs.writeFile(
      audio,
      "not-real-audio",
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
                file: audio,
                rootFolder: root,
              },
            ];
          },
          async analyzeTrack({ file }) {
            return {
              file,
              analysisSource: "computed",
              existingMetadataBpm: 100,
              metadata: {
                bpm: 100,
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
          async applyBpmOutput() {
            throw new Error(
              "not used"
            );
          },
        },
      });

    await app.openLibrary({
      folders: [root],
      profile: "generic",
      outputMode: "metadata",
    });

    const track =
      app.getTracks()[0];

    await app.analyzeOne(
      track.id
    );

    assert.equal(
      app.getTrack(track.id).status,
      "analyzed"
    );
    assert.ok(
      app.getTrackDetails(track.id)
    );

    const reset =
      await app.resetTrackAnalysis(
        track.id
      );

    assert.equal(
      reset.status,
      "pending"
    );
    assert.equal(
      reset.tempo.detectedBpm,
      null
    );
    assert.equal(
      reset.review.decision,
      null
    );
    assert.equal(
      reset.output.applied,
      false
    );
    assert.equal(
      app.getTrackDetails(track.id),
      null
    );

    console.log(
      "Reset-track analysis tests passed."
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

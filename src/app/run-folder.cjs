const path =
  require("node:path");

const {
  findAudioFilesInFolders,
} = require("../files/scanner.cjs");

const {
  analyzeTrack,
} = require("./analyze-track.cjs");

const {
  applyBpmOutput,
} = require("./apply-bpm-output.cjs");

const {
  printAnalysis,
} = require("../cli/output.cjs");

const {
  buildAnalysisReportRow,
  buildErrorReportRow,
} = require("../reporting/records.cjs");

async function runFolder(
  folders,
  cli,
  cache
) {
  console.log();

  console.log(
    "Scanning music folders:"
  );

  for (
    const folder of folders
  ) {
    console.log(
      `  - ${folder}`
    );
  }

  console.log(
    `Mode: ${
      cli.applyChanges
        ? "APPLY"
        : "PREVIEW ONLY"
    }`
  );

  console.log(
    `Output: ${cli.outputMode}`
  );

  console.log(
    `Tempo profile: ${cli.profile.name}`
  );

  console.log(
    `Profile behavior: ${cli.profile.description}`
  );

  console.log();

  const entries =
    await findAudioFilesInFolders(
      folders
    );

  console.log(
    `Found ${entries.length} audio file(s) across ${folders.length} folder(s).`
  );

  console.log();

  const records = [];

  let analyzedCount = 0;
  let appliedCount = 0;
  let reviewCount = 0;
  let adjustedCount = 0;
  let errorCount = 0;

  for (
    let index = 0;
    index < entries.length;
    index++
  ) {
    const {
      file,
      rootFolder,
    } = entries[index];

    console.log(
      "--------------------------------------------------"
    );

    console.log(
      `[${index + 1}/${entries.length}] ` +
        `Analyzing: ${path.basename(
          file
        )}`
    );

    console.log();

    let trackResult = null;

    try {
      trackResult =
        await analyzeTrack({
          file,
          profile:
            cli.profile,
          cache,
        });

      analyzedCount++;

      if (
        trackResult
          .interpretation
          .adjusted
      ) {
        adjustedCount++;
      }

      console.log(
        `  Library root:     ${rootFolder}`
      );

      console.log(
        `  Analysis source:  ${
          trackResult.analysisSource ===
          "cache"
            ? "CACHE"
            : "COMPUTED"
        }`
      );

      console.log(
        `  Existing BPM tag: ${
          Number.isFinite(
            trackResult.existingMetadataBpm
          )
            ? trackResult.existingMetadataBpm.toFixed(
                2
              )
            : "N/A"
        }`
      );

      if (
        trackResult.metadata
          .readError
      ) {
        console.log(
          `  Metadata warning: ${trackResult.metadata.readError}`
        );
      }

      console.log();

      printAnalysis(
        trackResult.analysis,
        trackResult.detection,
        trackResult.interpretation
      );

      console.log();

      let status = null;
      let outputResult =
        null;

      if (
        !Number.isFinite(
          trackResult
            .interpretation
            .bpm
        )
      ) {
        reviewCount++;
        status =
          "no-result";

        console.log(
          "  REVIEW REQUIRED: no usable interpreted BPM was produced."
        );
      } else if (
        trackResult.needsReview
      ) {
        reviewCount++;
        status =
          "review";

        console.log(
          `  REVIEW REQUIRED: ${trackResult.interpretation.reason}`
        );
      } else {
        outputResult =
          await applyBpmOutput({
            file,
            bpm:
              trackResult
                .interpretation
                .bpm,
            outputMode:
              cli.outputMode,
            applyChanges:
              cli.applyChanges,
            existingMetadata:
              trackResult.metadata,
            cache,
          });

        status =
          outputResult.status;

        if (
          outputResult.applied &&
          cli.applyChanges
        ) {
          appliedCount++;
        }

        if (
          !cli.applyChanges
        ) {
          console.log(
            `  PREVIEW: would output ${Math.round(
              trackResult.interpretation.bpm
            )} BPM via ${cli.outputMode}.`
          );
        } else if (
          outputResult.status ===
          "unsupported-metadata"
        ) {
          console.log(
            `  NOT APPLIED: ${outputResult.metadataResult.reason}`
          );
        } else {
          console.log(
            `  OUTPUT: ${outputResult.status}`
          );

          if (
            outputResult.metadataResult
          ) {
            console.log(
              `  Metadata: ${
                outputResult.metadataResult.written
                  ? `wrote ${outputResult.metadataResult.bpm} BPM`
                  : outputResult.metadataResult.unchanged
                  ? "already matched"
                  : outputResult.metadataResult.reason
              }`
            );
          }

          if (
            outputResult.filenameResult
          ) {
            console.log(
              `  Filename: ${
                outputResult.filenameResult.renamed
                  ? "renamed"
                  : outputResult.filenameResult.reason
              }`
            );
          }
        }
      }

      records.push(
        buildAnalysisReportRow({
          folder:
            rootFolder,
          file,
          analysisSource:
            trackResult.analysisSource,
          analysis:
            trackResult.analysis,
          detection:
            trackResult.detection,
          interpretation:
            trackResult.interpretation,
          proposedPath:
            outputResult?.proposedPath ??
            null,
          outputResult:
            outputResult ?? {
              existingMetadataBpm:
                trackResult.existingMetadataBpm,
            },
          outputMode:
            cli.outputMode,
          status,
          review: null,
        })
      );

      console.log();
    } catch (error) {
      errorCount++;

      console.error(
        `  ERROR: ${error.message}`
      );

      console.log();

      records.push(
        buildErrorReportRow({
          folder:
            rootFolder,
          file,
          analysisSource:
            trackResult
              ?.analysisSource ??
            null,
          error:
            error.message,
        })
      );
    }
  }

  const summary = {
    folders:
      folders.length,
    filesFound:
      entries.length,
    analyzed:
      analyzedCount,
    profileAdjusted:
      adjustedCount,
    needsReview:
      reviewCount,
    applied:
      cli.applyChanges
        ? appliedCount
        : 0,
    errors:
      errorCount,
    outputMode:
      cli.outputMode,
    previewMode:
      !cli.applyChanges,
  };

  console.log(
    "=================================================="
  );

  console.log(
    "SUMMARY"
  );

  console.log(
    "=================================================="
  );

  console.log(
    `Folders:                  ${summary.folders}`
  );

  console.log(
    `Files found:              ${summary.filesFound}`
  );

  console.log(
    `Analyzed:                 ${summary.analyzed}`
  );

  console.log(
    `Profile-adjusted:         ${summary.profileAdjusted}`
  );

  console.log(
    `Needs review:             ${summary.needsReview}`
  );

  console.log(
    `Applied:                  ${summary.applied}`
  );

  console.log(
    `Errors:                   ${summary.errors}`
  );

  console.log();

  return {
    records,
    summary,
  };
}

module.exports = {
  runFolder,
};

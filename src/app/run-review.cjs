const path = require("node:path");

const {
  findAudioFiles,
} = require("../files/scanner.cjs");

const {
  analyzeTrack,
} = require("./analyze-track.cjs");

const {
  applyBpmOutput,
} = require("./apply-bpm-output.cjs");

const {
  createReviewItem,
  applyReviewDecision,
} = require("../review/review-service.cjs");

const {
  TerminalReviewClient,
} = require("../cli/review-terminal.cjs");

const {
  buildAnalysisReportRow,
  buildErrorReportRow,
} = require("../reporting/records.cjs");

async function outputSelectedBpm({
  trackResult,
  bpm,
  cli,
  cache,
}) {
  return applyBpmOutput({
    file:
      trackResult.file,
    bpm,
    outputMode:
      cli.outputMode,
    applyChanges:
      cli.applyChanges,
    existingMetadata:
      trackResult.metadata,
    cache,
  });
}

async function runReview({
  folder,
  cli,
  cache,
  reviewClient = null,
}) {
  const files =
    await findAudioFiles(
      folder
    );

  const client =
    reviewClient ??
    new TerminalReviewClient();

  const ownsClient =
    reviewClient === null;

  const records = [];

  let analyzed = 0;
  let autoApproved = 0;
  let reviewPresented = 0;
  let reviewApproved = 0;
  let reviewSkipped = 0;
  let applied = 0;
  let errors = 0;
  let stoppedEarly = false;
  let profileAdjusted = 0;

  console.log();
  console.log(
    `Interactive review: ${folder}`
  );
  console.log(
    `Profile: ${cli.profile.name}`
  );
  console.log(
    `Output: ${cli.outputMode}`
  );
  console.log(
    `Mode: ${
      cli.applyChanges
        ? "REVIEW + APPLY"
        : "REVIEW PREVIEW"
    }`
  );
  console.log(
    `Found ${files.length} audio file(s).`
  );
  console.log();

  try {
    for (
      let index = 0;
      index < files.length;
      index++
    ) {
      const file =
        files[index];

      let trackResult =
        null;

      try {
        trackResult =
          await analyzeTrack({
            file,
            profile:
              cli.profile,
            cache,
          });

        analyzed++;

        if (
          trackResult
            .interpretation
            .adjusted
        ) {
          profileAdjusted++;
        }

        if (
          !trackResult.needsReview
        ) {
          autoApproved++;

          const outputResult =
            await outputSelectedBpm({
              trackResult,
              bpm:
                trackResult
                  .interpretation
                  .bpm,
              cli,
              cache,
            });

          if (
            outputResult.applied &&
            cli.applyChanges
          ) {
            applied++;
          }

          console.log(
            `[${index + 1}/${files.length}] AUTO ` +
              `${path.basename(
                file
              )} → ` +
              `${Math.round(
                trackResult
                  .interpretation
                  .bpm
              )} BPM ` +
              `(${trackResult.analysisSource.toUpperCase()}, ${cli.outputMode})`
          );

          records.push(
            buildAnalysisReportRow({
              folder,
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
                outputResult.proposedPath,
              outputResult,
              outputMode:
                cli.outputMode,
              status:
                outputResult.status,
              review: null,
            })
          );

          continue;
        }

        reviewPresented++;

        const item =
          createReviewItem(
            trackResult
          );

        const decision =
          await client.choose(
            item
          );

        if (
          decision?.sessionAction ===
          "quit"
        ) {
          stoppedEarly = true;

          records.push(
            buildAnalysisReportRow({
              folder,
              file,
              analysisSource:
                trackResult.analysisSource,
              analysis:
                trackResult.analysis,
              detection:
                trackResult.detection,
              interpretation:
                trackResult.interpretation,
              outputResult: {
                existingMetadataBpm:
                  trackResult.existingMetadataBpm,
              },
              outputMode:
                cli.outputMode,
              status:
                "review-quit",
              review: null,
            })
          );

          break;
        }

        const resolved =
          applyReviewDecision(
            trackResult,
            decision
          );

        if (
          resolved.review.skipped
        ) {
          reviewSkipped++;

          console.log(
            `Skipped ${path.basename(
              file
            )}.`
          );
          console.log();

          records.push(
            buildAnalysisReportRow({
              folder,
              file,
              analysisSource:
                trackResult.analysisSource,
              analysis:
                trackResult.analysis,
              detection:
                trackResult.detection,
              interpretation:
                trackResult.interpretation,
              outputResult: {
                existingMetadataBpm:
                  trackResult.existingMetadataBpm,
              },
              outputMode:
                cli.outputMode,
              status:
                "review-skipped",
              review:
                resolved.review,
            })
          );

          continue;
        }

        reviewApproved++;

        const outputResult =
          await outputSelectedBpm({
            trackResult,
            bpm:
              resolved.review
                .selectedBpm,
            cli,
            cache,
          });

        if (
          outputResult.applied &&
          cli.applyChanges
        ) {
          applied++;
        }

        console.log(
          `${cli.applyChanges ? "Applied" : "Selected"} ` +
            `${resolved.review.selectedBpm.toFixed(
              2
            )} BPM for ${path.basename(
              file
            )} via ${cli.outputMode}.`
        );

        if (
          outputResult.status ===
          "unsupported-metadata"
        ) {
          console.log(
            `Output warning: ${outputResult.metadataResult.reason}`
          );
        }

        console.log();

        records.push(
          buildAnalysisReportRow({
            folder,
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
              outputResult.proposedPath,
            outputResult,
            outputMode:
              cli.outputMode,
            status:
              outputResult.status,
            review:
              resolved.review,
          })
        );
      } catch (error) {
        errors++;

        console.error(
          `ERROR ${path.basename(
            file
          )}: ${error.message}`
        );
        console.log();

        records.push(
          buildErrorReportRow({
            folder,
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
  } finally {
    if (ownsClient) {
      client.close();
    }
  }

  const summary = {
    filesFound:
      files.length,
    analyzed,
    profileAdjusted,
    autoApproved,
    reviewPresented,
    reviewApproved,
    reviewSkipped,
    applied:
      cli.applyChanges
        ? applied
        : 0,
    errors,
    stoppedEarly,
    outputMode:
      cli.outputMode,
    previewMode:
      !cli.applyChanges,
  };

  console.log(
    "=================================================="
  );
  console.log(
    "REVIEW SUMMARY"
  );
  console.log(
    "=================================================="
  );
  console.log(
    `Files found:              ${summary.filesFound}`
  );
  console.log(
    `Analyzed:                 ${summary.analyzed}`
  );
  console.log(
    `Auto-approved:            ${summary.autoApproved}`
  );
  console.log(
    `Presented for review:     ${summary.reviewPresented}`
  );
  console.log(
    `Review approved:          ${summary.reviewApproved}`
  );
  console.log(
    `Review skipped:           ${summary.reviewSkipped}`
  );
  console.log(
    `Applied:                  ${summary.applied}`
  );
  console.log(
    `Errors:                   ${summary.errors}`
  );
  console.log(
    `Stopped early:            ${
      summary.stoppedEarly
        ? "YES"
        : "NO"
    }`
  );
  console.log();

  return {
    records,
    summary,
  };
}

module.exports = {
  runReview,
  outputSelectedBpm,
};

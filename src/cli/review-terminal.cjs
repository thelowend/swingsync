const readline = require("node:readline/promises");
const {
  stdin,
  stdout,
} = require("node:process");
const path = require("node:path");

const {
  MIN_BPM,
  MAX_BPM,
} = require("../config.cjs");

const {
  REVIEW_ACTIONS,
  createReviewDecision,
} = require("../review/review-service.cjs");

const {
  formatBpm,
} = require("./output.cjs");

function formatPercent(value) {
  return Number.isFinite(value)
    ? `${(value * 100).toFixed(
        1
      )}%`
    : "N/A";
}

function printReviewItem(
  item,
  output = console
) {
  output.log(
    "=================================================="
  );
  output.log(
    `REVIEW: ${path.basename(
      item.file
    )}`
  );
  output.log(
    "=================================================="
  );

  output.log(
    `Profile:              ${item.profile ?? "N/A"}`
  );
  output.log(
    `Existing BPM tag:     ${formatBpm(
      item.existingMetadataBpm
    )}`
  );
  output.log(
    `Detected BPM:         ${formatBpm(
      item.detectedBpm
    )} (${(
      item.detectedConfidence ??
      "unknown"
    ).toUpperCase()})`
  );
  output.log(
    `Suggested BPM:        ${formatBpm(
      item.suggestedBpm
    )} (${(
      item.interpretationConfidence ??
      "unknown"
    ).toUpperCase()})`
  );
  output.log(
    `Adjusted:             ${
      item.adjusted
        ? "YES"
        : "NO"
    }`
  );

  if (item.relationship) {
    output.log(
      `Relationship:         ${item.relationship}`
    );
  }

  if (
    item.doubleTimeEvidence
  ) {
    output.log(
      `Double evidence:      ${item.doubleTimeEvidence.totalScore.toFixed(
        1
      )}/${item.doubleTimeEvidence.maximumScore.toFixed(
        1
      )} (required ${item.doubleTimeEvidence.requiredScore.toFixed(
        1
      )})`
    );
    output.log(
      `Midpoint support:     ${formatPercent(
        item.doubleTimeEvidence
          .midpointRatio
      )}`
    );
  }

  if (
    item.candidates.length >
    0
  ) {
    output.log("");
    output.log(
      "Candidate tempos:"
    );

    for (
      const candidate of
      item.candidates
    ) {
      output.log(
        `  ${formatBpm(
          candidate.bpm
        ).padStart(7)} BPM  ` +
          `${candidate.kind.padEnd(
            11
          )}` +
          `${
            Number.isFinite(
              candidate.score
            )
              ? ` score ${candidate.score.toFixed(
                  2
                )}`
              : ""
          }`
      );
    }
  }

  output.log("");
  output.log(
    `Reason: ${item.reason ?? "Manual review requested"}`
  );
  output.log("");
}

function reviewPromptText(
  item
) {
  const choices = [];

  if (
    Number.isFinite(
      item.detectedBpm
    )
  ) {
    choices.push(
      `[d] detected ${formatBpm(
        item.detectedBpm
      )}`
    );
  }

  if (
    Number.isFinite(
      item.suggestedBpm
    )
  ) {
    choices.push(
      `[s] suggested ${formatBpm(
        item.suggestedBpm
      )}`
    );
  }

  choices.push(
    "[c] custom BPM",
    "[x] skip",
    "[q] quit review"
  );

  return (
    choices.join("  ") +
    "\nChoice: "
  );
}

class TerminalReviewClient {
  constructor({
    input = stdin,
    output = stdout,
    logger = console,
  } = {}) {
    this.logger =
      logger;

    this.rl =
      readline.createInterface({
        input,
        output,
      });
  }

  async choose(item) {
    printReviewItem(
      item,
      this.logger
    );

    while (true) {
      const raw =
        (
          await this.rl.question(
            reviewPromptText(
              item
            )
          )
        )
          .trim()
          .toLowerCase();

      try {
        if (
          raw === "d" &&
          Number.isFinite(
            item.detectedBpm
          )
        ) {
          return createReviewDecision({
            item,
            action:
              REVIEW_ACTIONS.USE_DETECTED,
          });
        }

        if (
          raw === "s" &&
          Number.isFinite(
            item.suggestedBpm
          )
        ) {
          return createReviewDecision({
            item,
            action:
              REVIEW_ACTIONS.USE_SUGGESTED,
          });
        }

        if (raw === "c") {
          const valueRaw =
            (
              await this.rl.question(
                `Enter BPM (${MIN_BPM}-${MAX_BPM}): `
              )
            ).trim();

          const value =
            Number(valueRaw);

          return createReviewDecision({
            item,
            action:
              REVIEW_ACTIONS.USE_CUSTOM,
            customBpm:
              value,
          });
        }

        if (raw === "x") {
          return createReviewDecision({
            item,
            action:
              REVIEW_ACTIONS.SKIP,
          });
        }

        if (raw === "q") {
          return {
            sessionAction:
              "quit",
          };
        }

        this.logger.log(
          "Please choose one of the displayed options."
        );
      } catch (error) {
        this.logger.log(
          `Invalid choice: ${error.message}`
        );
      }
    }
  }

  close() {
    this.rl.close();
  }
}

module.exports = {
  TerminalReviewClient,
  printReviewItem,
  reviewPromptText,
};

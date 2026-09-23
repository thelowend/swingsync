const {
  TEMPO_PROFILES,
  DEFAULT_PROFILE,
  getTempoProfile,
  normalizeProfileName,
} = require("../tempo/profiles.cjs");

const {
  OUTPUT_MODES,
} = require("../app/apply-bpm-output.cjs");

const {
  PRODUCT_NAME,
  CLI_COMMAND,
  DEFAULT_CACHE_FILENAME,
} = require("../branding.cjs");

const {
  DEFAULT_MUSIC_FOLDERS,
  MUSIC_FOLDERS_ENV_VAR,
} = require("../config.cjs");

function printUsage() {
  console.log(`
${PRODUCT_NAME}

Usage:

  ${CLI_COMMAND} [folder ...] [options]

  Development / local source checkout:
  node index.cjs [folder ...] [options]

If no folder is supplied, SwingSync uses the default folder list from:

  ${MUSIC_FOLDERS_ENV_VAR}

Options:

  --profile <name>       Tempo interpretation profile.
                         Available: rhythm-and-blues, swing, generic
                         Default: rhythm-and-blues

  --output <mode>        Output target after BPM analysis/review.
                         metadata | filename | both
                         Default: metadata

  --apply                Apply the selected output.
                         Without this flag, the application previews.

  --write-metadata       Convenience alias for:
                           --apply --output metadata

  --rename               Legacy convenience alias for:
                           --apply --output filename

  --review               Run the interactive review workflow.
                         Only tracks requiring human review are prompted.
                         Combine with --apply to persist accepted decisions.

  --benchmark <file>     Run regression benchmark mode using a JSON file.
                         Benchmark mode never changes files.

  --cache-file <file>    Cache file path.
                         Default: ${DEFAULT_CACHE_FILENAME} in the current directory.

  --no-cache             Bypass cache reads and writes for this run.

  --csv <file>           Write a CSV report.
                         Alias: --report-csv

  --json <file>          Write a JSON report.
                         Alias: --report-json

  --help                 Show this help.

Examples:

  Use folders configured in .env:

    ${CLI_COMMAND} --profile rhythm-and-blues

  Analyze one explicit folder:

    ${CLI_COMMAND} "D:\\Music\\Swing" --profile rhythm-and-blues

  Analyze multiple explicit folders:

    ${CLI_COMMAND} "D:\\Music\\Swing" "D:\\Music\\Boogie" "E:\\Rock and Roll" --profile rhythm-and-blues

  Interactive review using configured defaults:

    ${CLI_COMMAND} --profile rhythm-and-blues --review --apply

  Benchmark against the configured roots:

    ${CLI_COMMAND} --benchmark benchmark.json


.env:

  ${MUSIC_FOLDERS_ENV_VAR}=D:\\Music\\Swing;D:\\Music\\Boogie;E:\\Dance Music

  A JSON array is also accepted:

  ${MUSIC_FOLDERS_ENV_VAR}=["D:\\\\Music\\\\Swing","E:\\\\Dance Music"]


Metadata output:

  ${PRODUCT_NAME} writes standardized BPM metadata for:

    MP3   -> ID3v2 TBPM
    FLAC  -> Vorbis Comment BPM
    OGG   -> Vorbis Comment BPM
    M4A   -> iTunes tmpo

  The media stream is copied by FFmpeg; it is not re-encoded.


Caching:

  Metadata changes do not force an unnecessary acoustic re-analysis.
  After a successful metadata write, the cache fingerprint is refreshed.
`);
}

function requireOptionValue(
  args,
  index,
  option
) {
  const value =
    args[
      index + 1
    ];

  if (
    !value ||
    value.startsWith(
      "--"
    )
  ) {
    throw new Error(
      `${option} requires a value`
    );
  }

  return value;
}

function parseArguments(
  args
) {
  const explicitFolders =
    [];

  let profileName =
    DEFAULT_PROFILE;

  let outputMode =
    OUTPUT_MODES.METADATA;

  let outputExplicit =
    false;

  let applyChanges =
    false;

  let benchmarkFile =
    null;

  let review = false;
  let cacheFile = null;
  let useCache = true;
  let reportCsv = null;
  let reportJson = null;
  let help = false;

  for (
    let i = 0;
    i < args.length;
    i++
  ) {
    const argument =
      args[i];

    if (
      argument === "--help" ||
      argument === "-h"
    ) {
      help = true;
      continue;
    }

    if (
      argument === "--apply"
    ) {
      applyChanges = true;
      continue;
    }

    if (
      argument ===
      "--write-metadata"
    ) {
      if (
        outputExplicit &&
        outputMode !==
          OUTPUT_MODES.METADATA
      ) {
        throw new Error(
          "--write-metadata conflicts with the selected --output mode"
        );
      }

      outputMode =
        OUTPUT_MODES.METADATA;

      outputExplicit =
        true;

      applyChanges =
        true;

      continue;
    }

    if (
      argument === "--rename"
    ) {
      if (
        outputExplicit &&
        outputMode !==
          OUTPUT_MODES.FILENAME
      ) {
        throw new Error(
          "--rename conflicts with the selected --output mode"
        );
      }

      outputMode =
        OUTPUT_MODES.FILENAME;

      outputExplicit =
        true;

      applyChanges =
        true;

      continue;
    }

    if (
      argument === "--output"
    ) {
      outputMode =
        requireOptionValue(
          args,
          i,
          "--output"
        ).toLowerCase();

      outputExplicit =
        true;

      i++;
      continue;
    }

    if (
      argument.startsWith(
        "--output="
      )
    ) {
      outputMode =
        argument
          .slice(
            "--output=".length
          )
          .toLowerCase();

      outputExplicit =
        true;

      continue;
    }

    if (
      argument === "--review"
    ) {
      review = true;
      continue;
    }

    if (
      argument === "--no-cache"
    ) {
      useCache = false;
      continue;
    }

    if (
      argument === "--benchmark"
    ) {
      benchmarkFile =
        requireOptionValue(
          args,
          i,
          "--benchmark"
        );

      i++;
      continue;
    }

    if (
      argument.startsWith(
        "--benchmark="
      )
    ) {
      benchmarkFile =
        argument.slice(
          "--benchmark=".length
        );

      continue;
    }

    if (
      argument === "--profile"
    ) {
      profileName =
        requireOptionValue(
          args,
          i,
          "--profile"
        ).toLowerCase();

      i++;
      continue;
    }

    if (
      argument.startsWith(
        "--profile="
      )
    ) {
      profileName =
        argument
          .slice(
            "--profile=".length
          )
          .toLowerCase();

      continue;
    }

    if (
      argument ===
      "--cache-file"
    ) {
      cacheFile =
        requireOptionValue(
          args,
          i,
          "--cache-file"
        );

      i++;
      continue;
    }

    if (
      argument.startsWith(
        "--cache-file="
      )
    ) {
      cacheFile =
        argument.slice(
          "--cache-file=".length
        );

      continue;
    }

    if (
      argument === "--csv" ||
      argument ===
        "--report-csv"
    ) {
      reportCsv =
        requireOptionValue(
          args,
          i,
          argument
        );

      i++;
      continue;
    }

    if (
      argument.startsWith(
        "--csv="
      )
    ) {
      reportCsv =
        argument.slice(
          "--csv=".length
        );

      continue;
    }

    if (
      argument.startsWith(
        "--report-csv="
      )
    ) {
      reportCsv =
        argument.slice(
          "--report-csv=".length
        );

      continue;
    }

    if (
      argument === "--json" ||
      argument ===
        "--report-json"
    ) {
      reportJson =
        requireOptionValue(
          args,
          i,
          argument
        );

      i++;
      continue;
    }

    if (
      argument.startsWith(
        "--json="
      )
    ) {
      reportJson =
        argument.slice(
          "--json=".length
        );

      continue;
    }

    if (
      argument.startsWith(
        "--report-json="
      )
    ) {
      reportJson =
        argument.slice(
          "--report-json=".length
        );

      continue;
    }

    if (
      argument.startsWith(
        "--"
      )
    ) {
      throw new Error(
        `Unknown option: ${argument}`
      );
    }

    explicitFolders.push(
      argument
    );
  }

  profileName =
    normalizeProfileName(
      profileName
    );

  if (
    !getTempoProfile(
      profileName
    )
  ) {
    throw new Error(
      `Unknown profile "${profileName}". Available profiles: ${Object.keys(
        TEMPO_PROFILES
      ).join(", ")}`
    );
  }

  if (
    !Object.values(
      OUTPUT_MODES
    ).includes(
      outputMode
    )
  ) {
    throw new Error(
      `Unknown output mode "${outputMode}". Available: ${Object.values(
        OUTPUT_MODES
      ).join(", ")}`
    );
  }

  if (
    benchmarkFile &&
    applyChanges
  ) {
    throw new Error(
      "--benchmark cannot be combined with a file-changing option"
    );
  }

  if (
    benchmarkFile &&
    review
  ) {
    throw new Error(
      "--benchmark and --review cannot be used together"
    );
  }

  const folders =
    explicitFolders.length > 0
      ? explicitFolders
      : [
          ...DEFAULT_MUSIC_FOLDERS,
        ];

  return {
    folders,

    // Backward-compatible convenience for older consumers.
    folder:
      folders[0] ??
      null,

    folderSource:
      explicitFolders.length >
      0
        ? "cli"
        : "environment",

    profile:
      getTempoProfile(
        profileName
      ),

    outputMode,
    applyChanges,
    benchmarkFile,
    review,
    cacheFile,
    useCache,
    reportCsv,
    reportJson,
    help,

    shouldRename:
      applyChanges &&
      (
        outputMode ===
          OUTPUT_MODES.FILENAME ||
        outputMode ===
          OUTPUT_MODES.BOTH
      ),
  };
}

module.exports = {
  printUsage,
  parseArguments,
};

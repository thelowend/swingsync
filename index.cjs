const fs = require("node:fs/promises");
const path = require("node:path");

const {
  parseArguments,
  printUsage,
} = require("./src/cli/arguments.cjs");

const {
  runBenchmark,
} = require("./src/cli/benchmark.cjs");

const {
  runFolder,
} = require("./src/app/run-folder.cjs");

const {
  runReview,
} = require("./src/app/run-review.cjs");

const {
  AnalysisCache,
} = require("./src/cache/analysis-cache.cjs");

const {
  resolveDefaultCachePath,
} = require("./src/cache/cache-path.cjs");

const {
  PRODUCT_NAME,
} = require("./src/branding.cjs");

const {
  buildBenchmarkReportRow,
} = require("./src/reporting/records.cjs");

const {
  writeAnalysisReports,
  writeBenchmarkReports,
} = require("./src/reporting/writers.cjs");

async function requireDirectory(
  folder
) {
  const stats =
    await fs.stat(folder);

  if (!stats.isDirectory()) {
    throw new Error(
      `"${folder}" is not a directory.`
    );
  }
}

async function requireFile(
  filePath
) {
  const stats =
    await fs.stat(filePath);

  if (!stats.isFile()) {
    throw new Error(
      `"${filePath}" is not a file.`
    );
  }
}

function benchmarkSummary(
  results
) {
  const completed =
    results.filter(
      (result) =>
        !result.error
    );

  const correct =
    completed.filter(
      (result) =>
        result.classification ===
        "correct"
    );

  return {
    tracksConfigured:
      results.length,
    completed:
      completed.length,
    errors:
      results.length -
      completed.length,
    correct:
      correct.length,
    accuracyPercent:
      completed.length > 0
        ? (correct.length /
            completed.length) *
          100
        : 0,
  };
}

function printCacheSummary(
  cacheStats
) {
  console.log(
    "=================================================="
  );
  console.log("CACHE");
  console.log(
    "=================================================="
  );

  if (!cacheStats.enabled) {
    console.log(
      "Cache:                    disabled"
    );
    console.log(
      `Computed/bypassed:         ${cacheStats.bypassed}`
    );
    console.log();
    return;
  }

  console.log(
    `Cache file:               ${cacheStats.filePath}`
  );
  console.log(
    `Cache hits:               ${cacheStats.hits}`
  );
  console.log(
    `Cache misses:             ${cacheStats.misses}`
  );
  console.log(
    `Stale entries:            ${cacheStats.stale}`
  );
  console.log(
    `Computed:                 ${cacheStats.computed}`
  );
  console.log(
    `Cache entries:            ${cacheStats.entries}`
  );

  console.log();
}

function printWrittenReports(
  written
) {
  if (
    !written ||
    written.length === 0
  ) {
    return;
  }

  console.log(
    "Reports:"
  );

  for (const report of written) {
    console.log(
      `  ${report.type.toUpperCase().padEnd(
        5
      )} ${report.path}`
    );
  }

  console.log();
}

async function main() {
  let cli;

  try {
    cli =
      parseArguments(
        process.argv.slice(2)
      );
  } catch (error) {
    console.error(
      error.message
    );
    console.log();
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (cli.help) {
    printUsage();
    return;
  }

  if (!cli.folder) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const folder =
    path.resolve(cli.folder);

  try {
    await requireDirectory(
      folder
    );
  } catch (error) {
    console.error(
      `Could not open folder: ${error.message}`
    );
    process.exitCode = 1;
    return;
  }

  const defaultCache =
    cli.cacheFile
      ? null
      : await resolveDefaultCachePath();

  const cachePath =
    cli.cacheFile
      ? path.resolve(
          cli.cacheFile
        )
      : defaultCache.filePath;

  if (
    defaultCache?.migratedFrom
  ) {
    console.log(
      `${PRODUCT_NAME}: migrated legacy cache from ` +
        `${defaultCache.migratedFrom} to ${cachePath}`
    );
    console.log();
  }

  const cache =
    await AnalysisCache.open({
      enabled: cli.useCache,
      filePath: cachePath,
    });

  if (
    cache.loadWarning
  ) {
    console.warn(
      `WARNING: ${cache.loadWarning}`
    );
    console.log();
  }

  console.log(
    cli.useCache
      ? `Cache: enabled (${cachePath})`
      : "Cache: disabled"
  );

  console.log();

  let writtenReports = [];

  try {
    if (
      cli.benchmarkFile
    ) {
      const benchmarkPath =
        path.resolve(
          cli.benchmarkFile
        );

      try {
        await requireFile(
          benchmarkPath
        );
      } catch (error) {
        console.error(
          `Could not open benchmark file: ${error.message}`
        );
        process.exitCode = 1;
        return;
      }

      const results =
        await runBenchmark(
          folder,
          benchmarkPath,
          cli.profile.name,
          cache
        );

      await cache.flush();

      const cacheStats =
        cache.getStats();

      if (
        cli.reportCsv ||
        cli.reportJson
      ) {
        const reportRecords =
          results.map(
            buildBenchmarkReportRow
          );

        writtenReports =
          await writeBenchmarkReports({
            csvPath:
              cli.reportCsv,
            jsonPath:
              cli.reportJson,
            folder,
            benchmarkFile:
              benchmarkPath,
            records:
              reportRecords,
            summary:
              benchmarkSummary(
                results
              ),
            cache:
              cacheStats,
          });
      }

      printCacheSummary(
        cacheStats
      );
      printWrittenReports(
        writtenReports
      );

      return;
    }

    const result =
      cli.review
        ? await runReview({
            folder,
            cli,
            cache,
          })
        : await runFolder(
            folder,
            cli,
            cache
          );

    await cache.flush();

    const cacheStats =
      cache.getStats();

    if (
      cli.reportCsv ||
      cli.reportJson
    ) {
      writtenReports =
        await writeAnalysisReports({
          csvPath:
            cli.reportCsv,
          jsonPath:
            cli.reportJson,
          folder,
          profile:
            cli.profile.name,
          records:
            result.records,
          summary:
            result.summary,
          cache:
            cacheStats,
          mode:
            cli.review
              ? "review"
              : "analysis",
        });
    }

    printCacheSummary(
      cacheStats
    );
    printWrittenReports(
      writtenReports
    );
  } finally {
    // If a run throws partway through, preserve any successfully computed
    // cache entries before letting the error propagate.
    await cache.flush();
  }
}

main().catch((error) => {
  console.error(
    "Fatal error:",
    error
  );
  process.exitCode = 1;
});

const fs = require("node:fs/promises");
const path = require("node:path");

const ANALYSIS_CSV_COLUMNS = [
  "file",
  "rootFolder",
  "relativePath",
  "fullPath",
  "status",
  "profile",
  "analysisSource",
  "detectedBpm",
  "detectionConfidence",
  "detectionScore",
  "detectionMaximumScore",
  "interpretedBpm",
  "interpretationConfidence",
  "adjusted",
  "adjustment",
  "relationship",
  "autoApply",
  "existingMetadataBpm",
  "outputMode",
  "outputApplied",
  "outputStatus",
  "metadataSupported",
  "metadataWritten",
  "metadataUnchanged",
  "metadataWrittenBpm",
  "metadataReason",
  "finalPath",
  "proposedFilename",
  "reviewAction",
  "reviewedBpm",
  "reviewSource",
  "reviewAccepted",
  "rhythmBpm",
  "percivalBpm",
  "beatMedianBpm",
  "beatVariationPercent",
  "beatsDetected",
  "onsetsDetected",
  "onsetRate",
  "midpointOnsetRatio",
  "rhythmConfidence",
  "histogramPeak1Bpm",
  "histogramPeak1Weight",
  "histogramPeak2Bpm",
  "histogramPeak2Weight",
  "doubleEvidenceScore",
  "doubleEvidenceMaximum",
  "doubleEvidenceRequired",
  "reason",
  "error",
];

const BENCHMARK_CSV_COLUMNS = [
  "file",
  "expectedBpm",
  "profile",
  "analysisSource",
  "detectedBpm",
  "interpretedBpm",
  "detectionConfidence",
  "interpretationConfidence",
  "adjusted",
  "adjustment",
  "absoluteError",
  "percentError",
  "classification",
  "doubleEvidenceScore",
  "doubleEvidenceMaximum",
  "midpointOnsetRatio",
  "rhythmConfidence",
  "histogramDominance",
  "notes",
  "error",
];

function csvValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  const stringValue =
    String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return (
      '"' +
      stringValue.replace(
        /"/g,
        '""'
      ) +
      '"'
    );
  }

  return stringValue;
}

function rowsToCsv(
  rows,
  columns
) {
  const output = [
    columns
      .map(csvValue)
      .join(","),
  ];

  for (const row of rows) {
    output.push(
      columns
        .map((column) =>
          csvValue(row[column])
        )
        .join(",")
    );
  }

  return output.join("\n") + "\n";
}

async function ensureParent(
  filePath
) {
  await fs.mkdir(
    path.dirname(
      path.resolve(filePath)
    ),
    { recursive: true }
  );
}

async function writeCsv(
  filePath,
  rows,
  columns
) {
  const absolutePath =
    path.resolve(filePath);

  await ensureParent(
    absolutePath
  );

  await fs.writeFile(
    absolutePath,
    rowsToCsv(
      rows,
      columns
    ),
    "utf8"
  );

  return absolutePath;
}

async function writeJson(
  filePath,
  payload
) {
  const absolutePath =
    path.resolve(filePath);

  await ensureParent(
    absolutePath
  );

  await fs.writeFile(
    absolutePath,
    JSON.stringify(
      payload,
      null,
      2
    ) + "\n",
    "utf8"
  );

  return absolutePath;
}

async function writeAnalysisReports({
  csvPath,
  jsonPath,
  folder = null,
  folders = null,
  profile,
  records,
  summary,
  cache,
  mode = "analysis",
}) {
  const written = [];

  if (csvPath) {
    written.push({
      type: "csv",
      path:
        await writeCsv(
          csvPath,
          records,
          ANALYSIS_CSV_COLUMNS
        ),
    });
  }

  if (jsonPath) {
    written.push({
      type: "json",
      path:
        await writeJson(
          jsonPath,
          {
            generatedAt:
              new Date().toISOString(),
            mode,
            folder:
              folder ??
              folders?.[0] ??
              null,
            folders:
              folders ??
              (folder
                ? [folder]
                : []),
            profile,
            summary,
            cache,
            tracks: records,
          }
        ),
    });
  }

  return written;
}

async function writeBenchmarkReports({
  csvPath,
  jsonPath,
  folder = null,
  folders = null,
  benchmarkFile,
  records,
  summary,
  cache,
}) {
  const written = [];

  if (csvPath) {
    written.push({
      type: "csv",
      path:
        await writeCsv(
          csvPath,
          records,
          BENCHMARK_CSV_COLUMNS
        ),
    });
  }

  if (jsonPath) {
    written.push({
      type: "json",
      path:
        await writeJson(
          jsonPath,
          {
            generatedAt:
              new Date().toISOString(),
            mode: "benchmark",
            folder:
              folder ??
              folders?.[0] ??
              null,
            folders:
              folders ??
              (folder
                ? [folder]
                : []),
            benchmarkFile,
            summary,
            cache,
            tracks: records,
          }
        ),
    });
  }

  return written;
}

module.exports = {
  ANALYSIS_CSV_COLUMNS,
  BENCHMARK_CSV_COLUMNS,
  rowsToCsv,
  writeAnalysisReports,
  writeBenchmarkReports,
};

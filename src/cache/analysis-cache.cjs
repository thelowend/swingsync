const fs = require("node:fs/promises");
const path = require("node:path");

const {
  ANALYZER_VERSION,
  CACHE_SCHEMA_VERSION,
} = require("../config.cjs");

const AUTO_FLUSH_EVERY = 25;

function normalizePath(filePath) {
  return path.resolve(filePath);
}

function fingerprintFromStats(stats) {
  return {
    size: stats.size,
    mtimeMs: Math.round(stats.mtimeMs),
  };
}

function fingerprintsMatch(a, b) {
  return Boolean(
    a &&
      b &&
      a.size === b.size &&
      a.mtimeMs === b.mtimeMs
  );
}

class AnalysisCache {
  constructor({
    enabled = true,
    filePath,
  }) {
    this.enabled = enabled;
    this.filePath = path.resolve(filePath);

    this.entries = {};
    this.dirty = false;
    this.writesSinceFlush = 0;

    this.stats = {
      hits: 0,
      misses: 0,
      stale: 0,
      computed: 0,
      bypassed: 0,
      writes: 0,
    };

    this.loadWarning = null;
  }

  static async open(options) {
    const cache = new AnalysisCache(options);

    if (cache.enabled) {
      await cache.load();
    }

    return cache;
  }

  async load() {
    try {
      const contents = await fs.readFile(
        this.filePath,
        "utf8"
      );

      const parsed = JSON.parse(contents);

      if (
        parsed.schemaVersion !==
        CACHE_SCHEMA_VERSION
      ) {
        this.entries = {};
        this.loadWarning =
          `Cache schema ${parsed.schemaVersion ?? "unknown"} does not match ` +
          `${CACHE_SCHEMA_VERSION}; starting with an empty cache.`;
        return;
      }

      this.entries =
        parsed.entries &&
        typeof parsed.entries === "object"
          ? parsed.entries
          : {};
    } catch (error) {
      if (error.code === "ENOENT") {
        this.entries = {};
        return;
      }

      // Cache is an optimization, not authoritative data. A malformed or
      // unreadable cache should never prevent audio analysis from running.
      this.entries = {};
      this.loadWarning =
        `Could not load cache "${this.filePath}": ${error.message}. ` +
        "Starting with an empty cache.";
    }
  }

  async getOrAnalyze(
    filePath,
    analyzer
  ) {
    const absolutePath =
      normalizePath(filePath);

    if (!this.enabled) {
      this.stats.bypassed++;

      return {
        analysis:
          await analyzer(absolutePath),
        source: "computed",
        cacheHit: false,
      };
    }

    const fileStats =
      await fs.stat(absolutePath);

    const fingerprint =
      fingerprintFromStats(
        fileStats
      );

    const cached =
      this.entries[absolutePath];

    if (
      cached &&
      cached.analyzerVersion ===
        ANALYZER_VERSION &&
      fingerprintsMatch(
        cached.fingerprint,
        fingerprint
      ) &&
      cached.analysis
    ) {
      this.stats.hits++;

      return {
        analysis: cached.analysis,
        source: "cache",
        cacheHit: true,
      };
    }

    if (cached) {
      this.stats.stale++;
    } else {
      this.stats.misses++;
    }

    const analysis =
      await analyzer(absolutePath);

    this.stats.computed++;

    this.entries[absolutePath] = {
      analyzerVersion:
        ANALYZER_VERSION,
      fingerprint,
      cachedAt:
        new Date().toISOString(),
      analysis,
    };

    this.dirty = true;
    this.stats.writes++;
    this.writesSinceFlush++;

    if (
      this.writesSinceFlush >=
      AUTO_FLUSH_EVERY
    ) {
      await this.flush();
    }

    return {
      analysis,
      source: "computed",
      cacheHit: false,
    };
  }

  async refreshFingerprint(
    filePath
  ) {
    if (!this.enabled) {
      return;
    }

    const absolutePath =
      normalizePath(
        filePath
      );

    const cached =
      this.entries[
        absolutePath
      ];

    if (!cached) {
      return;
    }

    const stats =
      await fs.stat(
        absolutePath
      );

    cached.fingerprint =
      fingerprintFromStats(
        stats
      );

    cached.cachedAt =
      new Date().toISOString();

    this.dirty = true;
  }

  async moveEntry(
    oldPath,
    newPath
  ) {
    if (!this.enabled) {
      return;
    }

    const oldAbsolute =
      normalizePath(
        oldPath
      );

    const newAbsolute =
      normalizePath(
        newPath
      );

    const cached =
      this.entries[
        oldAbsolute
      ];

    if (!cached) {
      return;
    }

    const stats =
      await fs.stat(
        newAbsolute
      );

    this.entries[
      newAbsolute
    ] = {
      ...cached,
      fingerprint:
        fingerprintFromStats(
          stats
        ),
      cachedAt:
        new Date().toISOString(),
    };

    delete this.entries[
      oldAbsolute
    ];

    this.dirty = true;
  }

  async flush() {
    if (
      !this.enabled ||
      !this.dirty
    ) {
      return;
    }

    await fs.mkdir(
      path.dirname(this.filePath),
      { recursive: true }
    );

    const payload = {
      schemaVersion:
        CACHE_SCHEMA_VERSION,
      analyzerVersion:
        ANALYZER_VERSION,
      updatedAt:
        new Date().toISOString(),
      entries: this.entries,
    };

    await fs.writeFile(
      this.filePath,
      JSON.stringify(
        payload,
        null,
        2
      ) + "\n",
      "utf8"
    );

    this.dirty = false;
    this.writesSinceFlush = 0;
  }

  getStats() {
    return {
      enabled: this.enabled,
      filePath:
        this.enabled
          ? this.filePath
          : null,
      analyzerVersion:
        ANALYZER_VERSION,
      loadWarning:
        this.loadWarning,
      ...this.stats,
      entries:
        Object.keys(
          this.entries
        ).length,
    };
  }
}

module.exports = {
  AnalysisCache,
};

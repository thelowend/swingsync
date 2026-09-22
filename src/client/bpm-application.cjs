const fs = require("node:fs/promises");
const path = require("node:path");
const {
  EventEmitter,
} = require("node:events");

const {
  AnalysisCache,
} = require("../cache/analysis-cache.cjs");

const {
  resolveDefaultCachePath,
} = require("../cache/cache-path.cjs");

const {
  PRODUCT_NAME,
  PACKAGE_NAME,
  CLI_COMMAND,
} = require("../branding.cjs");

const {
  TEMPO_PROFILES,
  DEFAULT_PROFILE,
} = require("../tempo/profiles.cjs");

const {
  DEFAULT_MUSIC_FOLDERS,
  MUSIC_FOLDERS_ENV_VAR,
  resolveMusicFolders,
} = require("../config.cjs");

const {
  OUTPUT_MODES,
  validateOutputMode,
} = require("../app/apply-bpm-output.cjs");

const {
  createReviewItem,
  createReviewDecision,
  applyReviewDecision,
} = require("../review/review-service.cjs");

const {
  interpretTempo,
} = require("../tempo/interpreter.cjs");

const {
  APPLICATION_STATUS,
  TRACK_STATUS,
  cloneSerializable,
  createInitialState,
  createTrackState,
  projectTrackResult,
  calculateSummary,
} = require("./state-model.cjs");

function createDefaultServices() {
  // Kept lazy so importing the public client API does not eagerly initialize
  // Essentia/WASM. A visual shell can load the application module before a
  // library is opened.
  return {
    findAudioFilesInFolders:
      require("../files/scanner.cjs")
        .findAudioFilesInFolders,

    analyzeTrack:
      require("../app/analyze-track.cjs")
        .analyzeTrack,

    applyBpmOutput:
      require("../app/apply-bpm-output.cjs")
        .applyBpmOutput,
  };
}

function resolveProfile(
  profile
) {
  const name =
    typeof profile ===
      "string"
      ? profile
      : profile?.name;

  const resolved =
    TEMPO_PROFILES[
      name ??
      DEFAULT_PROFILE
    ];

  if (!resolved) {
    throw new Error(
      `Unknown profile "${name}". Available profiles: ${Object.keys(
        TEMPO_PROFILES
      ).join(", ")}`
    );
  }

  return resolved;
}

async function requireDirectory(
  folder
) {
  const stats =
    await fs.stat(
      folder
    );

  if (
    !stats.isDirectory()
  ) {
    throw new Error(
      `"${folder}" is not a directory`
    );
  }
}

async function requireDirectories(
  folders
) {
  for (
    const folder of folders
  ) {
    await requireDirectory(
      folder
    );
  }
}

class BpmApplication
  extends EventEmitter {
  constructor({
    cache,
    services = null,
  }) {
    super();

    if (!cache) {
      throw new Error(
        "BpmApplication requires a cache instance"
      );
    }

    this.cache = cache;
    this.services =
      services ??
      createDefaultServices();

    this.state =
      createInitialState({
        cache:
          cache.getStats(),
      });

    this.trackResults =
      new Map();

    this.trackIdsByFile =
      new Map();

    this.nextTrackNumber = 1;
  }

  static async create({
    cache = null,
    cacheFile = null,
    useCache = true,
    services = null,
  } = {}) {
    const defaultCache =
      cache || cacheFile
        ? null
        : await resolveDefaultCachePath();

    const resolvedCache =
      cache ??
      (await AnalysisCache.open({
        enabled:
          useCache,
        filePath:
          cacheFile
            ? path.resolve(
                cacheFile
              )
            : defaultCache.filePath,
      }));

    return new BpmApplication({
      cache:
        resolvedCache,
      services,
    });
  }

  getState() {
    return cloneSerializable(
      this.state
    );
  }

  getTracks({
    reviewOnly = false,
    status = null,
  } = {}) {
    return cloneSerializable(
      this.state.tracks.filter(
        (track) => {
          if (
            reviewOnly &&
            !track.review.required
          ) {
            return false;
          }

          if (
            status &&
            track.status !==
              status
          ) {
            return false;
          }

          return true;
        }
      )
    );
  }

  getTrack(
    trackId
  ) {
    const track =
      this.getTrackState(
        trackId
      );

    return cloneSerializable(
      track
    );
  }

  getTrackDetails(
    trackId
  ) {
    const result =
      this.trackResults.get(
        trackId
      );

    if (!result) {
      return null;
    }

    const state =
      this.getTrackState(
        trackId
      );

    return cloneSerializable({
      state,
      reviewItem:
        result.needsReview
          ? createReviewItem(
              result
            )
          : null,
      analysis:
        result.analysis,
      metadata:
        result.metadata,
      detection:
        result.detection,
      interpretation:
        result.interpretation,
      review:
        result.review ??
        null,
      output:
        result.outputResult ??
        null,
    });
  }

  getReviewQueue() {
    const items = [];

    for (
      const track of
      this.state.tracks
    ) {
      if (
        !track.review.required ||
        track.status !==
          TRACK_STATUS.ANALYZED
      ) {
        continue;
      }

      const result =
        this.trackResults.get(
          track.id
        );

      if (!result) {
        continue;
      }

      items.push(
        createReviewItem(
          result
        )
      );
    }

    return cloneSerializable(
      items
    );
  }

  getCapabilities() {
    return {
      product: {
        name:
          PRODUCT_NAME,
        packageName:
          PACKAGE_NAME,
        cliCommand:
          CLI_COMMAND,
      },

      configuration: {
        musicFoldersEnvironmentVariable:
          MUSIC_FOLDERS_ENV_VAR,
        defaultMusicFolders:
          [
            ...DEFAULT_MUSIC_FOLDERS,
          ],
      },

      profiles:
        Object.values(
          TEMPO_PROFILES
        ).map(
          (profile) => ({
            name:
              profile.name,
            description:
              profile.description,
          })
        ),

      outputModes:
        Object.values(
          OUTPUT_MODES
        ),

      reviewActions: [
        "use-detected",
        "use-suggested",
        "use-custom",
        "skip",
      ],

      events: [
        "state",
        "progress",
        "track",
        "review",
        "output",
        "error",
      ],
    };
  }

  async openLibrary({
    folder = null,
    folders = null,
    profile =
      DEFAULT_PROFILE,
    outputMode =
      OUTPUT_MODES.METADATA,
  } = {}) {
    this.assertNotClosed();

    const requestedFolders =
      folders ??
      (
        folder
          ? [folder]
          : DEFAULT_MUSIC_FOLDERS
      );

    const absoluteFolders =
      resolveMusicFolders(
        requestedFolders
      );

    if (
      absoluteFolders.length ===
      0
    ) {
      throw new Error(
        `No music folders were provided and ${MUSIC_FOLDERS_ENV_VAR} is empty`
      );
    }

    await requireDirectories(
      absoluteFolders
    );

    const resolvedProfile =
      resolveProfile(
        profile
      );

    validateOutputMode(
      outputMode
    );

    this.setApplicationStatus(
      APPLICATION_STATUS.LIBRARY_OPEN
    );

    this.state.library = {
      folders:
        absoluteFolders,
      // Compatibility for older clients expecting a single folder.
      folder:
        absoluteFolders[0] ??
        null,
      profile:
        resolvedProfile.name,
      outputMode,
    };

    this.state.progress = {
      phase: "scanning",
      total: 0,
      completed: 0,
      failed: 0,
      currentTrackId: null,
      currentFile: null,
    };

    this.trackResults.clear();
    this.trackIdsByFile.clear();
    this.nextTrackNumber = 1;

    this.emitProgress();

    try {
      const entries =
        await this.services
          .findAudioFilesInFolders(
            absoluteFolders
          );

      this.state.tracks =
        entries.map(
          ({
            file,
            rootFolder,
          }) => {
            const id =
              this.allocateTrackId();

            const track =
              createTrackState({
                id,
                file,
                folder:
                  rootFolder,
              });

            this.trackIdsByFile.set(
              path.resolve(
                file
              ),
              id
            );

            return track;
          }
        );

      this.state.progress = {
        phase: "idle",
        total:
          entries.length,
        completed: 0,
        failed: 0,
        currentTrackId: null,
        currentFile: null,
      };

      this.recalculate();
      this.emitState();

      return this.getState();
    } catch (error) {
      this.handleError(
        error
      );

      throw error;
    }
  }

  async analyzeAll() {
    this.assertLibraryOpen();

    const ids =
      this.state.tracks.map(
        (track) =>
          track.id
      );

    this.setApplicationStatus(
      APPLICATION_STATUS.ANALYZING
    );

    this.state.progress = {
      phase: "analysis",
      total:
        ids.length,
      completed: 0,
      failed: 0,
      currentTrackId: null,
      currentFile: null,
    };

    this.emitState();

    for (
      const id of ids
    ) {
      try {
        await this.analyzeOne(
          id,
          {
            preservePhase: true,
          }
        );
      } catch {
        // analyzeOne already records and emits the per-track error.
      }
    }

    this.state.progress = {
      ...this.state.progress,
      phase: "idle",
      currentTrackId: null,
      currentFile: null,
    };

    this.setApplicationStatus(
      APPLICATION_STATUS.READY
    );

    await this.cache.flush();
    this.refreshCacheStats();
    this.recalculate();
    this.emitProgress();
    this.emitState();

    return this.getState();
  }

  async analyzeOne(
    trackId,
    {
      preservePhase = false,
    } = {}
  ) {
    this.assertLibraryOpen();

    const track =
      this.getTrackState(
        trackId
      );

    const profile =
      resolveProfile(
        this.state.library
          .profile
      );

    if (!preservePhase) {
      this.setApplicationStatus(
        APPLICATION_STATUS.ANALYZING
      );
    }

    this.updateTrack(
      trackId,
      {
        ...track,
        status:
          TRACK_STATUS.ANALYZING,
        error: null,
      }
    );

    this.state.progress = {
      ...this.state.progress,
      phase: "analysis",
      currentTrackId:
        trackId,
      currentFile:
        track.file,
    };

    this.emitProgress();
    this.emitTrack(
      trackId
    );

    try {
      const result =
        await this.services
          .analyzeTrack({
            file:
              track.file,
            profile,
            cache:
              this.cache,
          });

      this.trackResults.set(
        trackId,
        result
      );

      const projected =
        projectTrackResult({
          trackState:
            this.getTrackState(
              trackId
            ),
          trackResult:
            result,
        });

      this.updateTrack(
        trackId,
        projected
      );

      this.state.progress = {
        ...this.state.progress,
        completed:
          this.state.progress
            .completed +
          1,
      };

      this.refreshCacheStats();
      this.recalculate();

      this.emitTrack(
        trackId
      );
      this.emitProgress();

      if (
        !preservePhase
      ) {
        this.state.progress = {
          ...this.state.progress,
          phase: "idle",
          currentTrackId:
            null,
          currentFile:
            null,
        };

        this.setApplicationStatus(
          APPLICATION_STATUS.READY
        );

        this.emitState();
      }

      return this.getTrackDetails(
        trackId
      );
    } catch (error) {
      const current =
        this.getTrackState(
          trackId
        );

      this.updateTrack(
        trackId,
        {
          ...current,
          status:
            TRACK_STATUS.ERROR,
          error:
            error.message,
        }
      );

      this.state.progress = {
        ...this.state.progress,
        failed:
          this.state.progress
            .failed +
          1,
      };

      this.recalculate();

      this.emitTrack(
        trackId
      );
      this.emitProgress();
      this.emit(
        "error",
        {
          trackId,
          file:
            track.file,
          message:
            error.message,
        }
      );

      if (
        !preservePhase
      ) {
        this.setApplicationStatus(
          APPLICATION_STATUS.READY
        );
        this.emitState();
      }

      throw error;
    }
  }

  setProfile(
    profile
  ) {
    this.assertLibraryOpen();

    const resolved =
      resolveProfile(
        profile
      );

    this.state.library.profile =
      resolved.name;

    for (
      const track of
      this.state.tracks
    ) {
      const result =
        this.trackResults.get(
          track.id
        );

      if (
        !result ||
        !result.analysis ||
        !result.detection
      ) {
        continue;
      }

      const interpretation =
        interpretTempo(
          result.detection,
          result.analysis,
          resolved
        );

      const updatedResult = {
        ...result,
        interpretation,
        needsReview:
          !Number.isFinite(
            interpretation.bpm
          ) ||
          !interpretation.autoApply,
        review: null,
        outputResult:
          null,
      };

      this.trackResults.set(
        track.id,
        updatedResult
      );

      this.updateTrack(
        track.id,
        projectTrackResult({
          trackState:
            track,
          trackResult:
            updatedResult,
        })
      );
    }

    this.recalculate();
    this.emitState();

    return this.getState();
  }

  setOutputMode(
    outputMode
  ) {
    this.assertLibraryOpen();

    validateOutputMode(
      outputMode
    );

    this.state.library.outputMode =
      outputMode;

    this.emitState();

    return this.getState();
  }

  submitReview({
    trackId,
    action,
    customBpm = null,
  }) {
    this.assertLibraryOpen();

    const result =
      this.requireTrackResult(
        trackId
      );

    if (
      !result.needsReview
    ) {
      throw new Error(
        "This track does not require review"
      );
    }

    const item =
      createReviewItem(
        result
      );

    const decision =
      createReviewDecision({
        item,
        action,
        customBpm,
      });

    const resolved =
      applyReviewDecision(
        result,
        decision
      );

    this.trackResults.set(
      trackId,
      resolved
    );

    this.updateTrack(
      trackId,
      projectTrackResult({
        trackState:
          this.getTrackState(
            trackId
          ),
        trackResult:
          resolved,
        review:
          resolved.review,
      })
    );

    this.recalculate();

    const payload = {
      trackId,
      decision:
        cloneSerializable(
          resolved.review
        ),
      track:
        this.getTrack(
          trackId
        ),
    };

    this.emit(
      "review",
      payload
    );

    this.emitState();

    return payload;
  }

  clearReview(
    trackId
  ) {
    const result =
      this.requireTrackResult(
        trackId
      );

    const cleared = {
      ...result,
      review: null,
    };

    this.trackResults.set(
      trackId,
      cleared
    );

    this.updateTrack(
      trackId,
      projectTrackResult({
        trackState:
          this.getTrackState(
            trackId
          ),
        trackResult:
          cleared,
        review: null,
      })
    );

    this.recalculate();
    this.emitTrack(
      trackId
    );
    this.emitState();

    return this.getTrack(
      trackId
    );
  }

  async applyTrack(
    trackId,
    {
      applyChanges = true,
    } = {}
  ) {
    this.assertLibraryOpen();

    const result =
      this.requireTrackResult(
        trackId
      );

    const selectedBpm =
      this.resolveSelectedBpm(
        result
      );

    if (
      !Number.isFinite(
        selectedBpm
      )
    ) {
      throw new Error(
        "This track does not have an approved BPM to apply"
      );
    }

    this.setApplicationStatus(
      APPLICATION_STATUS.APPLYING
    );

    const outputResult =
      await this.services
        .applyBpmOutput({
          file:
            result.file,
          bpm:
            selectedBpm,
          outputMode:
            this.state.library
              .outputMode,
          applyChanges,
          existingMetadata:
            result.metadata,
          cache:
            this.cache,
        });

    const updatedResult = {
      ...result,
      outputResult,
      file:
        outputResult.finalPath ??
        result.file,
    };

    this.trackResults.set(
      trackId,
      updatedResult
    );

    const projected =
      projectTrackResult({
        trackState:
          this.getTrackState(
            trackId
          ),
        trackResult:
          updatedResult,
        review:
          updatedResult.review ??
          null,
        outputResult,
      });

    this.updateTrack(
      trackId,
      projected
    );

    this.recalculate();
    this.refreshCacheStats();

    const payload = {
      trackId,
      bpm:
        selectedBpm,
      result:
        cloneSerializable(
          outputResult
        ),
      track:
        this.getTrack(
          trackId
        ),
    };

    this.emit(
      "output",
      payload
    );

    this.setApplicationStatus(
      APPLICATION_STATUS.READY
    );
    this.emitState();

    return payload;
  }

  async applyAllApproved({
    applyChanges = true,
  } = {}) {
    this.assertLibraryOpen();

    const eligible =
      this.state.tracks
        .filter(
          (track) => {
            if (
              track.status !==
              TRACK_STATUS.ANALYZED
            ) {
              return false;
            }

            const result =
              this.trackResults.get(
                track.id
              );

            if (!result) {
              return false;
            }

            return Number.isFinite(
              this.resolveSelectedBpm(
                result
              )
            );
          }
        )
        .map(
          (track) =>
            track.id
        );

    this.setApplicationStatus(
      APPLICATION_STATUS.APPLYING
    );

    this.state.progress = {
      phase: "output",
      total:
        eligible.length,
      completed: 0,
      failed: 0,
      currentTrackId: null,
      currentFile: null,
    };

    this.emitProgress();

    const results = [];

    for (
      const trackId of
      eligible
    ) {
      const track =
        this.getTrackState(
          trackId
        );

      this.state.progress = {
        ...this.state.progress,
        currentTrackId:
          trackId,
        currentFile:
          track.file,
      };

      this.emitProgress();

      try {
        const output =
          await this.applyTrack(
            trackId,
            {
              applyChanges,
            }
          );

        results.push(
          output
        );

        this.state.progress = {
          ...this.state.progress,
          completed:
            this.state.progress
              .completed +
            1,
        };
      } catch (error) {
        results.push({
          trackId,
          error:
            error.message,
        });

        this.state.progress = {
          ...this.state.progress,
          failed:
            this.state.progress
              .failed +
            1,
        };

        this.emit(
          "error",
          {
            trackId,
            file:
              track.file,
            message:
              error.message,
          }
        );
      }

      this.emitProgress();
    }

    await this.cache.flush();
    this.refreshCacheStats();

    this.state.progress = {
      ...this.state.progress,
      phase: "idle",
      currentTrackId: null,
      currentFile: null,
    };

    this.setApplicationStatus(
      APPLICATION_STATUS.READY
    );

    this.recalculate();
    this.emitProgress();
    this.emitState();

    return cloneSerializable(
      results
    );
  }

  async close() {
    if (
      this.state.status ===
      APPLICATION_STATUS.CLOSED
    ) {
      return;
    }

    await this.cache.flush();
    this.refreshCacheStats();

    this.state.status =
      APPLICATION_STATUS.CLOSED;
    this.state.progress = {
      ...this.state.progress,
      phase: "idle",
      currentTrackId: null,
      currentFile: null,
    };

    this.emitState();
    this.removeAllListeners();
  }

  resolveSelectedBpm(
    result
  ) {
    if (
      result.review
        ?.skipped
    ) {
      return null;
    }

    if (
      Number.isFinite(
        result.review
          ?.selectedBpm
      )
    ) {
      return result.review
        .selectedBpm;
    }

    if (
      !result.needsReview &&
      result.interpretation
        ?.autoApply &&
      Number.isFinite(
        result.interpretation
          ?.bpm
      )
    ) {
      return result.interpretation
        .bpm;
    }

    return null;
  }

  allocateTrackId() {
    const id =
      `track-${this.nextTrackNumber}`;

    this.nextTrackNumber++;

    return id;
  }

  getTrackState(
    trackId
  ) {
    const track =
      this.state.tracks.find(
        (candidate) =>
          candidate.id ===
          trackId
      );

    if (!track) {
      throw new Error(
        `Unknown track: ${trackId}`
      );
    }

    return track;
  }

  requireTrackResult(
    trackId
  ) {
    this.getTrackState(
      trackId
    );

    const result =
      this.trackResults.get(
        trackId
      );

    if (!result) {
      throw new Error(
        "Track has not been analyzed yet"
      );
    }

    return result;
  }

  updateTrack(
    trackId,
    next
  ) {
    const index =
      this.state.tracks.findIndex(
        (track) =>
          track.id ===
          trackId
      );

    if (index < 0) {
      throw new Error(
        `Unknown track: ${trackId}`
      );
    }

    this.state.tracks[
      index
    ] = next;
  }

  recalculate() {
    this.state.summary =
      calculateSummary(
        this.state.tracks
      );

    this.refreshCacheStats();
  }

  refreshCacheStats() {
    this.state.cache =
      this.cache.getStats();
  }

  setApplicationStatus(
    status
  ) {
    this.state.status =
      status;
  }

  assertNotClosed() {
    if (
      this.state.status ===
      APPLICATION_STATUS.CLOSED
    ) {
      throw new Error(
        "Application session is closed"
      );
    }
  }

  assertLibraryOpen() {
    this.assertNotClosed();

    if (
      !this.state.library
        .folder
    ) {
      throw new Error(
        "Open a library first"
      );
    }
  }

  handleError(
    error
  ) {
    this.state.status =
      APPLICATION_STATUS.ERROR;
    this.state.lastError =
      error.message;

    this.emit(
      "error",
      {
        message:
          error.message,
      }
    );

    this.emitState();
  }

  emitState() {
    this.emit(
      "state",
      this.getState()
    );
  }

  emitProgress() {
    this.emit(
      "progress",
      cloneSerializable(
        this.state.progress
      )
    );
  }

  emitTrack(
    trackId
  ) {
    this.emit(
      "track",
      {
        trackId,
        track:
          this.getTrack(
            trackId
          ),
      }
    );
  }
}

module.exports = {
  BpmApplication,
  resolveProfile,
};

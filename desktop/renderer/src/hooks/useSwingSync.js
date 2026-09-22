import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const EMPTY_STATE = {
  status: "idle",
  library: {
    folders: [],
    folder: null,
    profile: null,
    outputMode:
      "metadata",
  },
  progress: {
    phase: "idle",
    total: 0,
    completed: 0,
    failed: 0,
    currentTrackId: null,
    currentFile: null,
  },
  summary: {
    total: 0,
    pending: 0,
    analyzing: 0,
    analyzed: 0,
    errors: 0,
    needsReview: 0,
    reviewed: 0,
    reviewSkipped: 0,
    readyToApply: 0,
    outputApplied: 0,
  },
  tracks: [],
  cache: null,
  lastError: null,
};

export function useSwingSync() {
  const [state, setState] =
    useState(EMPTY_STATE);

  const [capabilities, setCapabilities] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [actionError, setActionError] =
    useState(null);

  const [selectedFolders, setSelectedFolders] =
    useState([]);

  useEffect(() => {
    let mounted = true;

    const unsubscribe =
      window.swingSync.subscribe(
        ({
          type,
          payload,
        }) => {
          if (!mounted) {
            return;
          }

          if (
            type === "state"
          ) {
            setState(payload);
            return;
          }

          if (
            type === "progress"
          ) {
            setState(
              (current) => ({
                ...current,
                progress:
                  payload,
              })
            );
            return;
          }

          if (
            type === "track"
          ) {
            setState(
              (current) => ({
                ...current,
                tracks:
                  current.tracks.map(
                    (track) =>
                      track.id ===
                      payload.trackId
                        ? payload.track
                        : track
                  ),
              })
            );
            return;
          }

          if (
            type === "error"
          ) {
            setActionError(
              payload.message ??
                "SwingSync encountered an error."
            );
          }
        }
      );

    window.swingSync.bootstrap()
      .then(
        ({
          state:
            initialState,
          capabilities:
            initialCapabilities,
        }) => {
          if (!mounted) {
            return;
          }

          setState(
            initialState
          );

          setCapabilities(
            initialCapabilities
          );

          setSelectedFolders(
            initialState.library
              ?.folders?.length
              ? initialState.library.folders
              : initialCapabilities
                  .configuration
                  ?.defaultMusicFolders ??
                []
          );
        }
      )
      .catch(
        (error) => {
          if (mounted) {
            setActionError(
              error.message
            );
          }
        }
      )
      .finally(
        () => {
          if (mounted) {
            setLoading(false);
          }
        }
      );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const run = useCallback(
    async (operation) => {
      setActionError(null);

      try {
        return await operation();
      } catch (error) {
        setActionError(
          error.message
        );
        throw error;
      }
    },
    []
  );

  const actions = useMemo(
    () => ({
      async chooseFolders() {
        const folders =
          await run(
            () =>
              window.swingSync.chooseMusicFolders()
          );

        if (
          folders.length > 0
        ) {
          setSelectedFolders(
            folders
          );
        }

        return folders;
      },

      setSelectedFolders,

      openLibrary(options) {
        return run(
          () =>
            window.swingSync.openLibrary(
              options
            )
        );
      },

      analyzeAll() {
        return run(
          () =>
            window.swingSync.analyzeAll()
        );
      },

      analyzeOne(trackId) {
        return run(
          () =>
            window.swingSync.analyzeOne(
              trackId
            )
        );
      },

      getTrackDetails(trackId) {
        return run(
          () =>
            window.swingSync.getTrackDetails(
              trackId
            )
        );
      },

      setProfile(profile) {
        return run(
          () =>
            window.swingSync.setProfile(
              profile
            )
        );
      },

      setOutputMode(outputMode) {
        return run(
          () =>
            window.swingSync.setOutputMode(
              outputMode
            )
        );
      },

      clearError() {
        setActionError(null);
      },
    }),
    [run]
  );

  return {
    state,
    capabilities,
    loading,
    actionError,
    selectedFolders,
    actions,
  };
}

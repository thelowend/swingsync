const fs = require("node:fs");
const path = require("node:path");

const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
} = require("electron");

const {
  createBpmApplication,
  PRODUCT_NAME,
} = require("../src/client/public-api.cjs");

const {
  getFfmpegPath,
} = require("../src/audio/ffmpeg-path.cjs");

const EVENT_CHANNEL = "swingsync:event";
const DEV_SERVER_URL =
  process.env.SWINGSYNC_VITE_DEV_SERVER_URL ?? null;

const PACKAGED_SMOKE_TEST =
  process.env.SWINGSYNC_PACKAGED_SMOKE_TEST ===
  "1";

const SMOKE_RESULT_FILE =
  process.env.SWINGSYNC_SMOKE_RESULT ??
  null;

const SMOKE_USER_DATA =
  process.env.SWINGSYNC_SMOKE_USER_DATA ??
  null;

if (
  PACKAGED_SMOKE_TEST &&
  SMOKE_USER_DATA
) {
  app.setPath(
    "userData",
    SMOKE_USER_DATA
  );
}

let mainWindow = null;
let bpmApplication = null;
let activeLongOperation = null;

function sendEvent(type, payload) {
  if (
    !mainWindow ||
    mainWindow.isDestroyed()
  ) {
    return;
  }

  mainWindow.webContents.send(
    EVENT_CHANNEL,
    {
      type,
      payload,
    }
  );
}

function bindApplicationEvents() {
  const forwardedEvents = [
    "state",
    "progress",
    "track",
    "review",
    "output",
    "error",
  ];

  for (const eventName of forwardedEvents) {
    bpmApplication.on(
      eventName,
      (payload) => {
        sendEvent(
          eventName,
          payload
        );
      }
    );
  }
}

async function createApplicationSession() {
  const cacheFile = path.join(
    app.getPath("userData"),
    ".swingsync-cache.json"
  );

  bpmApplication =
    await createBpmApplication({
      cacheFile,
    });

  bindApplicationEvents();
}

async function runExclusive(
  operationName,
  operation
) {
  if (activeLongOperation) {
    throw new Error(
      `SwingSync is already ${activeLongOperation}.`
    );
  }

  activeLongOperation =
    operationName;

  try {
    return await operation();
  } finally {
    activeLongOperation = null;
  }
}

function registerIpcHandlers() {
  ipcMain.handle(
    "swingsync:bootstrap",
    async () => ({
      capabilities:
        bpmApplication.getCapabilities(),
      state:
        bpmApplication.getState(),
    })
  );

  ipcMain.handle(
    "swingsync:choose-music-folders",
    async () => {
      const result =
        await dialog.showOpenDialog(
          mainWindow,
          {
            title:
              "Choose music folders",
            properties: [
              "openDirectory",
              "multiSelections",
            ],
            buttonLabel:
              "Use folders",
          }
        );

      if (result.canceled) {
        return [];
      }

      return result.filePaths;
    }
  );

  ipcMain.handle(
    "swingsync:open-library",
    async (_event, options) =>
      runExclusive(
        "opening the library",
        () =>
          bpmApplication.openLibrary(
            options ?? {}
          )
      )
  );

  ipcMain.handle(
    "swingsync:analyze-all",
    async () =>
      runExclusive(
        "analyzing the library",
        () =>
          bpmApplication.analyzeAll()
      )
  );

  ipcMain.handle(
    "swingsync:analyze-one",
    async (_event, trackId) =>
      bpmApplication.analyzeOne(
        trackId
      )
  );

  ipcMain.handle(
    "swingsync:get-track-details",
    async (_event, trackId) =>
      bpmApplication.getTrackDetails(
        trackId
      )
  );

  ipcMain.handle(
    "swingsync:get-review-queue",
    async () =>
      bpmApplication.getReviewQueue()
  );

  ipcMain.handle(
    "swingsync:submit-review",
    async (_event, decision) =>
      bpmApplication.submitReview(
        decision
      )
  );

  ipcMain.handle(
    "swingsync:approve-all-suggestions",
    async () =>
      bpmApplication.approveAllSuggestions()
  );

  ipcMain.handle(
    "swingsync:clear-review",
    async (_event, trackId) =>
      bpmApplication.clearReview(
        trackId
      )
  );

  ipcMain.handle(
    "swingsync:set-profile",
    async (_event, profile) =>
      bpmApplication.setProfile(
        profile
      )
  );

  ipcMain.handle(
    "swingsync:set-output-mode",
    async (_event, outputMode) =>
      bpmApplication.setOutputMode(
        outputMode
      )
  );

  ipcMain.handle(
    "swingsync:apply-track",
    async (
      _event,
      trackId,
      options
    ) =>
      bpmApplication.applyTrack(
        trackId,
        options ?? {}
      )
  );

  ipcMain.handle(
    "swingsync:get-apply-plan",
    async () =>
      bpmApplication.getApplyPlan()
  );

  ipcMain.handle(
    "swingsync:apply-all-approved",
    async (_event, options) =>
      runExclusive(
        "applying BPM changes",
        () =>
          bpmApplication.applyAllApproved(
            options ?? {}
          )
      )
  );
}

async function createWindow() {
  const windowIcon = path.join(
    __dirname,
    "assets",
    "swingsync-icon.png"
  );

  mainWindow =
    new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 980,
      minHeight: 680,
      title: PRODUCT_NAME,
      backgroundColor: "#efe5d2",
      icon: windowIcon,
      show: false,
      webPreferences: {
        preload:
          path.join(
            __dirname,
            "preload.cjs"
          ),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

  mainWindow.setMenuBarVisibility(
    false
  );

  mainWindow.webContents.setWindowOpenHandler(
    () => ({
      action: "deny",
    })
  );

  mainWindow.webContents.on(
    "will-navigate",
    (event, url) => {
      const allowedOrigin =
        DEV_SERVER_URL
          ? new URL(
              DEV_SERVER_URL
            ).origin
          : "file://";

      if (
        DEV_SERVER_URL &&
        new URL(url).origin ===
          allowedOrigin
      ) {
        return;
      }

      if (
        !DEV_SERVER_URL &&
        url.startsWith(
          allowedOrigin
        )
      ) {
        return;
      }

      event.preventDefault();
    }
  );

  mainWindow.once(
    "ready-to-show",
    () => {
      if (
        !PACKAGED_SMOKE_TEST
      ) {
        mainWindow.show();
      }
    }
  );

  if (DEV_SERVER_URL) {
    await mainWindow.loadURL(
      DEV_SERVER_URL
    );
  } else {
    await mainWindow.loadFile(
      path.join(
        __dirname,
        "dist",
        "index.html"
      )
    );
  }
}

function createSmokeCheck(
  name,
  passed,
  details = null
) {
  return {
    name,
    passed: Boolean(
      passed
    ),
    details,
  };
}

function writeSmokeResult(
  result
) {
  if (!SMOKE_RESULT_FILE) {
    return;
  }

  fs.mkdirSync(
    path.dirname(
      SMOKE_RESULT_FILE
    ),
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    SMOKE_RESULT_FILE,
    JSON.stringify(
      result,
      null,
      2
    ) + "\n",
    "utf8"
  );
}

async function runPackagedSmokeTest() {
  const checks = [];

  try {
    checks.push(
      createSmokeCheck(
        "Electron reports packaged mode",
        app.isPackaged,
        {
          isPackaged:
            app.isPackaged,
          appPath:
            app.getAppPath(),
        }
      )
    );

    checks.push(
      createSmokeCheck(
        "Renderer uses packaged file URL",
        mainWindow
          .webContents
          .getURL()
          .startsWith(
            "file://"
          ),
        {
          url:
            mainWindow
              .webContents
              .getURL(),
        }
      )
    );

    const ffmpegPath =
      getFfmpegPath();

    const ffmpegExists =
      fs.existsSync(
        ffmpegPath
      );

    const ffmpegInsideAsar =
      ffmpegPath.includes(
        `app.asar${path.sep}`
      );

    checks.push(
      createSmokeCheck(
        "FFmpeg executable exists",
        ffmpegExists,
        {
          ffmpegPath,
        }
      )
    );

    checks.push(
      createSmokeCheck(
        "FFmpeg resolves outside app.asar",
        !ffmpegInsideAsar,
        {
          ffmpegPath,
        }
      )
    );

    const rendererResult =
      await mainWindow
        .webContents
        .executeJavaScript(
          `
          (async () => {
            const waitUntil = async (
              predicate,
              timeoutMs = 10000
            ) => {
              const started =
                Date.now();

              while (
                Date.now() -
                  started <
                timeoutMs
              ) {
                if (predicate()) {
                  return;
                }

                await new Promise(
                  (resolve) =>
                    setTimeout(
                      resolve,
                      100
                    )
                );
              }

              throw new Error(
                "Timed out waiting for SwingSync renderer."
              );
            };

            await waitUntil(
              () =>
                document.querySelector(
                  ".brand-name"
                )
            );

            const api =
              window.swingSync;

            if (!api) {
              throw new Error(
                "window.swingSync was not exposed by preload."
              );
            }

            const bootstrap =
              await api.bootstrap();

            const fontFaces =
              await document.fonts.load(
                '24px "Manbow Lines-Regular"',
                "SwingSync"
              );

            return {
              brand:
                document
                  .querySelector(
                    ".brand-name"
                  )
                  ?.textContent
                  ?.trim() ??
                null,
              apiMethods:
                Object.keys(
                  api
                ).sort(),
              bootstrapState:
                bootstrap
                  ?.state
                  ?.status ??
                null,
              hasCapabilities:
                Boolean(
                  bootstrap
                    ?.capabilities
                ),
              fontFaceCount:
                fontFaces.length,
              fontReady:
                document.fonts.check(
                  '24px "Manbow Lines-Regular"',
                  "SwingSync"
                ),
            };
          })()
          `,
          true
        );

    const requiredApiMethods = [
      "analyzeAll",
      "bootstrap",
      "getApplyPlan",
      "getReviewQueue",
      "setProfile",
    ];

    const missingMethods =
      requiredApiMethods.filter(
        (method) =>
          !rendererResult
            .apiMethods
            .includes(
              method
            )
      );

    checks.push(
      createSmokeCheck(
        "React renderer mounted",
        rendererResult.brand ===
          "SwingSync",
        {
          brand:
            rendererResult.brand,
        }
      )
    );

    checks.push(
      createSmokeCheck(
        "Preload API exposed",
        missingMethods.length ===
          0,
        {
          missingMethods,
          apiMethods:
            rendererResult
              .apiMethods,
        }
      )
    );

    checks.push(
      createSmokeCheck(
        "IPC bootstrap succeeds",
        Boolean(
          rendererResult
            .bootstrapState
        ) &&
          rendererResult
            .hasCapabilities,
        {
          state:
            rendererResult
              .bootstrapState,
          hasCapabilities:
            rendererResult
              .hasCapabilities,
        }
      )
    );

    checks.push(
      createSmokeCheck(
        "Manbow Lines font loads",
        rendererResult
            .fontFaceCount >
          0 &&
          rendererResult
            .fontReady,
        {
          fontFaceCount:
            rendererResult
              .fontFaceCount,
          fontReady:
            rendererResult
              .fontReady,
        }
      )
    );
  } catch (error) {
    checks.push(
      createSmokeCheck(
        "Smoke-test execution",
        false,
        {
          message:
            error?.message ??
            String(error),
          stack:
            error?.stack ??
            null,
        }
      )
    );
  }

  const failed =
    checks.filter(
      (check) =>
        !check.passed
    );

  const result = {
    product:
      PRODUCT_NAME,
    version:
      app.getVersion(),
    platform:
      process.platform,
    arch:
      process.arch,
    passed:
      failed.length === 0,
    checks,
  };

  writeSmokeResult(
    result
  );

  if (
    bpmApplication &&
    bpmApplication
      .getState()
      .status !== "closed"
  ) {
    await bpmApplication.close();
  }

  app.exit(
    result.passed
      ? 0
      : 1
  );
}

async function handleStartupError(
  error
) {
  if (
    PACKAGED_SMOKE_TEST
  ) {
    const result = {
      product:
        PRODUCT_NAME,
      version:
        app.getVersion(),
      platform:
        process.platform,
      arch:
        process.arch,
      passed: false,
      checks: [
        createSmokeCheck(
          "Application startup",
          false,
          {
            message:
              error?.message ??
              String(error),
            stack:
              error?.stack ??
              null,
          }
        ),
      ],
    };

    writeSmokeResult(
      result
    );

    app.exit(1);
    return;
  }

  throw error;
}

app.whenReady().then(
  async () => {
    if (process.platform === "win32") {
      app.setAppUserModelId(
        "com.swingsync.desktop"
      );
    }

    if (
      process.platform === "darwin" &&
      app.dock?.setIcon
    ) {
      app.dock.setIcon(
        path.join(
          __dirname,
          "assets",
          "swingsync-icon.png"
        )
      );
    }

    await createApplicationSession();
    registerIpcHandlers();
    await createWindow();

    if (
      PACKAGED_SMOKE_TEST
    ) {
      await runPackagedSmokeTest();
      return;
    }

    app.on(
      "activate",
      async () => {
        if (
          BrowserWindow.getAllWindows()
            .length === 0
        ) {
          await createWindow();
        }
      }
    );
  }
).catch(
  handleStartupError
);

app.on(
  "before-quit",
  async (event) => {
    if (!bpmApplication) {
      return;
    }

    if (
      bpmApplication.getState()
        .status === "closed"
    ) {
      return;
    }

    event.preventDefault();

    try {
      await bpmApplication.close();
    } finally {
      app.exit(0);
    }
  }
);

app.on(
  "window-all-closed",
  () => {
    if (
      process.platform !==
      "darwin"
    ) {
      app.quit();
    }
  }
);

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

const EVENT_CHANNEL = "swingsync:event";
const DEV_SERVER_URL =
  process.env.SWINGSYNC_VITE_DEV_SERVER_URL ?? null;

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
  mainWindow =
    new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 980,
      minHeight: 680,
      title: PRODUCT_NAME,
      backgroundColor: "#101114",
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
      mainWindow.show();
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

app.whenReady().then(
  async () => {
    if (process.platform === "win32") {
      app.setAppUserModelId(
        "com.swingsync.desktop"
      );
    }

    await createApplicationSession();
    registerIpcHandlers();
    await createWindow();

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

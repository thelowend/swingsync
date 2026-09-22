# SwingSync Desktop (v13)

The desktop client is an Electron + React/Vite presentation layer around the existing `BpmApplication` API.

## Process boundary

```text
React renderer
    ↓ narrow window.swingSync API
preload.cjs / contextBridge
    ↓ validated IPC channel set
Electron main process
    ↓
BpmApplication
    ↓
Essentia / FFmpeg / cache / metadata / filesystem
```

The renderer has:

```text
nodeIntegration: false
contextIsolation: true
sandbox: true
```

It never imports filesystem, FFmpeg, Essentia, or the SwingSync application engine directly.

## Development

```powershell
npm install
npm run desktop:dev
```

Vite serves the renderer on `127.0.0.1:5173` and the development launcher starts Electron after that server is reachable.

## Production-like local run

```powershell
npm run desktop:run
```

This builds the renderer into `desktop/dist/` and launches Electron from the built files.

## CLI remains available

```powershell
npm run cli -- --profile boogie
```

or, if you linked the package globally:

```powershell
swingsync --profile boogie
```

## Functional v13 Library screen

The current desktop milestone supports:

- selecting one or many folders with the native directory picker
- using `.env` default folders as the initial selection
- opening/scanning the real SwingSync library
- selecting Generic / Swing / Boogie interpretation profiles
- selecting Metadata / Filename / Both output modes
- running real library analysis
- receiving live analysis progress from the main process
- viewing existing tag, detected BPM, suggested BPM, confidence, and status
- filtering All / Review / Ready / Error tracks
- searching the library
- opening a track inspector backed by `getTrackDetails()`
- seeing review and ready-to-apply counts

## IPC already exposed for the next UI milestone

The preload bridge also exposes:

```text
getReviewQueue()
submitReview()
clearReview()
applyTrack()
applyAllApproved()
```

Those exist now so the upcoming Review and Apply screens can remain pure presentation work rather than requiring another backend refactor.

## Desktop cache

The desktop app stores its analysis cache in Electron's per-user `userData` directory instead of the project directory. The CLI continues to use its existing `.swingsync-cache.json` behavior.

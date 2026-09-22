# SwingSync v13 — Electron desktop client

SwingSync now has its first real desktop client.

The existing BPM engine, cache, review domain, metadata output, multi-folder configuration, benchmark tooling, and CLI remain intact. v13 adds an **Electron main process + secure preload bridge + React/Vite renderer** on top of the `BpmApplication` API.

## Install

```powershell
npm install
```

## Run the desktop app during development

```powershell
npm run desktop:dev
```

This launches the Vite renderer and then opens SwingSync in Electron.

## Run a production-like desktop build locally

```powershell
npm run desktop:run
```

That command builds the renderer into `desktop/dist/` and launches the built UI.

## CLI is still available

From the repository:

```powershell
npm run cli -- --profile boogie
```

Or, after `npm link`:

```powershell
swingsync --profile boogie
```

## Desktop architecture

```text
React renderer
      ↓
window.swingSync
      ↓
contextBridge preload
      ↓
Electron IPC
      ↓
BpmApplication
      ↓
analysis / review / cache / metadata / filesystem
```

The renderer runs with `nodeIntegration: false`, `contextIsolation: true`, and `sandbox: true`. It receives a deliberately small API rather than raw Node or Electron access.

## v13 Library screen

The first visual milestone is deliberately centered on the real library workflow:

- choose one or multiple music folders through the native picker
- start from `SWINGSYNC_MUSIC_FOLDERS` defaults loaded from `.env`
- open and scan the library
- run the existing analysis engine
- watch live progress
- switch Generic / Swing / Boogie profiles
- choose Metadata / Filename / Both output modes
- inspect existing BPM tags, detected BPM, suggested BPM, confidence and review state
- search tracks
- filter All / Review / Ready / Errors
- open a detailed track inspector backed by `getTrackDetails()`

The preload API already includes review and apply commands so the next desktop milestone can add the dedicated **Review Queue** and **Apply Summary** without changing the backend boundary again.

See [DESKTOP.md](DESKTOP.md) for desktop-specific details, [CLIENT_API.md](CLIENT_API.md) for the application API, and [ARCHITECTURE.md](ARCHITECTURE.md) for the domain architecture.

## Default music folders

`.env` remains supported:

```env
SWINGSYNC_MUSIC_FOLDERS=D:\Music\Swing;D:\Music\Boogie;E:\Dance Music
```

If configured, these appear as the initial folder selection in the desktop client. You can replace them with the native **Choose folders** action.

## Output

Metadata remains the default output target:

```text
MP3      ID3v2 TBPM
FLAC     Vorbis Comment BPM
OGG      Vorbis Comment BPM
M4A/MP4  iTunes tmpo
```

The v13 Library screen does not yet expose the final Apply action; that is intentionally part of the next Review/Apply UI milestone. The underlying API is already wired through preload.

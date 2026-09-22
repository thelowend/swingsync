# SwingSync Client API

`src/client/public-api.cjs` is the stable application-facing entry point
for **SwingSync**.

It is intentionally independent of Electron, Tauri, React, Vue, terminal
prompts, and other presentation technologies.

## Create a session

```js
const {
  createBpmApplication,
  PRODUCT_NAME,
} = require("./src/client/public-api.cjs");

console.log(PRODUCT_NAME);
// SwingSync

const app =
  await createBpmApplication();
```

A session owns:

- one analysis cache
- the currently opened library
- in-memory analysis results
- review decisions
- output/application state
- progress state

Call `app.close()` when the client closes or replaces the session.

---

## Capabilities

```js
app.getCapabilities();
```

Returns serializable data similar to:

```json
{
  "product": {
    "name": "SwingSync",
    "packageName": "swingsync",
    "cliCommand": "swingsync"
  },
  "profiles": [
    { "name": "generic", "description": "..." },
    { "name": "swing", "description": "..." },
    { "name": "boogie", "description": "..." }
  ],
  "outputModes": [
    "metadata",
    "filename",
    "both"
  ],
  "reviewActions": [
    "use-detected",
    "use-suggested",
    "use-custom",
    "skip"
  ],
  "events": [
    "state",
    "progress",
    "track",
    "review",
    "output",
    "error"
  ]
}
```

A graphical client should use this instead of hard-coding profiles/actions.

---

## Open a library

```js
await app.openLibrary({
  folder: "D:\\Music",
  profile: "boogie",
  outputMode: "metadata",
});
```

This scans for supported audio files but does not analyze them yet.

The returned state contains one lightweight track row per file.

---

## Analyze

Entire library:

```js
await app.analyzeAll();
```

One track:

```js
await app.analyzeOne("track-3");
```

Analysis currently runs sequentially. That is deliberate: Essentia/FFmpeg
analysis is CPU-heavy, and concurrency should become a configurable policy
rather than an accidental property of the UI.

---

## State

```js
const state =
  app.getState();
```

The entire state is JSON-serializable.

High-level shape:

```json
{
  "status": "ready",
  "library": {
    "folder": "D:\\Music",
    "profile": "boogie",
    "outputMode": "metadata"
  },
  "progress": {
    "phase": "idle",
    "total": 20,
    "completed": 20,
    "failed": 0,
    "currentTrackId": null,
    "currentFile": null
  },
  "summary": {
    "total": 20,
    "pending": 0,
    "analyzed": 20,
    "errors": 0,
    "needsReview": 7,
    "reviewed": 3,
    "readyToApply": 16,
    "outputApplied": 0
  },
  "tracks": [],
  "cache": {},
  "lastError": null
}
```

### Track state

A track row is deliberately smaller than the raw acoustic analysis:

```json
{
  "id": "track-3",
  "file": "D:\\Music\\Seven up!.mp3",
  "filename": "Seven up!.mp3",
  "relativePath": "Seven up!.mp3",
  "status": "analyzed",
  "analysisSource": "cache",

  "metadata": {
    "existingBpm": null,
    "readError": null,
    "supported": null
  },

  "tempo": {
    "detectedBpm": 113.46,
    "detectionConfidence": "low",
    "detectionScore": 9,
    "suggestedBpm": 226.92,
    "interpretationConfidence": "medium",
    "adjusted": true,
    "relationship": "double-time",
    "reason": "...",
    "autoApply": false
  },

  "review": {
    "required": true,
    "decision": null,
    "selectedBpm": null,
    "source": null,
    "skipped": false
  },

  "output": {
    "status": null,
    "applied": false,
    "mode": null,
    "metadataWritten": null,
    "metadataUnchanged": null,
    "metadataReason": null,
    "finalPath": "D:\\Music\\Seven up!.mp3"
  }
}
```

Use `getTrackDetails(trackId)` only when opening a detailed inspector.

This keeps a future table/grid fast while still making the full diagnostic
information available on demand.

---

## Review queue

```js
const items =
  app.getReviewQueue();
```

Each item contains:

- detected BPM
- suggested BPM
- existing BPM metadata
- confidence
- relationship
- reason
- candidate tempos
- double-time evidence

No terminal-specific keys or prompts are included.

### Submit a decision

```js
app.submitReview({
  trackId: "track-3",
  action: "use-suggested",
});
```

Custom BPM:

```js
app.submitReview({
  trackId: "track-3",
  action: "use-custom",
  customBpm: 224,
});
```

Skip:

```js
app.submitReview({
  trackId: "track-3",
  action: "skip",
});
```

A graphical client's "close dialog" behavior is **not** a review action.
The UI simply closes its dialog. This is why `quit` no longer exists in the
review domain.

---

## Change profile without re-analyzing audio

```js
app.setProfile("swing");
```

Already-analyzed tracks are reinterpreted from their existing acoustic
results.

FFmpeg/Essentia do not run again.

Existing human review decisions are cleared because they were made against a
different musical interpretation.

This will be useful in a GUI for a profile selector.

---

## Change output mode

```js
app.setOutputMode("metadata");
app.setOutputMode("filename");
app.setOutputMode("both");
```

This affects output application only, not BPM detection.

---

## Apply

One approved track:

```js
await app.applyTrack(
  "track-3"
);
```

Preview output without changing the file:

```js
await app.applyTrack(
  "track-3",
  {
    applyChanges: false,
  }
);
```

All approved tracks:

```js
await app.applyAllApproved();
```

"Approved" means either:

- a track was high-confidence / `autoApply`, or
- a human review chose a BPM.

Unresolved and skipped review items are ignored.

---

## Events

```js
app.on("state", state => {});
app.on("progress", progress => {});
app.on("track", ({ trackId, track }) => {});
app.on("review", payload => {});
app.on("output", payload => {});
app.on("error", error => {});
```

These are plain Node `EventEmitter` events.

### Electron

The main process can forward them over IPC.

### Tauri

A thin command/event adapter can serialize the same data into Tauri's event
system.

### Local web UI

A server adapter could translate them to SSE/WebSocket messages.

The BPM application layer does not need to change.

---

## Recommended visual-client model

A future UI can be built around three views:

1. **Library**
   - filename
   - existing BPM
   - detected BPM
   - suggested BPM
   - confidence
   - review/output status

2. **Review queue**
   - one uncertain track at a time or a batch table
   - detected/suggested/custom BPM
   - evidence inspector

3. **Apply summary**
   - metadata to write
   - already-matching tags
   - unsupported formats
   - failures

That UI should consume this API rather than calling audio/tempo modules
directly.


---

## Branding

SwingSync's public branding is exported separately from the technical API
type names:

```js
const {
  PRODUCT_NAME,
  PACKAGE_NAME,
  CLI_COMMAND,
  DEFAULT_CACHE_FILENAME,
} = require("./src/client/public-api.cjs");
```

Current values:

```text
PRODUCT_NAME           SwingSync
PACKAGE_NAME           swingsync
CLI_COMMAND            swingsync
DEFAULT_CACHE_FILENAME .swingsync-cache.json
```

`BpmApplication` is intentionally retained as the internal application-service
name.

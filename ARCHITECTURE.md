# SwingSync Architecture

SwingSync is the product layer around the existing BPM analysis domain.
Internal BPM-oriented class/module names are retained deliberately.

## Layers

```text
┌─────────────────────────────────────────────────────────────┐
│ Presentation                                                │
│                                                             │
│ Terminal today        Electron/Tauri/Web tomorrow           │
└─────────────────────────────┬───────────────────────────────┘
                              │
                    serializable commands/events
                              │
┌─────────────────────────────▼───────────────────────────────┐
│ Client/Application API                                      │
│                                                             │
│ BpmApplication                                              │
│ - session state                                             │
│ - progress                                                  │
│ - review queue                                              │
│ - profile/output selection                                  │
│ - apply orchestration                                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│ Application services                                        │
│                                                             │
│ analyzeTrack()              applyBpmOutput()                 │
└───────────────┬──────────────────────────────┬──────────────┘
                │                              │
┌───────────────▼─────────────┐  ┌────────────▼──────────────┐
│ Tempo/audio domain          │  │ Output adapters           │
│                             │  │                           │
│ Essentia analysis           │  │ metadata writer           │
│ hypotheses/reconciliation   │  │ filename renamer          │
│ profile interpretation      │  │                           │
│ review decisions            │  │                           │
└───────────────┬─────────────┘  └───────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│ Infrastructure                                              │
│ FFmpeg, filesystem, cache, music-metadata                   │
└─────────────────────────────────────────────────────────────┘
```

## Important boundaries

### Tempo logic does not know the UI

No prompts, buttons, dialogs, or keyboard commands are part of tempo
detection or musical interpretation.

### Review logic does not know the UI

Review actions are domain decisions:

- use detected BPM
- use suggested BPM
- use custom BPM
- skip

"Quit", "close dialog", "back", and navigation belong to the presentation
layer.

### Tempo confidence does not know the output adapter

`autoApply` says whether the application trusts a BPM sufficiently to apply it
without review.

It does not say `autoRename`, because the output may be metadata, a filename,
or something else in the future.

### The client gets summaries by default

`state.tracks[]` contains lightweight DTOs suitable for a data grid.

The complete acoustic evidence is available only from:

```js
app.getTrackDetails(trackId)
```

This avoids forcing a future visual client to keep thousands of large
analysis objects in its render state.

## Stable IDs

A library session gives tracks stable IDs such as:

```text
track-1
track-2
track-3
```

The ID is independent of the file path.

This matters if `outputMode = filename` or `both`, because applying output can
change the path while the UI row should remain the same entity.


## Music-library configuration

Library roots are application configuration rather than presentation state.

```text
.env
  ↓
src/config.cjs
  ↓
DEFAULT_MUSIC_FOLDERS
  ↓
CLI / BpmApplication.openLibrary()
  ↓
findAudioFilesInFolders()
```

The scanner deduplicates overlapping roots by absolute file path.

Each track still records the root under which it was discovered so relative
paths and reports remain meaningful.


## Electron desktop boundary

SwingSync v13 adds a presentation boundary without moving domain logic into the renderer:

```text
Renderer (React)
  ↓ window.swingSync
Preload (contextBridge)
  ↓ named IPC handlers/events
Electron main
  ↓ BpmApplication
Existing application/domain/infrastructure layers
```

The renderer is sandboxed and has no Node integration. Folder selection is owned by Electron main through the native `dialog` API. Long-running library analysis remains in the main process for this milestone and reports progress through the existing application events.

The desktop preload exposes review/apply operations now, even though v13's visible UI focuses on the Library screen, so future Review and Apply screens do not need a new privilege boundary.


## v14 write boundary

The desktop workflow intentionally separates human judgment from mutation:

```text
ReviewView
  │ submitReview()
  │ no file changes
  ▼
BpmApplication review state
  │
  │ getApplyPlan()
  ▼
ApplyView
  │ final confirmation
  │
  ▼
applyAllApproved({ applyChanges: true })
  │
  ▼
applyBpmOutput()
```

`getApplyPlan()` is pure with respect to files and output state. This gives
the UI a reliable preflight view before the user commits changes.

Already-applied tracks are excluded from subsequent plans and batch applies.

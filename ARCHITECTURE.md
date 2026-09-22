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

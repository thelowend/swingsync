# SwingSync Desktop v15 — Localization

## Supported languages

```text
en  English
es  Español
```

Use the `EN | ES` toggle in the application top bar.

The preference is stored under:

```text
swingsync.language
```

in the renderer's local storage.

## First-run behavior

If there is no stored preference, SwingSync checks `navigator.language`.

Locales beginning with:

```text
es
```

start in Spanish. Otherwise SwingSync starts in English.

## Translation boundary

Localization lives only in the renderer:

```text
React component
  ↓
useLanguage()
  ↓
English source string / domain code
  ↓
Spanish dictionary when language === es
```

The Electron main process and `BpmApplication` do not need to know the
selected language.

## Domain-safe localization

The application continues to pass stable values across IPC:

```text
confidence = medium
relationship = double-time
outputMode = metadata
```

The UI displays:

```text
English                     Spanish

Medium                      Media
Double time                 Doble tempo
Metadata                    Metadatos
```

## Reason codes

Tempo interpretation now returns `reasonCode` + `reasonParams` in addition to
the existing canonical English `reason`.

This is the pattern to use for future engine messages that need localization:
add stable codes/parameters, not language-specific strings to the engine.

## Adding another language

1. Add the language to `SUPPORTED_LANGUAGES`.
2. Add a translation dictionary alongside `SPANISH_TRANSLATIONS`.
3. Extend `LanguageContext` to select that dictionary.
4. No audio/tempo/application-domain changes should be necessary.

If the translation dictionary does not contain a source message, SwingSync
falls back to English.


## Spanish dialect

`es` currently represents Argentine Rioplatense Spanish.

Examples:

```text
Choose folders       → Elegí carpetas
Analyze library      → Analizá biblioteca
Approve suggested    → Aprobá sugerido
You can go back      → Podés volver
Confirm & write      → Confirmá y escribí
Beat median          → BPM mediano
```

The localization deliberately favors the term `BPM` instead of `pulsaciones`
for tempo-related concepts.


## Bulk suggestion approval

The Review header has a secondary bulk button beside the Apply navigation
button.

Its label includes the current unresolved count:

```text
Approve 12 suggestions
```

The action selects the suggested BPM for unresolved review items only.
Previously reviewed/customized/skipped tracks are preserved.

This is intentionally not a file-write action.


## Apply button placement

v15.5 moves the final **Apply changes** action to the Apply header. It sits
beside the output-mode summary so the main action is visible without scrolling.

The final confirmation modal remains unchanged, so moving the button does not
move or weaken the actual file-write boundary.

## Per-analysis attention cue

The first visit to Apply after a completed `analyzeAll()` batch briefly
highlights the Apply button.

The renderer records the last highlighted `analysisBatchRevision` in
`sessionStorage`, so revisiting Apply during the same batch does not repeat the
cue.


## Branded logo and icon

v15.7 replaces the placeholder `SS` mark with the provided SwingSync artwork.

Frontend asset:

```text
desktop/renderer/src/assets/swingsync-logo.png
```

Electron icon asset:

```text
desktop/assets/swingsync-icon.png
```

The app header renders the horizontal logo inside a beveled brand shell.
Electron uses a square padded icon derived from the same artwork.

## Warm theme

The desktop UI now uses a cream / brown palette based on the SwingSync logo,
with warm orange-brown accents and higher-contrast brown typography.


## Theme preference

v15.8 adds a two-state theme control beside the language toggle:

```text
Light / Dark
```

The preference is presentation-only and persisted in renderer local storage.

The theme is applied using:

```text
html[data-theme="light"]
html[data-theme="dark"]
```

so domain/API state remains unchanged.

The contrast pass includes navigation, tables, statuses, modals, banners and
the track inspector.


## Compact Library/Apply surfaces

v15.10 reduces the height and internal spacing of shared summary cards and the
Library folder strip to keep more tracks visible without scrolling.

The Library primary action row also presents an explicit three-step sequence:

```text
1 Choose folders → 2 Open library → 3 Analyze library
```


## Current-state Library filters

v15.11 defines the Library tabs as current workflow views rather than historical
classification views.

- Review: `review.required && !review.decision && !output.applied`
- Ready: current automatic/human-approved result and `!output.applied`
- All: all library tracks, including completed Applied tracks

The workflow CTA is hidden once there is neither unresolved Review work nor
pending Apply work.


## v15.12 header typography

The desktop header is more compact and main-view H1s are slightly smaller.

The `SwingSync` header wordmark uses `Manbow Lines-Regular` through a local
`@font-face` asset. Install your licensed copy from the original font ZIP before
running/building the desktop renderer.


## Install the Manbow Lines wordmark font

From the project root:

```powershell
npm run desktop:font:install -- "C:\path\to\manbow.zip"
```

Then run normally:

```powershell
npm run desktop:dev
```

The installer is dependency-free and can read the original ZIP directly.


## Review pending-Apply feedback

v15.15 displays `state.summary.pendingToApply` directly inside the Review
screen's **Continue to Apply** button.

Whenever a Review action newly adds work to the Apply queue, the button replays
the existing `apply-attention` cue. Bulk suggestion approval triggers a single
pulse for the whole bulk operation.


## v15.16 Review guard and default profile

The bulk suggestion count is now shown in a badge. Continue to Apply warns when unresolved tracks remain. Profile order is `Rhythm and Blues → Swing → Generic`, with Rhythm and Blues as the default.

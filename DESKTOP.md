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


## Windows portable packaging

Create the single-file x64 beta build:

```powershell
npm run desktop:package:win
```

Expected output:

```text
release\SwingSync-<version>-Windows-x64.exe
```

Create an unpacked test build:

```powershell
npm run desktop:package:win:unpacked
```

FFmpeg is explicitly unpacked from ASAR because SwingSync executes it with
`spawn()`.


## v15.18 footer sizing

The status bar is fixed at 34px. Header, optional error banner, content, and
footer are explicitly assigned to app-shell grid rows so sparse views cannot
stretch the footer into the remaining viewport height.


## v15.19 Review/Library UI polish

- Custom BPM uses a theme-aware input surface and whole-number step controls.
- Skip this track is a visible secondary danger action.
- The Library Analysis Complete CTA renders the unresolved Review number in a
  badge.
- The CTA highlights once per completed `analysisBatchRevision`, for about
  2.7 seconds, with a reduced-motion fallback.


## v15.20 packaged Windows smoke test

Existing unpacked package:

```powershell
npm run test:packaged
```

Build + smoke:

```powershell
npm run desktop:package:win:smoke
```

Verified portable release:

```powershell
npm run desktop:package:win:verified
```

The smoke test runs the packaged `SwingSync.exe` with a private environment
flag. The normal application never enters smoke mode.

Inside the packaged process it verifies packaged mode, renderer/preload/IPC,
FFmpeg's unpacked path and the bundled Manbow font. A JSON result is written to
a temporary directory for the parent test runner, then deleted by the runner.


## v15.21 Review playback shortcut

Review exposes a play-icon button beside the selected track title.

Flow:

```text
renderer trackId
→ preload openTrackExternal(trackId)
→ main-process IPC
→ BpmApplication.getTrack(trackId)
→ Electron shell.openPath(file)
→ OS default audio player
```

No Node or direct filesystem capability is exposed to the renderer.


## v15.21.5 Review queue sizing

Desktop Review uses a flex-based left column. `review-list-scroll` fills the
remaining height beneath the queue header and therefore tracks changes in the
height of the selected track's Review editor.

The responsive stacked layout keeps a 220px maximum queue height.


## v15.21.6 Review height ownership

Desktop Review height is owned by `review-editor`. The queue is absolutely
fitted to the parent and therefore cannot contribute its track-list content to
the parent height.

At `max-width: 1000px` the queue returns to normal flow for the stacked layout.


## v15.21.7 Track Inspector polish

- Inspector Detail rows use 8px left/right padding.
- Review callout spacing is unchanged.
- Close button uses a 16×16 SVG X centered inside the existing 34×34 hit area.


## v15.22 Tap Tempo

Tap Tempo is renderer-only and does not write files or invoke IPC. It estimates
BPM from recent tap intervals and copies the whole-number result into Custom BPM.

## v15.22 Track Inspector spacing

`inspector-section` now owns the 8px horizontal inset. Detail rows no longer
add a second nested inset. The standalone review callout is unchanged.


## v15.22.1 Tap Tempo drafts and feedback

Review keeps unapproved Tap Tempo/Custom BPM state per `trackId` in a
renderer-local Map. Queue navigation loads the corresponding draft instead of
resetting the controls.

The UI tap count is independent from the nine-timestamp estimator window, so
the visible counter can grow without bound during one continuous sequence.

`Tap BPM` replays a short pulse animation for each click/touch. The animation
is disabled under `prefers-reduced-motion`.


## v15.23 Accessibility

`AccessibilityProvider` owns persistent display preferences and applies them to
the root HTML element through `data-a11y-*` attributes.

The navigation-level Accessibility popover supports Larger Text, High
Contrast, Deuteranopia/Protanopia/Tritanopia adaptive palettes and Reduce
Motion. Preferences are renderer-local and do not alter analysis or file
output behavior.


## v15.24 Apply safety and inspector controls

- Filename mode writes `[<BPM> BPM]` and replaces older SwingSync BPM filename
  decorations.
- Track Inspector can reset one track to Pending and invalidate its cached
  analysis.
- Profile and Output selects expose localized effect descriptions via tooltip
  and accessible description text.
- Apply can create a last-pass backup set before mutation and restore it with
  Undo last Apply. Backup data is stored under the cache/user-data directory,
  not alongside the music library.


## v15.24.1 Development DevTools

When `SWINGSYNC_VITE_DEV_SERVER_URL` is present and Electron is not packaged,
DevTools are enabled and can be toggled with F12, Ctrl+Shift+I, or
Cmd+Option+I.

Release builds set `webPreferences.devTools` to false.


## v15.25 Header typography

The desktop topbar now uses:

- Manbow Lines-Regular, 68px: `Swing/Sync`
- Peignot, 20px: tagline
- Engebrechtre: workflow navigation and topbar controls

Accessibility has moved into `topbar-controls`, immediately before
`ThemeToggle`. Profile/Output CSS tooltips explicitly use the default UI font
stack instead of inheriting Engebrechtre.

Peignot and Engebrechtre are local build inputs and are checked together with
Manbow before desktop development/builds.


## v15.25.1 Topbar/accessibility polish

Workflow navigation labels are uppercase with 16px horizontal padding.

Numeric workflow/navigation/filter badges use normal font weight.

The Accessibility trigger is styled as a one-button version of the Theme and
Language grouped controls. Accessibility option copy is enlarged to 15px/14px
(title/description), option-row gap is removed, and the color-vision select
uses 14px text with an inset custom chevron.

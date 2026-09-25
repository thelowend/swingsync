# SwingSync v15.25 — Brand typography refresh

SwingSync v15 adds the first multilingual desktop experience.

Supported desktop languages:

```text
English
Español (Argentina / Rioplatense)
```

The BPM engine, cache, metadata writer, reports and CLI remain language-neutral
or canonical-English internally. Localization is applied at the desktop
presentation boundary.

## Run

```powershell
npm install
npm run desktop:dev
```

## Language toggle

The top bar now contains:

```text
EN | ES
```

Changing language updates the current screen immediately; analysis does not
restart and no application state is lost.

SwingSync remembers the selected desktop language in renderer local storage.

On first launch:

- an OS/browser locale beginning with `es` selects Spanish
- all other locales default to English

The selected language also updates the document `lang` attribute for
accessibility.

## Localization architecture

```text
desktop/renderer/src/i18n/
  translations.mjs
  LanguageContext.jsx
```

English is the source/fallback language. Spanish translations are stored in a
separate dictionary.

Components use:

```js
const {
  t,
  plural,
  domainLabel,
  formatBpm,
  formatReason,
} = useLanguage();
```

This keeps text out of business logic and makes additional languages a
dictionary/presentation concern.

## Domain values remain stable

Machine values are **not** translated:

```text
high
medium
low

double-time
3:2-triplet-feel

metadata
filename
both

use-detected
use-suggested
...
```

The UI translates their labels only.

That means language changes do not alter:

- caches
- reports
- review actions
- persisted BPM decisions
- IPC payload contracts
- benchmark behavior

## Interpretation reasons

v15 adds presentation-friendly fields to musical interpretations:

```js
reasonCode
reasonParams
```

For example:

```json
{
  "reasonCode": "interpretation.double-time-preferred",
  "reasonParams": {
    "profile": "rhythm-and-blues",
    "candidateBpm": 226.92,
    "detectedBpm": 113.46,
    "totalScore": 6,
    "maximumScore": 6,
    "requiredScore": 5
  }
}
```

The existing English `reason` string remains unchanged for compatibility with
the CLI, reports and older consumers.

This lets the desktop UI render the same explanation naturally in English or
Spanish without attempting to parse English prose.

## Numbers

Desktop number formatting follows the selected language:

```text
English: 177.7 BPM
Spanish: 177,7 BPM
```

The underlying numeric values are unchanged.

## Scope

v15 localizes the desktop application's primary user experience:

- Library
- filters / search
- track table
- track inspector
- status/confidence labels
- Review workflow
- interpretation explanations
- evidence labels
- Apply plan
- final write confirmation
- common application errors

Raw third-party/FFmpeg diagnostics may remain in their original language so
technical detail is not lost.

The CLI remains English in v15.


## Spanish style

The Spanish desktop localization uses Argentine Rioplatense Spanish:

- voseo (`elegí`, `analizá`, `revisá`, `podés`, `confirmá`)
- natural Argentine UI phrasing
- `BPM` is preferred over literal translations such as `pulsaciones`
- English references to musical `beats` may be slightly adapted when `BPM`
  communicates the actual UI concept more clearly

This is presentation-only and does not change engine/domain values.


## v15.2 copy refinement

This version incorporates the user-edited desktop localization and view copy as
the source of truth for:

- `translations.mjs`
- `App.jsx`
- `ReviewView.jsx`
- `ApplyView.jsx`

The uploaded `App(1).jsx` is intentionally installed as `App.jsx`.
Likewise the uploaded Review/Apply view files are installed under their normal
component filenames.

The `music-metadata` dependency remains:

```json
"music-metadata": "^11.16.0"
```


## v15.3 profile naming

The canonical profile is:

```text
rhythm-and-blues
```

The UI displays **Rhythm and Blues**.

Legacy `boogie` and `boogie-woogie` profile names are intentionally not
accepted by the CLI.

## v15.3 filename format

Filename output now prefixes the rounded BPM:

```text
Rock, rock, rock.mp3
→
[215 BPM] Rock, rock, rock.mp3
```

A later run replaces an existing SwingSync BPM prefix rather than stacking it:

```text
[215 BPM] Rock, rock, rock.mp3
→
[220 BPM] Rock, rock, rock.mp3
```

Legacy suffix filenames are migrated automatically:

```text
Rock, rock, rock [215 BPM].mp3
→
[220 BPM] Rock, rock, rock.mp3
```


## v15.4 — Approve all suggestions

The Review screen now includes a bulk action beside **Continue to Apply**:

```text
Approve N suggestions
```

It approves the current SwingSync suggested BPM for every review-required track
that still has no human decision.

It deliberately does **not** alter tracks that were already:

- approved with detected BPM
- approved with suggested BPM
- given a custom BPM
- skipped

This bulk action only records review decisions. It does not modify music files.

The normal write boundary remains:

```text
Review
  → Approve suggestions
  → Apply plan
  → Confirm & write
```

The application API now also exposes:

```js
app.approveAllSuggestions()
```

and the Electron preload exposes:

```js
window.swingSync.approveAllSuggestions()
```


## v15.5 — Apply action at the top

The **Apply changes** button now appears in the Apply view header beside the
output-mode card, following the same high-visibility pattern used for bulk
approval in Review.

The lower panel keeps the pending-track and FFmpeg safety information but no
longer duplicates the Apply button.

## New-batch attention cue

`BpmApplication` now exposes:

```text
analysisBatchRevision
```

in application state. It increments only when a full `analyzeAll()` batch
finishes.

The Apply view uses that revision to briefly emphasize **Apply changes** the
first time the user opens Apply for that completed analysis batch.

Revisiting Apply during the same batch does not replay the animation. Running
a new full analysis creates a new revision and enables the cue again.

The cue lasts approximately 1.8 seconds and respects the user's
`prefers-reduced-motion` setting.


## v15.6 — Sing, Sing, Sing regression

This version adds a conservative double-time signal for recordings where the
global tracker confidently locks to half-time.

The motivating regression is:

```text
Benny Goodman and His Orchestra - Sing, Sing, Sing (Audio).mp3

acoustic lock:       approximately 112 BPM
musical preference:  approximately 225 BPM
```

The rule is deliberately not based on a BPM range.

SwingSync now checks whether onsets appear:

1. near the exact midpoint between consecutive half-time beats
2. in long consecutive runs
3. across a meaningful share of the analyzed intervals
4. with very small normalized timing error

This distinguishes a stable quarter-note pulse at double tempo from isolated
fills, ordinary syncopation, or swung offbeats.

The new evidence item is:

```text
sustainedMidpointPulse
```

It contributes only one point. Candidate consensus and midpoint evidence are
still required, and the overall double-time threshold remains 5 points.

The benchmark references the attached song by filename but the audio file is
not included in the SwingSync archive.


## v15.7 branding refresh

This version incorporates the provided SwingSync logo artwork into the desktop UI.

Changes:

- the `SS` placeholder mark is replaced with the uploaded SwingSync logo
- the logo now appears as a beveled mark in the top-left brand area
- the loading screen uses the branded logo as well
- Electron now uses a packaged square icon derived from the same artwork

## v15.7 color theme

The desktop theme now follows the logo palette more closely:

- soft cream backgrounds
- warm tan panels
- darker brown text for contrast
- orange-brown accent buttons and highlights

## Translation fix

The Spanish localization typo was corrected:

```text
Tempo oble -> Tempo doble
```


## v15.8 — Light / Dark themes

The desktop now has a persistent Light/Dark theme toggle in the top bar.

The selected theme is stored in:

```text
swingsync.theme
```

Light remains the first-run default to preserve the existing warm cream
appearance.

Both themes use the SwingSync logo palette:

```text
Light: cream / tan / dark brown / burnt orange
Dark:  espresso / cocoa / cream / caramel orange
```

## Contrast pass

v15.8 specifically improves visibility for:

- Library / Review / Apply navigation
- language/theme toggles
- library and apply tables
- selected/hover rows
- status pills
- confidence values
- review list states
- confirmation modal
- track inspector drawer
- warning/success/error banners

## Logo

The beveled top-left logo keeps its inset/shadow depth but no longer has a
visible outline/border.


## v15.9 — Rhythm and Blues profile

The former Boogie-Woogie profile is now canonically:

```text
rhythm-and-blues
```

CLI usage:

```powershell
swingsync --profile rhythm-and-blues
```

Legacy profile names are deliberately rejected:

```text
boogie
boogie-woogie
```

## v15.9 — Apply state lifecycle

A completed output is valid for the interpretation/output configuration that
produced it. SwingSync now resets per-track output state when:

- a track is analyzed again
- the profile changes
- a review decision changes or is cleared
- the output mode changes

The state summary now includes:

```text
pendingToApply
```

This is the actual number of currently approved/automatic tracks that have not
yet been applied for the current interpretation.

The desktop no longer calculates the Apply badge using:

```text
readyToApply - outputApplied
```

so the badge cannot become negative after re-analysis or a profile switch.


## v15.10 — Compact summary surfaces

The shared `summary-card` component is now more compact on both Library and
Apply:

- reduced vertical padding
- smaller minimum height
- tighter value/label spacing
- smaller inter-card gaps

The Library folder strip is also shorter, with more compact chips and margins.

## v15.10 — Library flow steps

The three primary Library actions now include numbered step badges:

```text
1  Choose folders
2  Open library
3  Analyze library
```

The numbering is visual guidance only; existing behavior and enabled/disabled
logic are unchanged.

## Spanish copy

The final confirmation action is now:

```text
Confirmar y escribir
```


## v15.11 — Brand tagline

The desktop tagline is now:

```text
Tempo intelligence for a golden era of music
```

Spanish:

```text
Inteligencia en tempo para una era musical dorada
```

## v15.11 — Library filters after Apply

Library filters now represent current pending workflow state:

```text
Review = unresolved review decisions only
Ready  = approved/automatic tracks not yet applied
All    = every track, including Applied
```

Previously, Review and Ready were based partly on historical eligibility, so
Applied tracks could still appear even when the tab count was zero.

The Review segmented-control count now uses `reviewRemaining`.

The "Analysis complete?" workflow prompt now appears only when there is actual
pending work:

```text
reviewRemaining > 0
or
pendingToApply > 0
```

This prevents "Review 0 remaining" from appearing after a completed review/apply
pass.

## Author credit

The desktop footer now displays:

```text
SwingSync v0.15.11 - By Diego Pablos
```


## v15.12 — Header compacting

The top app header now uses less vertical space:

- reduced top/bottom padding
- slightly reduced header height
- less whitespace between the header and Library/Review/Apply content

## v15.12 — Main heading scale

The primary `h1` titles in Library, Review and Apply are slightly smaller while
retaining the same visual hierarchy.

## v15.12 — SwingSync wordmark font

The header wordmark now requests:

```css
font-family: "Manbow Lines-Regular", "Manbow Lines", ...;
```

Manbow Lines-Regular is now integrated as a local Vite asset. Install your
licensed copy once with:

```powershell
npm run desktop:font:install -- "C:\path\to\manbow.zip"
```

After installation, Vite bundles the font into the Electron renderer, so the
built desktop application no longer depends on the font being installed on the
end user's operating system.

## Spanish tagline

The Spanish tagline is now:

```text
Inteligencia en tempo para una era musical dorada
```


## v15.13 — Manbow Lines local bundling

The project now has a cross-platform Node installer for the Manbow archive:

```powershell
npm run desktop:font:install -- "C:\path\to\manbow.zip"
```

It extracts only:

```text
Manbow Lines.otf
```

and writes it as:

```text
desktop/renderer/src/assets/fonts/Manbow-Lines.otf
```

The renderer declares the font through `@font-face`, so Vite fingerprints and
bundles it into the built desktop renderer.

`desktop:dev` and `desktop:build` now verify that the local font asset has been
installed first and provide the command above when it is missing.


## v15.14 — Header wordmark

The `SwingSync` text in the application header is now approximately 50% larger.

The final wordmark size is:

```css
.brand-name {
  font-size: 24px;
  line-height: 1;
}
```

The Manbow Lines-Regular integration and compact header dimensions are otherwise
unchanged.


## v15.15 — Continue to Apply count

The Review header now shows the same pending-output count used by the top
navigation Apply badge:

```text
Continue to Apply  [12]
```

The source of truth remains:

```js
state.summary.pendingToApply
```

so the Review button and the top Apply navigation cannot disagree about the
number of files currently waiting for output.

## Approval feedback

When a Review decision creates newly pending Apply work, **Continue to Apply**
briefly replays the same attention animation used by the Apply screen.

This includes:

- approving the suggested BPM for one track
- bulk **Approve N suggestions**
- approving detected/custom BPM when that decision newly makes the track ready

Changing an already-approved decision without increasing the pending count does
not trigger a new pulse.


## v15.16.1 — CSS parsing hotfix

v15.16 accidentally wrote escaped newline sequences (`\n`) as literal text in
the final Review UI CSS block.

This caused Vite/PostCSS to fail with an error similar to:

```text
Unknown word gap
```

The stylesheet now contains normal line breaks and the v15.16 Review styles are
valid CSS again.


## v15.16.2 — Electron Builder install-script approval

SwingSync now pins:

```json
"electron-builder": "26.15.3"
```

and explicitly allows the reviewed install scripts required by the project:

```json
"allowScripts": {
  "ffmpeg-static@5.3.0": true,
  "electron-winstaller@5.4.0": true
}
```

`electron-winstaller@5.4.0` is a transitive dependency of
`electron-builder-squirrel-windows@26.15.3`.

Keeping the approval version-pinned means npm will warn again if a future
dependency update introduces a different install-script version, which is
intentional.


## v15.17 — Single-file Windows portable build

SwingSync is configured for Electron Builder's Windows `portable` target.

After dependencies and the local Manbow font asset are installed:

```powershell
npm run desktop:package:win
```

Output:

```text
release\SwingSync-0.15.17-Windows-x64.exe
```

That `.exe` is the only file a Windows tester needs.

For a quicker runtime/package smoke test before producing the final portable
wrapper:

```powershell
npm run desktop:package:win:unpacked
```

### First build from a fresh source archive

The source ZIP does not redistribute the Manbow font binary. Install your own
licensed copy once:

```powershell
npm run desktop:font:install -- "C:\path\to\manbow.zip"
```

Then:

```powershell
npm install
npm run desktop:package:win
```

### FFmpeg packaging

SwingSync launches FFmpeg using `child_process.spawn()`. Electron Builder now
explicitly unpacks:

```text
node_modules/ffmpeg-static/**/*
```

from ASAR. SwingSync also translates an FFmpeg path containing `app.asar` to
the corresponding `app.asar.unpacked` path before starting the process.

### Unsigned beta builds

The portable executable can be built without a signing certificate. Windows
SmartScreen may warn a tester because the executable is unsigned/new. Signing
can be added later for broader distribution.


## v15.18 — Fixed-height footer

The desktop status bar now remains at its compact 34px height even when the
current view contains very little content.

The app-shell grid rows are now assigned explicitly:

```text
1  Header
2  Optional error banner
3  Main view (absorbs remaining height)
4  Status bar (34px)
```

This prevents CSS Grid auto-placement from moving the footer into the flexible
`1fr` content row when the optional error banner is absent.


## v15.19 — Custom BPM input

The Custom BPM field now follows the active Light/Dark theme rather than using
a hard-coded dark background.

Its number input step is now:

```html
step="1"
```

because SwingSync ultimately applies whole-number BPM metadata.

## v15.19 — Skip track action

**Skip this track** is now rendered as a visible secondary button with a
danger-tinted treatment instead of a low-emphasis text link.

## v15.19 — Analysis Complete Review count

The Library workflow CTA now renders the unresolved Review count as a badge
while preserving the localized word order:

```text
Review [12] remaining
```

The entire Analysis Complete CTA briefly highlights once when it first appears
after each completed full-library analysis batch. The cue is keyed to
`analysisBatchRevision`, stored in session storage, and does not replay simply
because the user navigates away and returns.


## v15.19.1 — Custom BPM theme correction

The v15.19 Custom BPM readability override is now scoped to Light mode only.

Dark mode uses the same input styling it had before v15.19.

The whole-number input behavior remains:

```html
step="1"
```


## v15.19.2 — Review badge contrast

The unresolved Review count inside the Library workflow CTA now uses a light
foreground color in Light mode so the number remains readable against the
accent-colored badge.

Dark-mode badge styling is unchanged.


## v15.20 — Automated packaged-app smoke test

SwingSync now contains a smoke-test mode that runs inside the packaged Electron
application, plus a Windows runner that launches `release\win-unpacked`.

Test an existing unpacked package:

```powershell
npm run test:packaged
```

Build the unpacked Windows app and immediately test it:

```powershell
npm run desktop:package:win:smoke
```

Recommended release command:

```powershell
npm run desktop:package:win:verified
```

That command:

```text
1. builds the Vite renderer
2. creates the win-unpacked Electron app
3. launches the packaged SwingSync.exe in hidden smoke-test mode
4. verifies the packaged runtime
5. only if the smoke test passes, creates the portable Windows .exe
```

The packaged smoke test checks:

- Electron reports `app.isPackaged === true`
- renderer URL uses `file://`
- FFmpeg exists
- FFmpeg resolves outside `app.asar`
- the React renderer mounts and shows the SwingSync brand
- the preload bridge exposes required API methods
- the real IPC `bootstrap` call succeeds
- the bundled `Manbow Lines-Regular` font loads in the renderer

The smoke run uses a temporary Electron `userData` directory and removes it
after the test, so it does not touch the tester/developer's normal SwingSync
cache.

A failing check produces a non-zero process exit, which makes the npm release
command stop before producing the final portable artifact.


## v15.20.1 — Analysis Complete Review badge contrast

The light-mode Review-count badge inside the Analysis Complete CTA was still
rendering brown because this older rule:

```css
.workflow-cta span
```

has higher selector specificity than the previous:

```css
.workflow-review-count
```

override.

The badge is now targeted as:

```css
.workflow-cta .workflow-review-count
```

so its light cream foreground reliably wins in Light mode.

Dark-mode badge colors are unchanged.


## v15.21 — Play reviewed track in the default player

The Review editor now shows a play button immediately beside the selected
track title.

Clicking it asks Electron's main process to open the track with the operating
system's default application for that audio file.

The renderer never sends an arbitrary filesystem path. It sends only the
internal `trackId`; the main process resolves that ID through the current
`BpmApplication` state, checks that the file still exists, then calls:

```js
shell.openPath(track.file)
```

This preserves the renderer sandbox and works with the user's normal Windows,
macOS or Linux audio-file association.

The packaged-app smoke test also verifies that the packaged preload bridge
exposes the new `openTrackExternal` API. It intentionally does not launch an
external media player during automated testing.


## v15.21.1 — Review Play control layout

The Review playback action is now aligned to the far right of the title row.

Instead of a standalone circular icon, it is a rectangular action containing:

```text
Play   (▶)
```

The play arrow sits inside its own circular accent badge. The existing
OS-default-player behavior and IPC safety model are unchanged.


## v15.21.2 — Review Play alignment refinement

The Review Play control is now part of a dedicated right-side heading action
area instead of the title's inner content row.

This means it is genuinely justified against the right side of the
`review-editor-heading`, with an 8px internal inset from that heading edge.

When a review status badge is present, the status sits immediately to the left
of Play and Play remains the rightmost action.

The circular play treatment is now outline-only: the arrow has a circle drawn
around it without a filled badge background.


## v15.21.3 — Play button rollback

The Review playback control has been restored to the original v15.21 design:
a compact circular play icon beside the selected track title.

The external-player behavior, IPC safety model, packaged smoke-test contract,
and verified Windows release flow remain unchanged.


## v15.21.4 — Review Play caption

The Review screen keeps the original compact circular play button from v15.21
and adds a small localized caption directly underneath it:

```text
  ▶
 Play
```

Spanish uses `Reproducir`.

The playback behavior is unchanged: SwingSync still opens the selected track
in the operating system's default audio player.


## v15.21.5 — Adaptive Review queue height

On the desktop two-column Review layout, the review queue no longer has an
independent viewport-based maximum height.

The left queue column is now a flex column:

```text
Review queue header
↓
scroll area fills all remaining review-layout height
```

As a selected track makes the Review editor taller or shorter,
`review-list-scroll` grows or shrinks with the same `review-layout`.

For the narrow single-column layout (`max-width: 1000px`), the existing 220px
queue cap is preserved so the queue does not dominate the stacked interface.


## v15.21.6 — Editor-driven Review height

On the desktop two-column Review screen, the `review-editor` is now the only
child that participates in the height calculation of `review-layout`.

The queue column is positioned to fill that resulting height:

```text
review-editor content
        ↓
determines review-layout height
        ↓
review-list fills exactly that height
        ↓
review-list-scroll scrolls internally
```

The number of tracks in the queue therefore cannot make the Review box taller.

When the selected track produces a taller editor, the whole Review box grows
and the queue gets more visible height. When the editor becomes shorter, the
box and queue contract again.

The narrow stacked layout keeps the queue in normal document flow and retains
its 220px maximum height.


## v15.21.7 — Track Inspector spacing and close control

Inspector `detail-row` items now have a small 8px horizontal inset so labels
and values do not sit directly against the section edges.

The Human Review callout is unchanged.

The inspector close control now uses a centered SVG X instead of a text `×`
glyph. This avoids font-baseline offsets and keeps the X optically centered in
the existing 34×34 square button.


## v15.22 — Tap Tempo

Review now includes a manual Tap Tempo row above Custom BPM.

Play the track, press **Tap BPM** once per beat, and SwingSync estimates a
whole-number BPM from the median of recent tap intervals. The estimate fills
Custom BPM automatically, but the user still has to explicitly choose
**Approve custom** before anything becomes eligible for Apply.

The estimator keeps the most recent nine taps, ignores accidental ultra-fast
double clicks, and begins a fresh count after a 2.5-second pause.

Run its dependency-free test with:

```powershell
npm run test:tap-tempo
```

Track Inspector sections now use the same 8px horizontal inset as Detail
content. The separate Human Review callout is unchanged.


## v15.22.1 — Tap Tempo interaction polish

### Tap feedback

The **Tap BPM** button now gives a short visual pulse on every physical
click/tap. Re-keying the button restarts the CSS animation for every tap so
rapid rhythm input still produces distinct visual feedback.

Users with reduced-motion enabled do not receive the scale animation.

### Per-track unapproved drafts

Review now keeps a renderer-local draft for each track while the Review screen
remains open. Switching to another track and back restores:

- the last Tap BPM estimate
- the visible tap count
- the recent timing window used by the estimator
- the exact Custom BPM input value, including a manual edit that differs from
  the Tap BPM estimate

The draft is cleared once that track is explicitly approved or skipped.

### Tap count vs estimator window

The visible tap counter is no longer tied to the estimator's nine-tap rolling
window. A continuous sequence can therefore show 10, 20, 30 taps, etc.

SwingSync still calculates the estimate from only the most recent nine tap
timestamps so the BPM remains responsive to the user's current tapping rather
than becoming increasingly sluggish over a very long sequence.

A pause longer than 2.5 seconds still starts a fresh sequence and resets the
visible count to 1 on the next accepted tap.


## v15.23 — Accessibility controls

The top navigation now has an Accessibility button immediately to the left of
the workflow navigation.

Its dropdown contains persistent preferences for:

- Larger text / interface scaling
- High contrast
- Color-vision adaptive palettes:
  - Deuteranopia
  - Protanopia
  - Tritanopia
- Reduce motion
- Reset to defaults

Preferences are stored in:

```text
swingsync.accessibility
```

and restored at startup.

### Color-vision modes

These are accessibility-oriented alternate palettes, not simulations of color
blindness. They remap semantic accent, success, error and information colors
to combinations intended to remain easier to distinguish for the selected
color-vision profile.

### Reduce motion

The explicit Reduce Motion setting suppresses SwingSync's pulse/highlight
animations and transitions even when the operating system itself does not
request reduced motion.

On first use, if there is no stored SwingSync preference, the setting respects
the operating system's `prefers-reduced-motion` value.

### Accessibility settings test

```powershell
npm run test:accessibility
```


## v15.24 — Canonical filename BPM prefix

Filename output now uses the explicit canonical format:

```text
[120 BPM] Song.mp3
```

SwingSync recognizes and replaces its older `[120]` prefix, the canonical
`[120 BPM]` prefix, and the legacy `Song [120 BPM]` suffix before writing a new
value. Re-analysis or a changed review decision can therefore replace an old BPM
decoration cleanly instead of stacking another prefix.

Run:

```powershell
npm run test:filename-output
```

## v15.24 — Reset a track to Pending

The Library Track Inspector now includes **Reset to pending**. It clears that
track's current analysis, review decision and Apply state, removes its analysis
cache entry, and returns the track to Pending so the next analysis is recomputed.
It does not undo file changes that were already written; use the Apply backup
feature for that.

## v15.24 — Profile and Output guidance

The Profile and Output dropdowns expose the selected option's effect through a
native hover tooltip and an `aria-describedby` description for assistive
technology. Profile guidance is sourced from the actual profile descriptions;
Output guidance explains metadata-only, filename-only and combined behavior.

## v15.24 — Optional Apply backup and Undo last Apply

The Apply screen now has a persistent optional setting:

```text
☐ Create backup before modifying files
```

When enabled, SwingSync copies every file that is actually planned to change
before the first write starts. The last backup set lives beside the application
cache in SwingSync's user-data directory.

**Undo last Apply** restores the backed-up bytes and, when filename output was
used, restores the original filename as well. After a successful undo, that
backup set is removed.

Starting a later Apply with backups disabled invalidates any older backup so the
Undo action can never point at an earlier Apply pass.

Run the backup regression test with:

```powershell
npm run test:backup
```


## v15.24.1 — Development DevTools

Chromium DevTools are explicitly enabled only when SwingSync is running from
the Vite development server (`npm run desktop:dev`).

Development shortcuts:

```text
F12
Ctrl+Shift+I      Windows / Linux
Cmd+Option+I      macOS
```

The shortcut toggles detached Chromium DevTools.

Packaged and normal built runs explicitly set Electron `webPreferences.devTools`
to false, so these shortcuts do not expose DevTools in release builds.

### Auditioning locally installed fonts

Chromium DevTools can use fonts installed on the developer machine. Inspect an
element and temporarily add, for example:

```css
font-family: "Font Family Name", sans-serif;
```

This is useful for visual experimentation only. A font selected for the final
product should still be bundled with SwingSync (subject to its license) so the
UI does not depend on fonts installed on an end user's machine.


## v15.25 — Brand typography refresh

Header changes:

- Removes the logo artwork from the top-left header; the loading screen can
  still use the existing artwork.
- Changes the visible wordmark from `SwingSync` to `Swing/Sync`.
- Wordmark size is now `68px`.
- Tagline uses locally supplied Peignot at `20px`.
- Workflow navigation and topbar controls use locally supplied Engebrechtre.
- Library / Review / Apply navigation text increases from `12px` to `14px`.
- Accessibility moves immediately to the left of the Light/Dark theme toggle.
- Profile and Output explanatory tooltips deliberately keep the original UI
  font stack for small-text legibility.

Before running the desktop app or making a build, install the three local font
families:

```powershell
npm run desktop:font:install -- "C:\path\to\manbow.zip"
npm run desktop:font:install:peignot -- "C:\path\to\peignot.zip"
npm run desktop:font:install:engebrechtre -- "C:\path\to\engebrechtre.zip"
```

The source ZIP does not contain the font binaries.

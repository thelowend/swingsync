# SwingSync v15.16 — Review guard + Rhythm and Blues default

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
[215] Rock, rock, rock.mp3
```

A later run replaces an existing SwingSync BPM prefix rather than stacking it:

```text
[215] Rock, rock, rock.mp3
→
[220] Rock, rock, rock.mp3
```

Legacy suffix filenames are migrated automatically:

```text
Rock, rock, rock [215 BPM].mp3
→
[220] Rock, rock, rock.mp3
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


## v15.16 — Bulk approval count badge

The Review bulk action now displays its unresolved count in a badge, e.g. `Approve suggestions [12]`.

## v15.16 — Unresolved Review warning

Clicking **Continue to Apply** while unresolved review decisions remain now opens a warning modal. Users can continue with approved tracks only or keep reviewing.

## v15.16 — Default profile

`rhythm-and-blues` is now the default. Profile order is **Rhythm and Blues → Swing → Generic**. CLI with no `--profile` uses Rhythm and Blues.

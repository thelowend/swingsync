# SwingSync v15.2 — User-refined Rioplatense copy

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
    "profile": "boogie",
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

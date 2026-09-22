# SwingSync v14 — Review, Approve & Apply

SwingSync is a desktop and CLI application for swing/boogie-aware tempo
analysis and BPM synchronization.

v14 completes the first full desktop workflow:

```text
Analyze → Human Review → Apply Plan → Confirm & Write
```

## Run the desktop app

```powershell
npm install
npm run desktop:dev
```

For a production renderer build followed by Electron:

```powershell
npm run desktop:run
```

## The important safety rule

Analyzing and reviewing never modify your music files.

A review choice such as:

```text
Approve suggested: 226.9 BPM
```

records the human decision in application state only.

Files are modified only after opening **Apply**, inspecting the plan, pressing
**Apply changes**, and then pressing:

```text
Confirm & write
```

## Review screen

Tracks whose interpretation is uncertain appear in the Review queue.

You can choose:

- detected BPM
- SwingSync suggested BPM
- custom BPM
- skip

You can also clear and revise a prior decision.

## Apply screen

Before writing, SwingSync shows every approved pending track with:

- existing BPM tag
- selected BPM
- human/automatic approval source
- metadata write status
- filename plan where applicable
- unsupported outputs

The apply-plan API is read-only:

```js
app.getApplyPlan()
```

## Output modes

The desktop retains the three existing modes:

```text
metadata
filename
both
```

Metadata remains the default.

## npm install-script approval

`ffmpeg-static` is now pinned to:

```text
5.3.0
```

and the project commits:

```json
"allowScripts": {
  "ffmpeg-static@5.3.0": true
}
```

so a clean `npm install` should no longer require manually approving the
package's install script each time.

## CLI

The CLI is unchanged:

```powershell
swingsync --profile boogie
swingsync --profile boogie --review --apply
```

Default/multiple music folders continue to come from `.env` when no positional
folders are supplied.

## Architecture

```text
React
  │
  │ narrow preload API
  ▼
Electron IPC
  │
  ▼
BpmApplication
  ├── getReviewQueue()
  ├── submitReview()
  ├── getApplyPlan()
  └── applyAllApproved()
       │
       ▼
 metadata writer / filename adapter
```

See `DESKTOP.md`, `CLIENT_API.md`, and `ARCHITECTURE.md`.

# SwingSync Desktop — v14 Review & Apply workflow

SwingSync v14 completes the first end-to-end desktop workflow:

```text
Library
  ↓
Analyze
  ↓
Review uncertain tracks
  ↓
Approve BPM decisions
  ↓
Inspect apply plan
  ↓
Final confirmation
  ↓
Write metadata / rename
```

## Development

```powershell
npm install
npm run desktop:dev
```

The npm install-script approval for the pinned `ffmpeg-static@5.3.0` dependency
is now committed in `package.json`, so a fresh install should not require a
separate:

```powershell
npm install-scripts approve ffmpeg-static
```

step.

## Review

After analysis, use the **Review** tab.

For every review-required track you can:

- approve the acoustic detected BPM
- approve SwingSync's genre-aware suggested BPM
- enter and approve a custom BPM
- skip the track
- clear/change a previous review decision

Review decisions are application state only. They do **not** write the audio
file.

The app distinguishes:

```text
Review     unresolved human decision
Approved   human BPM decision recorded
Skipped    deliberately excluded
Ready      high-confidence automatic decision
Applied    output has been committed
```

## Apply plan

Use the **Apply** tab to inspect a pure read-only plan before anything is
written.

The plan shows:

- existing BPM metadata
- approved BPM
- human vs automatic approval
- whether metadata will be written
- whether it already matches
- unsupported metadata formats
- filename changes when filename/both output is selected

`BpmApplication.getApplyPlan()` builds this view without mutating files.

## Final write boundary

Pressing **Apply changes** opens a second confirmation modal.

Only:

```text
Confirm & write
```

calls:

```js
app.applyAllApproved({
  applyChanges: true,
});
```

This is the explicit file-mutation boundary in the desktop application.

## Repeated apply protection

Already-applied tracks are excluded from future batch apply plans and batch
apply runs.

After a successful metadata write, the in-memory metadata BPM is also updated
so the application reflects the value that was written.

## IPC

v14 adds:

```text
swingsync:get-apply-plan
```

and the preload API:

```js
window.swingSync.getApplyPlan()
```

The renderer still never receives raw Node.js or Electron APIs.

# SwingSync v11.1 — client-facing application API

**SwingSync** is now the product name for the application.

The existing internal code vocabulary remains intentionally technical:
`BpmApplication`, `analyzeTrack()`, tempo reconciliation, BPM metadata, and
the other established module names are unchanged.

The product name gives us room to grow beyond simply "detect BPM": the app is
becoming a music-library tempo synchronization and review tool.

## Install

```bash
npm install
```

If installed or linked as a CLI package:

```bash
swingsync "D:\Music" --profile boogie
```

A source checkout can still be run exactly as before:

```bash
node index.cjs "D:\Music" --profile boogie
```

## Existing CLI workflows

```bash
swingsync "D:\Music" --profile boogie
swingsync "D:\Music" --profile boogie --review --apply
swingsync "D:\Music\TEST" --benchmark benchmark.json
```

Metadata remains the default output.

## Client API

```js
const {
  createBpmApplication,
  PRODUCT_NAME,
} = require("./src/client/public-api.cjs");

console.log(PRODUCT_NAME);
// SwingSync

const app =
  await createBpmApplication();

await app.openLibrary({
  folder: "D:\\Music",
  profile: "boogie",
  outputMode: "metadata",
});

await app.analyzeAll();

console.log(
  app.getState()
);

console.log(
  app.getReviewQueue()
);

await app.close();
```

See:

- `CLIENT_API.md`
- `ARCHITECTURE.md`
- `examples/client-api-example.cjs`

## Product vs internal naming

User-facing branding:

```text
SwingSync
swingsync              CLI/package command
.swingsync-cache.json  default cache
```

Internal code remains:

```text
BpmApplication
createBpmApplication()
analyzeTrack()
applyBpmOutput()
tempo/*
review/*
```

That separation is intentional. Product naming can evolve without forcing a
large domain/API rename.

## Key application API

```js
await app.openLibrary(...)
await app.analyzeAll()
await app.analyzeOne(trackId)

app.getState()
app.getTracks()
app.getTrackDetails(trackId)
app.getReviewQueue()
app.getCapabilities()

app.setProfile("boogie")
app.setOutputMode("metadata")

app.submitReview({
  trackId,
  action: "use-suggested",
})

await app.applyTrack(trackId)
await app.applyAllApproved()

await app.close()
```

## Product capabilities

```js
app.getCapabilities();
```

now includes:

```json
{
  "product": {
    "name": "SwingSync",
    "packageName": "swingsync",
    "cliCommand": "swingsync"
  }
}
```

This lets a future visual client consume the brand without duplicating it.

## Events

```js
app.on("state", ...)
app.on("progress", ...)
app.on("track", ...)
app.on("review", ...)
app.on("output", ...)
app.on("error", ...)
```

All event payloads remain plain serializable objects.

## Cache rename and migration

The new default cache is:

```text
.swingsync-cache.json
```

On first use, if SwingSync does not find that file but does find the previous:

```text
.bpm-cache.json
```

it copies the legacy cache to the new name automatically.

The legacy file is left in place so an older project version can still use it.

Custom cache paths supplied with `--cache-file` are unaffected.

## Package entry point

`package.json` uses:

```text
name: swingsync
main: src/client/public-api.cjs
bin:  swingsync -> index.cjs
```

The package remains `private: true`, so this naming change does not imply
publishing it to npm.

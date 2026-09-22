# SwingSync v12 — default and multiple music folders

SwingSync can now get its music library roots from `.env`, so you no longer
need to type a folder on every run.

It also supports **multiple library roots**.

## Install

```bash
npm install
```

`dotenv` is now included as a dependency.

## Configure default music folders

Copy:

```text
.env.example
```

to:

```text
.env
```

and edit:

```env
SWINGSYNC_MUSIC_FOLDERS=D:\Music\Swing;D:\Music\Boogie;E:\Dance Music
```

Semicolons are used as the default separator because Windows drive paths
already contain `:`.

Relative paths are also allowed and are resolved from the current working
directory.

A JSON array is supported too:

```env
SWINGSYNC_MUSIC_FOLDERS=["D:\\Music\\Swing","E:\\Dance Music"]
```

`.env` is ignored by Git while `.env.example` is committed.

## Run with configured defaults

Once `.env` is configured:

```bash
swingsync --profile boogie
```

or from a source checkout:

```bash
node index.cjs --profile boogie
```

SwingSync loads every folder listed in `SWINGSYNC_MUSIC_FOLDERS`.

## Override from the command line

One folder:

```bash
swingsync "D:\Music\TEST" --profile boogie
```

Multiple folders:

```bash
swingsync \
  "D:\Music\Swing" \
  "D:\Music\Boogie" \
  "E:\Rock and Roll" \
  --profile boogie
```

When at least one positional folder is supplied, the command-line list
**replaces** the `.env` defaults for that run.

## Overlapping roots

If configured folders overlap, for example:

```text
D:\Music
D:\Music\Swing
```

the same physical file path is analyzed only once.

The first configured root that discovers the file becomes its `rootFolder`
for relative paths and reports.

## Interactive review

Using `.env` defaults:

```bash
swingsync --profile boogie --review
```

Apply reviewed BPM metadata:

```bash
swingsync --profile boogie --review --apply
```

## Benchmark

Benchmark files are resolved across all configured roots:

```bash
swingsync --benchmark benchmark.json
```

If a relative benchmark filename exists in more than one configured root,
SwingSync reports it as ambiguous rather than silently choosing one.

Absolute file paths in `benchmark.json` continue to work.

## Reports

JSON analysis/review reports now contain:

```json
{
  "folder": "first root for backward compatibility",
  "folders": [
    "D:\\Music\\Swing",
    "D:\\Music\\Boogie"
  ]
}
```

CSV rows include:

```text
rootFolder
relativePath
```

so files remain attributable to the correct music root.

## Client API

The client API accepts either the old single-folder form:

```js
await app.openLibrary({
  folder: "D:\\Music\\Swing",
  profile: "boogie",
});
```

or multiple folders:

```js
await app.openLibrary({
  folders: [
    "D:\\Music\\Swing",
    "D:\\Music\\Boogie",
  ],
  profile: "boogie",
});
```

If neither `folder` nor `folders` is supplied:

```js
await app.openLibrary({
  profile: "boogie",
});
```

the client API uses `DEFAULT_MUSIC_FOLDERS` loaded from `.env`.

Application state now exposes:

```json
{
  "library": {
    "folders": [
      "D:\\Music\\Swing",
      "D:\\Music\\Boogie"
    ],
    "folder": "D:\\Music\\Swing",
    "profile": "boogie",
    "outputMode": "metadata"
  }
}
```

`library.folder` is retained as a backward-compatible alias for the first
root.

## Configuration API

The public API exports:

```js
const {
  MUSIC_FOLDERS_ENV_VAR,
  DEFAULT_MUSIC_FOLDERS,
  parseMusicFolders,
  resolveMusicFolders,
} = require("./src/client/public-api.cjs");
```

The requested config variable is:

```js
DEFAULT_MUSIC_FOLDERS
```

and its initial value comes from:

```text
SWINGSYNC_MUSIC_FOLDERS
```

in `.env`.

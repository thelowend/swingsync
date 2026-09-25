# Local font assets

SwingSync currently uses three locally supplied font families in the desktop UI:

- **Manbow Lines-Regular** — `Swing/Sync` wordmark
- **Peignot** — brand tagline
- **Engebrechtre** Regular + Bold — topbar menus and controls

The source archive intentionally does **not** redistribute those font binaries.

Install your local copies before development or building:

```powershell
npm run desktop:font:install -- "C:\path\to\manbow.zip"
npm run desktop:font:install:peignot -- "C:\path\to\peignot.zip"
npm run desktop:font:install:engebrechtre -- "C:\path\to\engebrechtre.zip"
```

They are written locally as:

```text
Manbow-Lines.otf
Peignot.ttf
Engebrechtre-Regular.otf
Engebrechtre-Bold.otf
```

Run the preflight directly with:

```powershell
npm run desktop:font:check
```

`desktop:dev` and `desktop:build` run this check automatically. Vite then bundles
the installed local font assets into the desktop renderer.

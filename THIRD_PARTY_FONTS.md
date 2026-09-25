# Third-party font assets

## Manbow Lines-Regular

SwingSync uses `Manbow Lines.otf` for the `SwingSync` header wordmark.

The font archive was supplied by the project owner from 1001fonts.com. The
archive supplied to this project contains the Manbow font files but does not
include a separate license/readme text file.

The project owner has indicated that the source page marks the font as free for
commercial use.

The SwingSync source archive intentionally does not redistribute the font
binary. Use the local installer with your own copy:

```powershell
npm run desktop:font:install -- "C:\path\to\manbow.zip"
```

Once installed locally, Vite includes the font in the built Electron renderer,
so end users of that locally produced desktop build do not need Manbow
installed system-wide.


## Peignot

SwingSync uses `Peignot.ttf` for the header tagline.

The supplied `peignot` archive contains `OFL.txt`. SwingSync's source archive
does not redistribute the font binary; install the local copy with:

```powershell
npm run desktop:font:install:peignot -- "C:\path\to\peignot.zip"
```

## Engebrechtre

SwingSync uses the Regular and Bold faces from the supplied Engebrechtre
archive for topbar navigation and controls.

The source archive intentionally does not redistribute the font binaries.
Install your local copy with:

```powershell
npm run desktop:font:install:engebrechtre -- "C:\path\to\engebrechtre.zip"
```

The supplied archive did not include a separate license text file in the ZIP
itself, so verify the font's distribution license before distributing a build
that embeds it.

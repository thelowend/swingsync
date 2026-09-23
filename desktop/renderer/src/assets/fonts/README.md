# Local font assets

SwingSync uses **Manbow Lines-Regular** for the header wordmark.

Install your licensed local copy with:

```powershell
npm run desktop:font:install -- "C:\path\to\manbow.zip"
```

The installer accepts the original archive containing `Manbow Lines.otf`, or
the `.otf` file directly.

The installed file will be written here as:

```text
Manbow-Lines.otf
```

Vite then packages that asset into the desktop renderer build.

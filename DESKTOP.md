# SwingSync Desktop v15 — Localization

## Supported languages

```text
en  English
es  Español
```

Use the `EN | ES` toggle in the application top bar.

The preference is stored under:

```text
swingsync.language
```

in the renderer's local storage.

## First-run behavior

If there is no stored preference, SwingSync checks `navigator.language`.

Locales beginning with:

```text
es
```

start in Spanish. Otherwise SwingSync starts in English.

## Translation boundary

Localization lives only in the renderer:

```text
React component
  ↓
useLanguage()
  ↓
English source string / domain code
  ↓
Spanish dictionary when language === es
```

The Electron main process and `BpmApplication` do not need to know the
selected language.

## Domain-safe localization

The application continues to pass stable values across IPC:

```text
confidence = medium
relationship = double-time
outputMode = metadata
```

The UI displays:

```text
English                     Spanish

Medium                      Media
Double time                 Doble tempo
Metadata                    Metadatos
```

## Reason codes

Tempo interpretation now returns `reasonCode` + `reasonParams` in addition to
the existing canonical English `reason`.

This is the pattern to use for future engine messages that need localization:
add stable codes/parameters, not language-specific strings to the engine.

## Adding another language

1. Add the language to `SUPPORTED_LANGUAGES`.
2. Add a translation dictionary alongside `SPANISH_TRANSLATIONS`.
3. Extend `LanguageContext` to select that dictionary.
4. No audio/tempo/application-domain changes should be necessary.

If the translation dictionary does not contain a source message, SwingSync
falls back to English.


## Spanish dialect

`es` currently represents Argentine Rioplatense Spanish.

Examples:

```text
Choose folders       → Elegí carpetas
Analyze library      → Analizá biblioteca
Approve suggested    → Aprobá sugerido
You can go back      → Podés volver
Confirm & write      → Confirmá y escribí
Beat median          → BPM mediano
```

The localization deliberately favors the term `BPM` instead of `pulsaciones`
for tempo-related concepts.

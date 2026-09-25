const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(
  __dirname,
  ".."
);

const checks = [
  {
    label:
      "Manbow Lines-Regular",
    path: path.join(
      root,
      "desktop",
      "renderer",
      "src",
      "assets",
      "fonts",
      "Manbow-Lines.otf"
    ),
    help:
      'npm run desktop:font:install -- "path/to/manbow.zip"',
  },
  {
    label:
      "Peignot",
    path: path.join(
      root,
      "desktop",
      "renderer",
      "src",
      "assets",
      "fonts",
      "Peignot.ttf"
    ),
    help:
      'npm run desktop:font:install:peignot -- "path/to/peignot.zip"',
  },
  {
    label:
      "Engebrechtre Regular",
    path: path.join(
      root,
      "desktop",
      "renderer",
      "src",
      "assets",
      "fonts",
      "Engebrechtre-Regular.otf"
    ),
    help:
      'npm run desktop:font:install:engebrechtre -- "path/to/engebrechtre.zip"',
  },
  {
    label:
      "Engebrechtre Bold",
    path: path.join(
      root,
      "desktop",
      "renderer",
      "src",
      "assets",
      "fonts",
      "Engebrechtre-Bold.otf"
    ),
    help:
      'npm run desktop:font:install:engebrechtre -- "path/to/engebrechtre.zip"',
  },
];

const missing =
  checks.filter(
    (check) =>
      !fs.existsSync(
        check.path
      )
  );

if (
  missing.length === 0
) {
  process.exit(0);
}

console.error(
  [
    "",
    "SwingSync local UI fonts are incomplete.",
    "",
    ...missing.flatMap(
      (check) => [
        `Missing: ${check.label}`,
        `  Install with: ${check.help}`,
      ]
    ),
    "",
    "Then rerun the desktop command.",
    "",
  ].join("\n")
);

process.exit(1);

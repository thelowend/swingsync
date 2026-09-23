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
      'Run: npm run desktop:font:install -- "path/to/manbow.zip"',
  },
  {
    label:
      "SwingSync build icon",
    path: path.join(
      root,
      "build",
      "icon.png"
    ),
    help:
      "The build/icon.png resource is missing.",
  },
];

let failed = false;

for (
  const check of checks
) {
  if (
    fs.existsSync(
      check.path
    )
  ) {
    continue;
  }

  failed = true;

  console.error(
    [
      "",
      `${check.label} is missing.`,
      check.help,
    ].join("\n")
  );
}

if (failed) {
  process.exit(1);
}

console.log(
  "SwingSync Windows packaging preflight passed."
);

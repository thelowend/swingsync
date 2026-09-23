const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(
  __dirname,
  ".."
);

const fontPath =
  path.join(
    root,
    "desktop",
    "renderer",
    "src",
    "assets",
    "fonts",
    "Manbow-Lines.otf"
  );

if (
  fs.existsSync(
    fontPath
  )
) {
  process.exit(0);
}

console.error(
  [
    "",
    "Manbow Lines-Regular has not been installed into this SwingSync checkout.",
    "",
    "Install your licensed copy first:",
    "",
    '  npm run desktop:font:install -- "path/to/manbow.zip"',
    "",
    "Then rerun the desktop command.",
    "",
  ].join("\n")
);

process.exit(1);

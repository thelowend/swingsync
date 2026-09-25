const assert = require("node:assert/strict");
const path = require("node:path");

const {
  buildNewFilename,
  cleanExistingBpmDecoration,
} = require("../src/files/naming.cjs");

const root = path.resolve("C:/Music");

function file(name) {
  return path.join(root, name);
}

assert.equal(
  path.basename(
    buildNewFilename(
      file("Song.mp3"),
      120.4
    )
  ),
  "[120 BPM] Song.mp3"
);

assert.equal(
  path.basename(
    buildNewFilename(
      file("[100] Song.mp3"),
      120
    )
  ),
  "[120 BPM] Song.mp3"
);

assert.equal(
  path.basename(
    buildNewFilename(
      file("[100 BPM] Song.mp3"),
      120
    )
  ),
  "[120 BPM] Song.mp3"
);

assert.equal(
  path.basename(
    buildNewFilename(
      file("Song [100 BPM].mp3"),
      120
    )
  ),
  "[120 BPM] Song.mp3"
);

assert.equal(
  path.basename(
    buildNewFilename(
      file("[120 BPM] Song.mp3"),
      120
    )
  ),
  "[120 BPM] Song.mp3"
);

assert.equal(
  cleanExistingBpmDecoration(
    "[88 BPM] Jump Blues"
  ),
  "Jump Blues"
);

console.log(
  "Filename output tests passed."
);

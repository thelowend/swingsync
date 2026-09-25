import assert from "node:assert/strict";

import {
  addTempoTap,
  estimateTapTempoBpm,
} from "../desktop/renderer/src/utils/tapTempo.mjs";

assert.equal(
  estimateTapTempoBpm([0, 500, 1000, 1500]),
  120
);

assert.equal(
  estimateTapTempoBpm([0, 498, 1005, 1501, 2000]),
  120
);

assert.equal(
  estimateTapTempoBpm([0, 333, 667, 1000]),
  180
);

let taps = [];
taps = addTempoTap(taps, 1000);
taps = addTempoTap(taps, 1500);

assert.deepEqual(taps, [1000, 1500]);

const ignored = addTempoTap(taps, 1600);
assert.deepEqual(ignored, taps);

const restarted = addTempoTap(taps, 5000);
assert.deepEqual(restarted, [5000]);


let rolling = [];

for (let index = 0; index < 15; index += 1) {
  rolling = addTempoTap(
    rolling,
    index * 500
  );
}

assert.equal(
  rolling.length,
  9
);

assert.equal(
  estimateTapTempoBpm(
    rolling
  ),
  120
);

console.log("Tap Tempo tests passed.");

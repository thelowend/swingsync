const {
  TEMPO_MATCH_TOLERANCE,
} = require("../config.cjs");

function median(values) {
  if (!values || values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}
function differencePercent(a, b) {
  if (
    !Number.isFinite(a) ||
    !Number.isFinite(b) ||
    a <= 0 ||
    b <= 0
  ) {
    return Infinity;
  }

  return (
    (Math.abs(a - b) / ((a + b) / 2)) *
    100
  );
}
function approximatelyDouble(faster, slower) {
  if (
    !Number.isFinite(faster) ||
    !Number.isFinite(slower) ||
    faster <= slower
  ) {
    return false;
  }

  return (
    differencePercent(faster, slower * 2) <=
    TEMPO_MATCH_TOLERANCE
  );
}
function approximatelyThreeTwoLower(lower, upper) {
  if (
    !Number.isFinite(lower) ||
    !Number.isFinite(upper) ||
    lower >= upper
  ) {
    return false;
  }

  return (
    differencePercent(
      lower,
      upper * (2 / 3)
    ) <= TEMPO_MATCH_TOLERANCE
  );
}

module.exports = {
  median,
  differencePercent,
  approximatelyDouble,
  approximatelyThreeTwoLower,
};

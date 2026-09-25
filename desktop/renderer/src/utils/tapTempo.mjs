export const TAP_TEMPO_RESET_GAP_MS = 2500;
export const TAP_TEMPO_MIN_INTERVAL_MS = 180;
export const TAP_TEMPO_MAX_TAPS = 9;

function finiteTimestamps(timestamps) {
  return Array.isArray(timestamps)
    ? timestamps.filter(Number.isFinite)
    : [];
}

export function addTempoTap(previousTaps, timestamp) {
  if (!Number.isFinite(timestamp)) {
    return finiteTimestamps(previousTaps);
  }

  const taps = finiteTimestamps(previousTaps);
  const previous = taps.at(-1);

  if (Number.isFinite(previous)) {
    const interval = timestamp - previous;

    if (interval < TAP_TEMPO_MIN_INTERVAL_MS) {
      return taps;
    }

    if (interval > TAP_TEMPO_RESET_GAP_MS) {
      return [timestamp];
    }
  }

  return [...taps, timestamp].slice(-TAP_TEMPO_MAX_TAPS);
}

export function estimateTapTempoBpm(timestamps) {
  const taps = finiteTimestamps(timestamps);

  if (taps.length < 2) {
    return null;
  }

  const intervals = [];

  for (let index = 1; index < taps.length; index += 1) {
    const interval = taps[index] - taps[index - 1];

    if (Number.isFinite(interval) && interval > 0) {
      intervals.push(interval);
    }
  }

  if (intervals.length === 0) {
    return null;
  }

  const sorted = [...intervals].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  const medianInterval =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];

  const bpm = Math.round(60000 / medianInterval);

  return Number.isFinite(bpm) ? bpm : null;
}

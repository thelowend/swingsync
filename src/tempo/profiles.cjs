const TEMPO_PROFILES = {
  "rhythm-and-blues": {
    name: "rhythm-and-blues",
    description:
      "Prefer well-supported faster Rhythm and Blues interpretations using consensus, midpoint onsets, rhythm confidence, and histogram clarity.",

    doubleTime: {
      enabled: true,

      minimumScore: 6.5,
      preferredMinBpm: 120,
      preferredMaxBpm: 240,

      minimumEvidenceScore: 5,

      minimumMidpointOnsetRatio: 0.50,

      minimumContinuityMidpointRatio: 0.45,
      minimumMidpointRunLength: 8,
      minimumSustainedMidpointRatio: 0.20,
      maximumMedianMidpointErrorRatio: 0.06,

      minimumRhythmConfidence: 1.8,
      minimumHistogramDominance: 0.65,

      evidencePoints: {
        candidateConsensus: 2,
        midpointOnsets: 2,
        sustainedMidpointPulse: 1,
        rhythmConfidence: 1,
        histogramDominance: 1,
      },
    },

    threeTwo: {
      enabled: true,
      minimumScore: 6.5,
      preferredMinBpm: 65,
      preferredMaxBpm: 100,
      requireDirectSupport: true,
    },
  },

  swing: {
    name: "swing",
    description:
      "Prefer well-supported swing metrical interpretations using multiple rhythmic signals rather than a BPM cutoff.",

    doubleTime: {
      enabled: true,

      minimumScore: 6.5,
      preferredMinBpm: 115,
      preferredMaxBpm: 230,

      // Multi-signal double-time classifier.
      //
      // Maximum evidence score = 7:
      //   candidate consensus        2
      //   midpoint-onset support     2
      //   sustained midpoint pulse   1
      //   rhythm confidence          1
      //   histogram dominance        1
      //
      // Requiring 5/7 means candidate consensus + midpoint evidence
      // alone are not enough; at least one additional rhythmic signal
      // must also support the faster interpretation.
      minimumEvidenceScore: 5,

      minimumMidpointOnsetRatio: 0.55,

      // Rescue a half-time lock only when midpoint activity is sustained
      // and extremely precise. This is deliberately stricter than the
      // ordinary midpoint-ratio signal.
      minimumContinuityMidpointRatio: 0.45,
      minimumMidpointRunLength: 8,
      minimumSustainedMidpointRatio: 0.20,
      maximumMedianMidpointErrorRatio: 0.06,

      minimumRhythmConfidence: 1.8,
      minimumHistogramDominance: 0.65,

      evidencePoints: {
        candidateConsensus: 2,
        midpointOnsets: 2,
        sustainedMidpointPulse: 1,
        rhythmConfidence: 1,
        histogramDominance: 1,
      },
    },

    threeTwo: {
      enabled: true,
      minimumScore: 6.5,
      preferredMinBpm: 65,
      preferredMaxBpm: 100,
      requireDirectSupport: true,
    },
  },

  generic: {
    name: "generic",
    description:
      "No genre-specific metrical interpretation preference.",
    doubleTime: { enabled: false },
    threeTwo: { enabled: false },
  },
};

const DEFAULT_PROFILE =
  "rhythm-and-blues";

function normalizeProfileName(
  profileName
) {
  return String(
    profileName ??
    DEFAULT_PROFILE
  )
    .trim()
    .toLowerCase();
}

function getTempoProfile(
  profileName
) {
  return (
    TEMPO_PROFILES[
      normalizeProfileName(
        profileName
      )
    ] ??
    null
  );
}

module.exports = {
  TEMPO_PROFILES,
  DEFAULT_PROFILE,
  normalizeProfileName,
  getTempoProfile,
};

const TEMPO_PROFILES = {
  generic: {
    name: "generic",
    description:
      "No genre-specific metrical interpretation preference.",
    doubleTime: { enabled: false },
    threeTwo: { enabled: false },
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
      // Maximum evidence score = 6:
      //   candidate consensus     2
      //   midpoint-onset support  2
      //   rhythm confidence       1
      //   histogram dominance     1
      //
      // Requiring 5/6 means candidate consensus + midpoint evidence
      // alone are not enough; at least one additional rhythmic signal
      // must also support the faster interpretation.
      minimumEvidenceScore: 5,

      minimumMidpointOnsetRatio: 0.55,
      minimumRhythmConfidence: 1.8,
      minimumHistogramDominance: 0.65,

      evidencePoints: {
        candidateConsensus: 2,
        midpointOnsets: 2,
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

  boogie: {
    name: "boogie",
    description:
      "Prefer well-supported faster boogie interpretations using consensus, midpoint onsets, rhythm confidence, and histogram clarity.",

    doubleTime: {
      enabled: true,

      minimumScore: 6.5,
      preferredMinBpm: 120,
      preferredMaxBpm: 240,

      minimumEvidenceScore: 5,

      minimumMidpointOnsetRatio: 0.50,
      minimumRhythmConfidence: 1.8,
      minimumHistogramDominance: 0.65,

      evidencePoints: {
        candidateConsensus: 2,
        midpointOnsets: 2,
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
};
const DEFAULT_PROFILE = "generic";

module.exports = {
  TEMPO_PROFILES,
  DEFAULT_PROFILE,
};

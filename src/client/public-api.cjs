const {
  BpmApplication,
} = require("./bpm-application.cjs");

const {
  APPLICATION_STATUS,
  TRACK_STATUS,
} = require("./state-model.cjs");

const {
  REVIEW_ACTIONS,
} = require("../review/review-service.cjs");

const {
  OUTPUT_MODES,
} = require("../app/apply-bpm-output.cjs");

const {
  TEMPO_PROFILES,
  DEFAULT_PROFILE,
} = require("../tempo/profiles.cjs");

const {
  PRODUCT_NAME,
  PACKAGE_NAME,
  CLI_COMMAND,
  DEFAULT_CACHE_FILENAME,
} = require("../branding.cjs");

async function createBpmApplication(
  options = {}
) {
  return BpmApplication.create(
    options
  );
}

module.exports = {
  createBpmApplication,
  BpmApplication,

  APPLICATION_STATUS,
  TRACK_STATUS,
  REVIEW_ACTIONS,
  OUTPUT_MODES,

  TEMPO_PROFILES,
  DEFAULT_PROFILE,

  PRODUCT_NAME,
  PACKAGE_NAME,
  CLI_COMMAND,
  DEFAULT_CACHE_FILENAME,
};

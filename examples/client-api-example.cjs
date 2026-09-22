const {
  createBpmApplication,
  REVIEW_ACTIONS,
  PRODUCT_NAME,
} = require("../src/client/public-api.cjs");

async function main() {
  console.log(
    `${PRODUCT_NAME} client API example`
  );

  const app =
    await createBpmApplication();

  // A desktop/web shell can subscribe once and update its state store.
  app.on(
    "progress",
    (progress) => {
      console.log(
        "progress",
        progress
      );
    }
  );

  app.on(
    "track",
    ({ track }) => {
      console.log(
        "track updated",
        track.filename,
        track.status
      );
    }
  );

  const explicitFolders =
    process.argv.slice(2);

  await app.openLibrary({
    folders:
      explicitFolders.length > 0
        ? explicitFolders
        : undefined,
    profile:
      "boogie",
    outputMode:
      "metadata",
  });

  await app.analyzeAll();

  const reviewQueue =
    app.getReviewQueue();

  console.log(
    "Needs review:",
    reviewQueue.length
  );

  // Example only:
  // const first = reviewQueue[0];
  //
  // app.submitReview({
  //   trackId: first.id,
  //   action:
  //     REVIEW_ACTIONS.USE_SUGGESTED,
  // });
  //
  // await app.applyTrack(
  //   first.id
  // );

  await app.close();
}

main().catch(
  (error) => {
    console.error(error);
    process.exitCode = 1;
  }
);

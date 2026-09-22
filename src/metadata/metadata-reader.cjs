function toFiniteNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number.parseFloat(
          String(value)
        );

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

async function getParser() {
  // Loaded lazily so the rest of the application can still be
  // syntax-tested without resolving optional runtime dependencies.
  return require("music-metadata");
}

async function readTrackMetadata(
  filePath
) {
  try {
    const {
      parseFile,
    } = await getParser();

    const metadata =
      await parseFile(
        filePath,
        {
          duration: false,
          skipCovers: true,
        }
      );

    return {
      bpm:
        toFiniteNumber(
          metadata.common?.bpm
        ),
      title:
        metadata.common?.title ??
        null,
      artist:
        metadata.common?.artist ??
        null,
      album:
        metadata.common?.album ??
        null,
      container:
        metadata.format
          ?.container ??
        null,
      codec:
        metadata.format
          ?.codec ??
        null,
      readError: null,
    };
  } catch (error) {
    return {
      bpm: null,
      title: null,
      artist: null,
      album: null,
      container: null,
      codec: null,
      readError:
        error.message,
    };
  }
}

module.exports = {
  readTrackMetadata,
  toFiniteNumber,
};

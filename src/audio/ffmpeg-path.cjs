const fs = require("node:fs");

function getFfmpegPath() {
  const packagedPath =
    require("ffmpeg-static");

  if (
    typeof packagedPath !==
      "string" ||
    packagedPath.length === 0
  ) {
    throw new Error(
      "ffmpeg-static did not provide an FFmpeg binary path."
    );
  }

  // Electron Builder keeps executable binaries outside app.asar.
  // ffmpeg-static can still report the virtual app.asar path, so
  // translate it to the real unpacked executable before spawn().
  const unpackedPath =
    packagedPath.replace(
      /([\\/])app\.asar([\\/])/,
      "$1app.asar.unpacked$2"
    );

  if (
    unpackedPath !==
      packagedPath &&
    fs.existsSync(
      unpackedPath
    )
  ) {
    return unpackedPath;
  }

  return packagedPath;
}

module.exports = {
  getFfmpegPath,
};

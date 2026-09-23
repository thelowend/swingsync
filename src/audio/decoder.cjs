const { spawn } = require("node:child_process");

const {
  getFfmpegPath,
} = require("./ffmpeg-path.cjs");

const { SAMPLE_RATE } = require("../config.cjs");

function decodeAudio(filePath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(
      getFfmpegPath(),
      [
        "-v",
        "error",
        "-i",
        filePath,

        // Ignore album art/video streams.
        "-vn",

        // Mono signal is enough for tempo analysis.
        "-ac",
        "1",

        // RhythmExtractor2013 expects 44.1 kHz.
        "-ar",
        String(SAMPLE_RATE),

        // Raw 32-bit floating point PCM.
        "-f",
        "f32le",

        "pipe:1",
      ],
      {
        windowsHide: true,
      }
    );

    const chunks = [];
    const errorChunks = [];

    ffmpeg.stdout.on("data", (chunk) => {
      chunks.push(chunk);
    });

    ffmpeg.stderr.on("data", (chunk) => {
      errorChunks.push(chunk);
    });

    ffmpeg.on("error", reject);

    ffmpeg.on("close", (code) => {
      if (code !== 0) {
        const message = Buffer.concat(errorChunks).toString();

        reject(
          new Error(
            message || `FFmpeg exited with code ${code}`
          )
        );

        return;
      }

      resolve(Buffer.concat(chunks));
    });
  });
}

function pcmBufferToFloat32(buffer) {
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );

  return new Float32Array(arrayBuffer);
}

module.exports = {
  decodeAudio,
  pcmBufferToFloat32,
};

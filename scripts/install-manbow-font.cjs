const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const root = path.resolve(
  __dirname,
  ".."
);

const targetPath = path.join(
  root,
  "desktop",
  "renderer",
  "src",
  "assets",
  "fonts",
  "Manbow-Lines.otf"
);

const requestedPath =
  process.argv[2];

if (!requestedPath) {
  console.error(
    [
      "Usage:",
      '  npm run desktop:font:install -- "path/to/manbow.zip"',
      "",
      "You can also pass Manbow Lines.otf directly.",
    ].join("\n")
  );

  process.exit(1);
}

const sourcePath =
  path.resolve(
    process.cwd(),
    requestedPath
  );

if (
  !fs.existsSync(
    sourcePath
  )
) {
  console.error(
    `Font source not found: ${sourcePath}`
  );
  process.exit(1);
}

function findEndOfCentralDirectory(
  buffer
) {
  const minimumOffset =
    Math.max(
      0,
      buffer.length -
      0xffff -
      22
    );

  for (
    let offset =
      buffer.length - 22;
    offset >= minimumOffset;
    offset--
  ) {
    if (
      buffer.readUInt32LE(
        offset
      ) ===
      0x06054b50
    ) {
      return offset;
    }
  }

  return -1;
}

function extractFromZip(
  zipPath,
  desiredBasename
) {
  const buffer =
    fs.readFileSync(
      zipPath
    );

  const eocdOffset =
    findEndOfCentralDirectory(
      buffer
    );

  if (
    eocdOffset < 0
  ) {
    throw new Error(
      "Invalid ZIP: end-of-central-directory record not found."
    );
  }

  const centralDirectorySize =
    buffer.readUInt32LE(
      eocdOffset + 12
    );

  const centralDirectoryOffset =
    buffer.readUInt32LE(
      eocdOffset + 16
    );

  const centralEnd =
    centralDirectoryOffset +
    centralDirectorySize;

  let cursor =
    centralDirectoryOffset;

  while (
    cursor < centralEnd
  ) {
    const signature =
      buffer.readUInt32LE(
        cursor
      );

    if (
      signature !==
      0x02014b50
    ) {
      throw new Error(
        "Invalid ZIP central-directory entry."
      );
    }

    const method =
      buffer.readUInt16LE(
        cursor + 10
      );

    const compressedSize =
      buffer.readUInt32LE(
        cursor + 20
      );

    const uncompressedSize =
      buffer.readUInt32LE(
        cursor + 24
      );

    const fileNameLength =
      buffer.readUInt16LE(
        cursor + 28
      );

    const extraLength =
      buffer.readUInt16LE(
        cursor + 30
      );

    const commentLength =
      buffer.readUInt16LE(
        cursor + 32
      );

    const localHeaderOffset =
      buffer.readUInt32LE(
        cursor + 42
      );

    const fileName =
      buffer
        .subarray(
          cursor + 46,
          cursor + 46 +
            fileNameLength
        )
        .toString(
          "utf8"
        );

    if (
      path.basename(
        fileName
      ) === desiredBasename
    ) {
      if (
        buffer.readUInt32LE(
          localHeaderOffset
        ) !==
        0x04034b50
      ) {
        throw new Error(
          "Invalid ZIP local-file header."
        );
      }

      const localNameLength =
        buffer.readUInt16LE(
          localHeaderOffset + 26
        );

      const localExtraLength =
        buffer.readUInt16LE(
          localHeaderOffset + 28
        );

      const dataOffset =
        localHeaderOffset +
        30 +
        localNameLength +
        localExtraLength;

      const compressed =
        buffer.subarray(
          dataOffset,
          dataOffset +
            compressedSize
        );

      let output;

      if (method === 0) {
        output =
          Buffer.from(
            compressed
          );
      } else if (
        method === 8
      ) {
        output =
          zlib.inflateRawSync(
            compressed
          );
      } else {
        throw new Error(
          `Unsupported ZIP compression method: ${method}`
        );
      }

      if (
        output.length !==
        uncompressedSize
      ) {
        throw new Error(
          "Extracted font size does not match the ZIP entry."
        );
      }

      return output;
    }

    cursor +=
      46 +
      fileNameLength +
      extraLength +
      commentLength;
  }

  throw new Error(
    `${desiredBasename} was not found in the ZIP archive.`
  );
}

function loadFont(
  source
) {
  const extension =
    path.extname(
      source
    ).toLowerCase();

  if (
    extension === ".otf"
  ) {
    if (
      path.basename(
        source
      ).toLowerCase() !==
      "manbow lines.otf"
    ) {
      console.warn(
        `Using OTF file: ${path.basename(source)}`
      );
    }

    return fs.readFileSync(
      source
    );
  }

  if (
    extension === ".zip"
  ) {
    return extractFromZip(
      source,
      "Manbow Lines.otf"
    );
  }

  throw new Error(
    "Expected a .zip archive or .otf font file."
  );
}

try {
  const fontData =
    loadFont(
      sourcePath
    );

  fs.mkdirSync(
    path.dirname(
      targetPath
    ),
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    targetPath,
    fontData
  );

  console.log(
    "Manbow Lines-Regular installed for SwingSync."
  );

  console.log(
    path.relative(
      root,
      targetPath
    )
  );

  console.log(
    "Vite will bundle this font into the desktop renderer on the next build."
  );
} catch (error) {
  console.error(
    `Could not install Manbow Lines-Regular: ${error.message}`
  );

  process.exitCode = 1;
}

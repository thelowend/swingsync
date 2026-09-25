const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const root = path.resolve(
  __dirname,
  ".."
);

const fontsDirectory = path.join(
  root,
  "desktop",
  "renderer",
  "src",
  "assets",
  "fonts"
);

const configurations = {
  peignot: {
    label: "Peignot",
    usage:
      'npm run desktop:font:install:peignot -- "path/to/peignot.zip"',
    targets: [
      {
        archiveName:
          "Peignot.ttf",
        targetName:
          "Peignot.ttf",
      },
    ],
  },

  engebrechtre: {
    label: "Engebrechtre",
    usage:
      'npm run desktop:font:install:engebrechtre -- "path/to/engebrechtre.zip"',
    targets: [
      {
        archiveName:
          "Engebrechtre Rg.otf",
        targetName:
          "Engebrechtre-Regular.otf",
      },
      {
        archiveName:
          "Engebrechtre Bd.otf",
        targetName:
          "Engebrechtre-Bold.otf",
      },
    ],
  },
};

const fontKey =
  process.argv[2];

const requestedPath =
  process.argv[3];

const configuration =
  configurations[
    fontKey
  ];

if (
  !configuration ||
  !requestedPath
) {
  console.error(
    [
      "Usage:",
      '  node scripts/install-ui-font.cjs peignot "path/to/peignot.zip"',
      '  node scripts/install-ui-font.cjs engebrechtre "path/to/engebrechtre.zip"',
      "",
      "npm shortcuts:",
      '  npm run desktop:font:install:peignot -- "path/to/peignot.zip"',
      '  npm run desktop:font:install:engebrechtre -- "path/to/engebrechtre.zip"',
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

function extractZipEntries(
  zipPath,
  desiredBasenames
) {
  const desired =
    new Set(
      desiredBasenames
    );

  const results =
    new Map();

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

    const basename =
      path.basename(
        fileName
      );

    if (
      desired.has(
        basename
      )
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

      if (
        method === 0
      ) {
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
          `Extracted font size does not match ZIP entry: ${basename}`
        );
      }

      results.set(
        basename,
        output
      );
    }

    cursor +=
      46 +
      fileNameLength +
      extraLength +
      commentLength;
  }

  for (
    const basename of
    desired
  ) {
    if (
      !results.has(
        basename
      )
    ) {
      throw new Error(
        `${basename} was not found in the ZIP archive.`
      );
    }
  }

  return results;
}

function loadFontData() {
  const extension =
    path.extname(
      sourcePath
    ).toLowerCase();

  if (
    extension === ".zip"
  ) {
    return extractZipEntries(
      sourcePath,
      configuration.targets.map(
        (target) =>
          target.archiveName
      )
    );
  }

  if (
    configuration.targets.length !==
    1
  ) {
    throw new Error(
      `${configuration.label} requires the original ZIP because multiple font faces are installed.`
    );
  }

  const target =
    configuration.targets[0];

  if (
    path.basename(
      sourcePath
    ).toLowerCase() !==
    target.archiveName.toLowerCase()
  ) {
    console.warn(
      `Using local font file: ${path.basename(sourcePath)}`
    );
  }

  return new Map([
    [
      target.archiveName,
      fs.readFileSync(
        sourcePath
      ),
    ],
  ]);
}

try {
  const fontData =
    loadFontData();

  fs.mkdirSync(
    fontsDirectory,
    {
      recursive: true,
    }
  );

  for (
    const target of
    configuration.targets
  ) {
    const outputPath =
      path.join(
        fontsDirectory,
        target.targetName
      );

    fs.writeFileSync(
      outputPath,
      fontData.get(
        target.archiveName
      )
    );

    console.log(
      path.relative(
        root,
        outputPath
      )
    );
  }

  console.log(
    `${configuration.label} installed for SwingSync.`
  );

  console.log(
    "Vite will bundle the local font asset(s) into the desktop renderer on the next build."
  );
} catch (error) {
  console.error(
    `Could not install ${configuration.label}: ${error.message}`
  );

  process.exitCode = 1;
}

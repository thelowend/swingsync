const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  spawn,
} = require(
  "node:child_process"
);

const root = path.resolve(
  __dirname,
  ".."
);

const releaseDir =
  path.join(
    root,
    "release"
  );

function findPackagedExe() {
  const preferred =
    path.join(
      releaseDir,
      "win-unpacked",
      "SwingSync.exe"
    );

  if (
    fs.existsSync(
      preferred
    )
  ) {
    return preferred;
  }

  if (
    !fs.existsSync(
      releaseDir
    )
  ) {
    return null;
  }

  const queue = [
    releaseDir,
  ];

  while (
    queue.length > 0
  ) {
    const current =
      queue.shift();

    for (
      const entry of
      fs.readdirSync(
        current,
        {
          withFileTypes: true,
        }
      )
    ) {
      const fullPath =
        path.join(
          current,
          entry.name
        );

      if (
        entry.isDirectory()
      ) {
        queue.push(
          fullPath
        );
        continue;
      }

      if (
        entry.isFile() &&
        entry.name.toLowerCase() ===
          "swingsync.exe" &&
        fullPath
          .toLowerCase()
          .includes(
            "unpacked"
          )
      ) {
        return fullPath;
      }
    }
  }

  return null;
}

function formatDetails(
  details
) {
  if (
    details == null
  ) {
    return "";
  }

  if (
    typeof details ===
      "string"
  ) {
    return details;
  }

  return JSON.stringify(
    details
  );
}

async function main() {
  if (
    process.platform !==
    "win32"
  ) {
    throw new Error(
      "The packaged SwingSync smoke test must run on Windows."
    );
  }

  const executable =
    findPackagedExe();

  if (!executable) {
    throw new Error(
      [
        "Could not find the unpacked SwingSync executable.",
        "",
        "Build it first with:",
        "",
        "  npm run desktop:package:win:unpacked",
      ].join("\n")
    );
  }

  const smokeRoot =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "swingsync-smoke-"
      )
    );

  const resultFile =
    path.join(
      smokeRoot,
      "result.json"
    );

  const userData =
    path.join(
      smokeRoot,
      "user-data"
    );

  fs.mkdirSync(
    userData,
    {
      recursive: true,
    }
  );

  let stdout = "";
  let stderr = "";

  try {
    console.log(
      `Launching packaged app: ${executable}`
    );

    const child =
      spawn(
        executable,
        [],
        {
          cwd:
            path.dirname(
              executable
            ),
          windowsHide: true,
          env: {
            ...process.env,
            SWINGSYNC_PACKAGED_SMOKE_TEST:
              "1",
            SWINGSYNC_SMOKE_RESULT:
              resultFile,
            SWINGSYNC_SMOKE_USER_DATA:
              userData,
            ELECTRON_ENABLE_LOGGING:
              "1",
          },
          stdio: [
            "ignore",
            "pipe",
            "pipe",
          ],
        }
      );

    child.stdout.on(
      "data",
      (chunk) => {
        stdout +=
          chunk.toString();
      }
    );

    child.stderr.on(
      "data",
      (chunk) => {
        stderr +=
          chunk.toString();
      }
    );

    const exitCode =
      await new Promise(
        (resolve, reject) => {
          const timeout =
            setTimeout(
              () => {
                child.kill();
                reject(
                  new Error(
                    "Packaged app smoke test timed out after 45 seconds."
                  )
                );
              },
              45000
            );

          child.once(
            "error",
            (error) => {
              clearTimeout(
                timeout
              );
              reject(
                error
              );
            }
          );

          child.once(
            "exit",
            (code) => {
              clearTimeout(
                timeout
              );
              resolve(
                code
              );
            }
          );
        }
      );

    if (
      !fs.existsSync(
        resultFile
      )
    ) {
      throw new Error(
        [
          "Packaged app exited without writing a smoke-test result.",
          `Exit code: ${exitCode}`,
          stdout
            ? `stdout:\n${stdout}`
            : "",
          stderr
            ? `stderr:\n${stderr}`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n")
      );
    }

    const result =
      JSON.parse(
        fs.readFileSync(
          resultFile,
          "utf8"
        )
      );

    console.log("");
    console.log(
      `SwingSync ${result.version} packaged smoke test`
    );
    console.log(
      "----------------------------------------"
    );

    for (
      const check of
      result.checks
    ) {
      const icon =
        check.passed
          ? "PASS"
          : "FAIL";

      console.log(
        `${icon}  ${check.name}`
      );

      if (
        !check.passed &&
        check.details
      ) {
        console.log(
          `      ${formatDetails(check.details)}`
        );
      }
    }

    console.log("");

    if (
      exitCode !== 0 ||
      !result.passed
    ) {
      if (stderr) {
        console.error(
          stderr.trim()
        );
      }

      process.exitCode = 1;
      return;
    }

    console.log(
      "Packaged SwingSync smoke test passed."
    );
  } finally {
    fs.rmSync(
      smokeRoot,
      {
        recursive: true,
        force: true,
      }
    );
  }
}

main().catch(
  (error) => {
    console.error(
      error?.stack ??
      error
    );
    process.exitCode = 1;
  }
);

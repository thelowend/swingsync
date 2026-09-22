const {
  spawn,
} = require("node:child_process");

const http = require("node:http");
const path = require("node:path");

const root = path.resolve(
  __dirname,
  ".."
);

const devUrl =
  "http://127.0.0.1:5173";

function waitForServer({
  url,
  timeoutMs = 30000,
}) {
  const started = Date.now();

  return new Promise(
    (resolve, reject) => {
      const tryConnect = () => {
        const request =
          http.get(
            url,
            (response) => {
              response.resume();

              if (
                response.statusCode >=
                  200 &&
                response.statusCode <
                  500
              ) {
                resolve();
                return;
              }

              retry();
            }
          );

        request.on(
          "error",
          retry
        );

        request.setTimeout(
          1000,
          () => {
            request.destroy();
            retry();
          }
        );
      };

      const retry = () => {
        if (
          Date.now() - started >=
          timeoutMs
        ) {
          reject(
            new Error(
              "Timed out waiting for the Vite development server."
            )
          );
          return;
        }

        setTimeout(
          tryConnect,
          250
        );
      };

      tryConnect();
    }
  );
}

function terminate(child) {
  if (
    !child ||
    child.killed
  ) {
    return;
  }

  child.kill();
}

async function main() {
  const viteScript =
    path.join(
      root,
      "node_modules",
      "vite",
      "bin",
      "vite.js"
    );

  const electronPath =
    require("electron");

  const vite = spawn(
    process.execPath,
    [
      viteScript,
      "--config",
      path.join(
        root,
        "desktop",
        "vite.config.mjs"
      ),
    ],
    {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    }
  );

  let electron = null;

  const cleanup = () => {
    terminate(electron);
    terminate(vite);
  };

  process.on(
    "SIGINT",
    cleanup
  );

  process.on(
    "SIGTERM",
    cleanup
  );

  vite.on(
    "exit",
    (code) => {
      if (
        code &&
        code !== 0
      ) {
        process.exitCode =
          code;
      }
    }
  );

  await waitForServer({
    url: devUrl,
  });

  electron = spawn(
    electronPath,
    [
      path.join(
        root,
        "desktop"
      ),
    ],
    {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        SWINGSYNC_VITE_DEV_SERVER_URL:
          devUrl,
      },
    }
  );

  electron.on(
    "exit",
    (code) => {
      terminate(vite);
      process.exitCode =
        code ?? 0;
    }
  );
}

main().catch(
  (error) => {
    console.error(error);
    process.exitCode = 1;
  }
);

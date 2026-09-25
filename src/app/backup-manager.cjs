const fs = require("node:fs/promises");
const path = require("node:path");

const MANIFEST_VERSION = 1;
const MANIFEST_FILENAME = "last-apply.json";

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function finiteOrNull(value) {
  return Number.isFinite(value)
    ? value
    : null;
}

class BackupManager {
  constructor({ rootDir }) {
    if (!rootDir) {
      throw new Error(
        "BackupManager requires a root directory"
      );
    }

    this.rootDir = path.resolve(rootDir);
    this.filesDir = path.join(
      this.rootDir,
      "files"
    );
    this.manifestPath = path.join(
      this.rootDir,
      MANIFEST_FILENAME
    );
  }

  async clear() {
    await fs.rm(
      this.rootDir,
      {
        recursive: true,
        force: true,
      }
    );
  }

  async writeManifest(manifest) {
    await fs.mkdir(
      this.rootDir,
      {
        recursive: true,
      }
    );

    await fs.writeFile(
      this.manifestPath,
      JSON.stringify(
        manifest,
        null,
        2
      ) + "\n",
      "utf8"
    );
  }

  async readManifest() {
    try {
      const payload =
        await fs.readFile(
          this.manifestPath,
          "utf8"
        );

      const manifest =
        JSON.parse(payload);

      if (
        manifest?.version !==
          MANIFEST_VERSION ||
        !Array.isArray(
          manifest.items
        )
      ) {
        return null;
      }

      return manifest;
    } catch (error) {
      if (
        error.code === "ENOENT"
      ) {
        return null;
      }

      throw error;
    }
  }

  async begin({
    outputMode,
    items,
  }) {
    await this.clear();

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return null;
    }

    await fs.mkdir(
      this.filesDir,
      {
        recursive: true,
      }
    );

    const manifest = {
      version:
        MANIFEST_VERSION,
      createdAt:
        new Date().toISOString(),
      completedAt:
        null,
      outputMode:
        outputMode ?? null,
      items: [],
    };

    try {
      for (
        let index = 0;
        index < items.length;
        index += 1
      ) {
        const item =
          items[index];

        const originalPath =
          path.resolve(
            item.file
          );

        const extension =
          path.extname(
            originalPath
          );

        const backupName =
          `${String(index + 1).padStart(4, "0")}${extension}`;

        const backupPath =
          path.join(
            this.filesDir,
            backupName
          );

        await fs.copyFile(
          originalPath,
          backupPath
        );

        manifest.items.push({
          trackId:
            item.trackId,
          originalPath,
          backupFile:
            path.relative(
              this.rootDir,
              backupPath
            ),
          originalMetadataBpm:
            finiteOrNull(
              item.originalMetadataBpm
            ),
          attempted: false,
          finalPath:
            originalPath,
          status: null,
          error: null,
        });
      }

      await this.writeManifest(
        manifest
      );

      return manifest;
    } catch (error) {
      await this.clear();
      throw error;
    }
  }

  async updateItem(
    trackId,
    updater
  ) {
    const manifest =
      await this.readManifest();

    if (!manifest) {
      return null;
    }

    const item =
      manifest.items.find(
        (candidate) =>
          candidate.trackId ===
          trackId
      );

    if (!item) {
      return manifest;
    }

    updater(item);

    await this.writeManifest(
      manifest
    );

    return manifest;
  }

  async markAttempted(
    trackId
  ) {
    return this.updateItem(
      trackId,
      (item) => {
        item.attempted = true;
      }
    );
  }

  async recordResult(
    trackId,
    {
      finalPath = null,
      status = null,
      error = null,
    } = {}
  ) {
    return this.updateItem(
      trackId,
      (item) => {
        if (finalPath) {
          item.finalPath =
            path.resolve(
              finalPath
            );
        }

        item.status =
          status ?? null;
        item.error =
          error ?? null;
      }
    );
  }

  async finalize() {
    const manifest =
      await this.readManifest();

    if (!manifest) {
      return null;
    }

    manifest.completedAt =
      new Date().toISOString();

    await this.writeManifest(
      manifest
    );

    return manifest;
  }

  async getStatus() {
    const manifest =
      await this.readManifest();

    if (!manifest) {
      return {
        available: false,
        createdAt: null,
        completedAt: null,
        itemCount: 0,
        outputMode: null,
      };
    }

    const attempted =
      manifest.items.filter(
        (item) =>
          item.attempted
      );

    if (
      attempted.length === 0
    ) {
      return {
        available: false,
        createdAt:
          manifest.createdAt ??
          null,
        completedAt:
          manifest.completedAt ??
          null,
        itemCount: 0,
        outputMode:
          manifest.outputMode ??
          null,
      };
    }

    const backupChecks =
      await Promise.all(
        attempted.map(
          (item) =>
            exists(
              path.join(
                this.rootDir,
                item.backupFile
              )
            )
        )
      );

    return {
      available:
        backupChecks.every(
          Boolean
        ),
      createdAt:
        manifest.createdAt ??
        null,
      completedAt:
        manifest.completedAt ??
        null,
      itemCount:
        attempted.length,
      outputMode:
        manifest.outputMode ??
        null,
    };
  }

  async undoLastApply() {
    const manifest =
      await this.readManifest();

    if (!manifest) {
      throw new Error(
        "No Apply backup is available"
      );
    }

    const items =
      manifest.items.filter(
        (item) =>
          item.attempted
      );

    if (
      items.length === 0
    ) {
      throw new Error(
        "No Apply backup is available"
      );
    }

    for (
      const item of items
    ) {
      const backupPath =
        path.join(
          this.rootDir,
          item.backupFile
        );

      if (
        !(await exists(
          backupPath
        ))
      ) {
        throw new Error(
          `Backup file is missing for "${item.originalPath}"`
        );
      }

      const finalPath =
        path.resolve(
          item.finalPath ??
          item.originalPath
        );

      const originalPath =
        path.resolve(
          item.originalPath
        );

      if (
        finalPath !==
          originalPath &&
        await exists(
          originalPath
        )
      ) {
        throw new Error(
          `Cannot undo because the original path already exists: ${originalPath}`
        );
      }
    }

    const restored = [];

    for (
      const item of items
    ) {
      const backupPath =
        path.join(
          this.rootDir,
          item.backupFile
        );

      const originalPath =
        path.resolve(
          item.originalPath
        );

      const finalPath =
        path.resolve(
          item.finalPath ??
          originalPath
        );

      await fs.mkdir(
        path.dirname(
          originalPath
        ),
        {
          recursive: true,
        }
      );

      await fs.copyFile(
        backupPath,
        originalPath
      );

      if (
        finalPath !==
          originalPath
      ) {
        try {
          await fs.unlink(
            finalPath
          );
        } catch (error) {
          if (
            error.code !==
              "ENOENT"
          ) {
            throw error;
          }
        }
      }

      restored.push({
        trackId:
          item.trackId,
        originalPath,
        finalPath,
        originalMetadataBpm:
          finiteOrNull(
            item.originalMetadataBpm
          ),
      });
    }

    await this.clear();

    return {
      restored,
      createdAt:
        manifest.createdAt ??
        null,
      completedAt:
        manifest.completedAt ??
        null,
      outputMode:
        manifest.outputMode ??
        null,
    };
  }
}

module.exports = {
  BackupManager,
};

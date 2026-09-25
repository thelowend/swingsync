const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
  BackupManager,
} = require("../src/app/backup-manager.cjs");

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

async function main() {
  const root = await fs.mkdtemp(
    path.join(
      os.tmpdir(),
      "swingsync-backup-test-"
    )
  );

  try {
    const musicDir = path.join(
      root,
      "music"
    );
    const backupDir = path.join(
      root,
      "backup"
    );

    await fs.mkdir(
      musicDir,
      { recursive: true }
    );

    const originalPath = path.join(
      musicDir,
      "Song.mp3"
    );
    const finalPath = path.join(
      musicDir,
      "[120 BPM] Song.mp3"
    );

    await fs.writeFile(
      originalPath,
      "original-bytes",
      "utf8"
    );

    const manager =
      new BackupManager({
        rootDir: backupDir,
      });

    await manager.begin({
      outputMode: "both",
      items: [
        {
          trackId: "track-1",
          file: originalPath,
          originalMetadataBpm: 60,
        },
      ],
    });

    await manager.markAttempted(
      "track-1"
    );

    await fs.rename(
      originalPath,
      finalPath
    );
    await fs.writeFile(
      finalPath,
      "modified-bytes",
      "utf8"
    );

    await manager.recordResult(
      "track-1",
      {
        finalPath,
        status: "applied",
      }
    );
    await manager.finalize();

    const status =
      await manager.getStatus();

    assert.equal(
      status.available,
      true
    );
    assert.equal(
      status.itemCount,
      1
    );

    const undo =
      await manager.undoLastApply();

    assert.equal(
      undo.restored.length,
      1
    );
    assert.equal(
      await fs.readFile(
        originalPath,
        "utf8"
      ),
      "original-bytes"
    );
    assert.equal(
      await exists(finalPath),
      false
    );

    const after =
      await manager.getStatus();
    assert.equal(
      after.available,
      false
    );

    console.log(
      "Backup manager tests passed."
    );
  } finally {
    await fs.rm(
      root,
      {
        recursive: true,
        force: true,
      }
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

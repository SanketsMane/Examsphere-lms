// pm2 config for production (examsphere.online). Used by scripts/redeploy.sh.
// Lives in the repo so a server rebuild doesn't lose it (it used to exist only on the box).
const fs = require("fs");
const path = require("path");

// Which build directory is live. scripts/redeploy.sh builds the next release into the
// other slot, tests it, then writes its name here and restarts pm2 from this file.
function liveSlot() {
  try {
    const slot = fs.readFileSync(path.join(__dirname, ".live-slot"), "utf8").trim();
    if (/^\.next(-[a-z])?$/.test(slot)) return slot;
  } catch {}
  return ".next";
}

module.exports = {
  apps: [
    {
      name: "examsphere",
      cwd: "/root/examsphere",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3300",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "1G",
      // Timestamp every log line. Without this the error log had no dates, so failures
      // could only be dated by cross-referencing nginx.
      time: true,
      // Stable paths. pm2 appends "-<process id>" to these unless merge_logs is set, and the
      // id changes on every delete/start in scripts/redeploy.sh.
      merge_logs: true,
      out_file: "/root/.pm2/logs/examsphere-out.log",
      error_file: "/root/.pm2/logs/examsphere-error.log",
      env: {
        NODE_ENV: "production",
        PORT: "3300",
        NEXT_DIST_DIR: liveSlot(),
      },
    },
  ],
};

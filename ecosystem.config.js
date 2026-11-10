// pm2 config for production (examsphere.online). Used by scripts/redeploy.sh.
// Lives in the repo so a server rebuild doesn't lose it (it used to exist only on the box).
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
      // Stable paths (pm2's default adds the process id, which changes on delete/start).
      out_file: "/root/.pm2/logs/examsphere-out.log",
      error_file: "/root/.pm2/logs/examsphere-error.log",
      env: {
        NODE_ENV: "production",
        PORT: "3300",
      },
    },
  ],
};

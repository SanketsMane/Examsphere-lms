/**
 * Notes AI worker: processes note_generation_jobs (generate drafts, render PDFs).
 *
 *   npx tsx --conditions=react-server scripts/notes-worker.ts          # run forever
 *   npx tsx --conditions=react-server scripts/notes-worker.ts --once   # drain the queue, then exit
 *
 * Production: runs as its own pm2 app ("examsphere-worker", see ecosystem.config.js) so slow AI
 * calls and Chromium never block the website. `--conditions=react-server` lets it load the same
 * lib/ modules as the app (they import "server-only").
 */
import { claimNextJob, WORKER_ID } from "@/lib/notes/ai/jobs";
import { runJob } from "@/lib/notes/ai/pipeline";
import { closeRenderer } from "@/lib/notes/ai/render-pdf";
import { prisma } from "@/lib/db";

const once = process.argv.includes("--once");
const POLL_MS = 3000;
let stopping = false;

async function main() {
  console.log(`[notes-worker] ${WORKER_ID} started${once ? " (--once)" : ""}`);
  while (!stopping) {
    let job = null;
    try {
      job = await claimNextJob();
    } catch (err) {
      console.error("[notes-worker] could not poll the queue:", err);
    }
    if (job) {
      const started = Date.now();
      console.log(`[notes-worker] ${job.type} ${job.id} (note ${job.noteId}, attempt ${job.attempts})`);
      await runJob(job);
      const final = await prisma.noteGenerationJob.findUnique({ where: { id: job.id }, select: { status: true, message: true, error: true } });
      console.log(`[notes-worker] ${job.id} -> ${final?.status} in ${((Date.now() - started) / 1000).toFixed(1)}s ${final?.error ? `(${final.error.slice(0, 200)})` : ""}`);
      continue; // look for the next job straight away
    }
    if (once) break;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  await closeRenderer();
  await prisma.$disconnect();
  console.log("[notes-worker] stopped");
}

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    // Finish the current step; a job interrupted mid-way is picked up again after its lock goes stale.
    stopping = true;
  });
}

main().catch((err) => {
  console.error("[notes-worker] crashed:", err);
  process.exit(1);
});

"use server";

import { generateRecordingSignedUrl } from "@/app/actions/video-call";

// Client components (e.g. the student session card) call this as a server action. It lives
// apart from video-call.ts, which isn't a "use server" module — importing that from the browser
// pulls auth/email (nodemailer) into the client bundle and breaks the build. The wrapped function
// checks the caller is the session's student or teacher.
export async function getRecordingDownloadUrl(sessionId: string) {
  return generateRecordingSignedUrl(sessionId);
}

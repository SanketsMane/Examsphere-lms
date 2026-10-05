import "server-only";
import crypto from "crypto";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

const ALLOWED_EXACT_TYPES = new Set([
  "application/pdf",
  "video/mp4",
  "video/webm",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export function isAllowedUploadType(contentType: string) {
  const type = contentType.toLowerCase().split(";")[0].trim();
  // SVG is an image/* type but can carry script.
  if (type.startsWith("image/")) return type !== "image/svg+xml";
  return ALLOWED_EXACT_TYPES.has(type);
}

export function sanitizeFileName(fileName: string) {
  const base = fileName.split(/[\\/]/).pop() || "file";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+/, "")
    .slice(-100);
  return cleaned || "file";
}

/** Short keyed tag of a user id, so keys identify their uploader without exposing the id. */
export function ownerTagFor(userId: string) {
  return crypto
    .createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`s3-owner:${userId}`)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Admins may delete anything. Everyone else only keys they uploaded (owner tag)
 * or keys referenced by a course, lesson, resource or profile image they own.
 */
export async function canDeleteKey(user: { id: string; role?: string | null }, key: string) {
  if (user.role === "admin") return true;
  if (/^[0-9a-f-]{36}-o[0-9a-f]{16}-/.test(key) && key.slice(37, 55) === `o${ownerTagFor(user.id)}-`) return true;
  // Records store either the bare key or a full URL; a short key would make
  // the substring match below meaningless.
  if (key.length < 20) return false;

  const [course, lesson, resource, profile] = await Promise.all([
    prisma.course.findFirst({ where: { fileKey: { contains: key }, userId: user.id }, select: { id: true } }),
    prisma.lesson.findFirst({
      where: {
        OR: [{ thumbnailKey: { contains: key } }, { videoKey: { contains: key } }],
        Chapter: { Course: { userId: user.id } },
      },
      select: { id: true },
    }),
    prisma.resource.findFirst({
      where: { fileUrl: { contains: key }, teacher: { userId: user.id } },
      select: { id: true },
    }),
    prisma.user.findFirst({ where: { id: user.id, image: { contains: key } }, select: { id: true } }),
  ]);

  return Boolean(course || lesson || resource || profile);
}

-- CreateEnum
CREATE TYPE "VideoQuality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'HD');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "VideoRole" AS ENUM ('HOST', 'MODERATOR', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "ConnectionQuality" AS ENUM ('POOR', 'FAIR', 'GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "ChatMessageType" AS ENUM ('MESSAGE', 'SYSTEM', 'FILE');

-- CreateTable
CREATE TABLE "video_rooms" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hostId" TEXT NOT NULL,
    "courseId" TEXT,
    "chapterId" TEXT,
    "lessonId" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 60,
    "maxParticipants" INTEGER,
    "isRecordingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isScreenSharingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isWhiteboardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isChatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "waitingRoomEnabled" BOOLEAN NOT NULL DEFAULT false,
    "requireModerator" BOOLEAN NOT NULL DEFAULT false,
    "autoRecord" BOOLEAN NOT NULL DEFAULT false,
    "quality" "VideoQuality" NOT NULL DEFAULT 'MEDIUM',
    "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_participants" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "VideoRole" NOT NULL DEFAULT 'PARTICIPANT',
    "isVideoOn" BOOLEAN NOT NULL DEFAULT true,
    "isAudioOn" BOOLEAN NOT NULL DEFAULT true,
    "isScreenSharing" BOOLEAN NOT NULL DEFAULT false,
    "isHandRaised" BOOLEAN NOT NULL DEFAULT false,
    "connectionQuality" "ConnectionQuality" NOT NULL DEFAULT 'GOOD',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "video_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_recordings" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "title" TEXT,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" BIGINT,
    "duration" INTEGER,
    "quality" "VideoQuality" NOT NULL DEFAULT 'MEDIUM',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_chat_messages" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "ChatMessageType" NOT NULL DEFAULT 'MESSAGE',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_rooms_roomId_key" ON "video_rooms"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "video_participants_roomId_userId_key" ON "video_participants"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "whiteboards" ADD CONSTRAINT "whiteboards_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboards" ADD CONSTRAINT "whiteboards_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboards" ADD CONSTRAINT "whiteboards_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_rooms" ADD CONSTRAINT "video_rooms_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_rooms" ADD CONSTRAINT "video_rooms_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_rooms" ADD CONSTRAINT "video_rooms_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_rooms" ADD CONSTRAINT "video_rooms_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_participants" ADD CONSTRAINT "video_participants_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "video_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_participants" ADD CONSTRAINT "video_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_recordings" ADD CONSTRAINT "video_recordings_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "video_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_chat_messages" ADD CONSTRAINT "video_chat_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "video_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_chat_messages" ADD CONSTRAINT "video_chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

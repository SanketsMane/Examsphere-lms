-- CreateEnum
CREATE TYPE "ElementType" AS ENUM ('Pen', 'Line', 'Rectangle', 'Circle', 'Arrow', 'Text', 'Image', 'Sticky', 'Shape', 'Highlight', 'Eraser');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('Owner', 'Moderator', 'Collaborator', 'Viewer');

-- CreateTable
CREATE TABLE "whiteboards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "courseId" TEXT,
    "chapterId" TEXT,
    "lessonId" TEXT,
    "sessionId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "allowDrawing" BOOLEAN NOT NULL DEFAULT true,
    "allowText" BOOLEAN NOT NULL DEFAULT true,
    "allowShapes" BOOLEAN NOT NULL DEFAULT true,
    "allowImages" BOOLEAN NOT NULL DEFAULT true,
    "allowAnnotations" BOOLEAN NOT NULL DEFAULT true,
    "width" INTEGER NOT NULL DEFAULT 1920,
    "height" INTEGER NOT NULL DEFAULT 1080,
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "maxParticipants" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whiteboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whiteboard_elements" (
    "id" TEXT NOT NULL,
    "whiteboardId" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,
    "type" "ElementType" NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "strokeColor" TEXT NOT NULL DEFAULT '#000000',
    "fillColor" TEXT,
    "strokeWidth" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whiteboard_elements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whiteboard_sessions" (
    "id" TEXT NOT NULL,
    "whiteboardId" TEXT NOT NULL,
    "sessionName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canDraw" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "whiteboard_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whiteboard_participants" (
    "id" TEXT NOT NULL,
    "whiteboardId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'Viewer',
    "cursorColor" TEXT NOT NULL DEFAULT '#007bff',
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cursorX" DOUBLE PRECISION,
    "cursorY" DOUBLE PRECISION,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "whiteboard_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whiteboard_elements_whiteboardId_elementId_key" ON "whiteboard_elements"("whiteboardId", "elementId");

-- CreateIndex
CREATE UNIQUE INDEX "whiteboard_participants_whiteboardId_userId_key" ON "whiteboard_participants"("whiteboardId", "userId");

-- AddForeignKey
ALTER TABLE "whiteboards" ADD CONSTRAINT "whiteboards_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboard_elements" ADD CONSTRAINT "whiteboard_elements_whiteboardId_fkey" FOREIGN KEY ("whiteboardId") REFERENCES "whiteboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboard_elements" ADD CONSTRAINT "whiteboard_elements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboard_sessions" ADD CONSTRAINT "whiteboard_sessions_whiteboardId_fkey" FOREIGN KEY ("whiteboardId") REFERENCES "whiteboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboard_participants" ADD CONSTRAINT "whiteboard_participants_whiteboardId_fkey" FOREIGN KEY ("whiteboardId") REFERENCES "whiteboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboard_participants" ADD CONSTRAINT "whiteboard_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "whiteboard_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboard_participants" ADD CONSTRAINT "whiteboard_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Widen long-text columns from VARCHAR(191) to TEXT / MEDIUMTEXT.
--
-- Why: the schema came over from Postgres, where a bare `String` is unbounded. On MySQL
-- Prisma maps it to VARCHAR(191), so any value longer than 191 characters failed to save
-- (Prisma P2000). In production this blocked course creation on 2026-10-22 (22 failed
-- attempts, "column too long: description"), and the same limit applied to lesson
-- descriptions, blog/page content, bios, reviews, quiz text, messages, URLs and the
-- Better Auth session user-agent (in-app browsers send 230-300 char user agents).
--
-- Every statement only widens a column: no data is dropped or rewritten, and none of
-- these columns is indexed. Generated with
--   prisma migrate diff --from-schema-datamodel <before> --to-schema-datamodel prisma/schema.prisma --script
--
-- Apply once, after a backup:
--   docker exec -i examsphere-mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" examsphere_lms' < prisma/sql/20261109_widen_text_columns.sql
-- Re-running it is harmless (MODIFY to the same type is a no-op change).

-- AlterTable
ALTER TABLE `user` MODIFY `image` TEXT NULL,
    MODIFY `bio` TEXT NULL;

-- AlterTable
ALTER TABLE `issues` MODIFY `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `session` MODIFY `userAgent` TEXT NULL;

-- AlterTable
ALTER TABLE `account` MODIFY `accessToken` TEXT NULL,
    MODIFY `refreshToken` TEXT NULL,
    MODIFY `idToken` TEXT NULL,
    MODIFY `scope` TEXT NULL,
    MODIFY `password` TEXT NULL;

-- AlterTable
ALTER TABLE `verification` MODIFY `value` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Course` MODIFY `description` MEDIUMTEXT NOT NULL,
    MODIFY `smallDescription` TEXT NOT NULL,
    MODIFY `rejectionReason` TEXT NULL,
    MODIFY `prerequisites` TEXT NULL;

-- AlterTable
ALTER TABLE `Lesson` MODIFY `description` MEDIUMTEXT NULL,
    MODIFY `videoUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `TeacherProfile` MODIFY `bio` TEXT NULL;

-- AlterTable
ALTER TABLE `live_sessions` MODIFY `description` TEXT NULL,
    MODIFY `meetingUrl` TEXT NULL,
    MODIFY `recordingUrl` TEXT NULL,
    MODIFY `notes` TEXT NULL;

-- AlterTable
ALTER TABLE `session_templates` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `learning_goals` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `achievements` MODIFY `description` TEXT NOT NULL,
    MODIFY `badgeUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `GroupClass` MODIFY `description` TEXT NOT NULL,
    MODIFY `meetingUrl` TEXT NULL,
    MODIFY `bannerUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `Review` MODIFY `comment` TEXT NULL;

-- AlterTable
ALTER TABLE `Category` MODIFY `description` TEXT NULL,
    MODIFY `image` TEXT NULL;

-- AlterTable
ALTER TABLE `commissions` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `Notification` MODIFY `message` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Message` MODIFY `content` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Certificate` MODIFY `verificationUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `BlogPost` MODIFY `excerpt` TEXT NULL,
    MODIFY `content` MEDIUMTEXT NOT NULL,
    MODIFY `featuredImage` TEXT NULL,
    MODIFY `metaDescription` TEXT NULL;

-- AlterTable
ALTER TABLE `BlogCategory` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `SiteSettings` MODIFY `siteUrl` TEXT NOT NULL,
    MODIFY `contactAddress` TEXT NULL;

-- AlterTable
ALTER TABLE `Page` MODIFY `content` MEDIUMTEXT NOT NULL,
    MODIFY `metaDescription` TEXT NULL;

-- AlterTable
ALTER TABLE `Testimonial` MODIFY `content` TEXT NOT NULL,
    MODIFY `image` TEXT NULL;

-- AlterTable
ALTER TABLE `learning_paths` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `quizzes` MODIFY `description` TEXT NULL,
    MODIFY `instructions` TEXT NULL;

-- AlterTable
ALTER TABLE `quiz_questions` MODIFY `question` TEXT NOT NULL,
    MODIFY `explanation` TEXT NULL;

-- AlterTable
ALTER TABLE `quiz_responses` MODIFY `feedback` TEXT NULL;

-- AlterTable
ALTER TABLE `whiteboards` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `video_rooms` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `video_recordings` MODIFY `fileUrl` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `video_chat_messages` MODIFY `message` TEXT NOT NULL,
    MODIFY `fileUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `teacher_verifications` MODIFY `identityDocumentUrl` TEXT NULL,
    MODIFY `adminNotes` TEXT NULL,
    MODIFY `rejectionReason` TEXT NULL;

-- AlterTable
ALTER TABLE `payout_requests` MODIFY `bankAddress` TEXT NULL,
    MODIFY `adminNotes` TEXT NULL,
    MODIFY `rejectionReason` TEXT NULL;

-- AlterTable
ALTER TABLE `subscription_plan` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `resources` MODIFY `description` TEXT NULL,
    MODIFY `fileUrl` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `refund_requests` MODIFY `reason` TEXT NOT NULL,
    MODIFY `adminNotes` TEXT NULL;

-- AlterTable
ALTER TABLE `wallet_transactions` MODIFY `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Broadcast` MODIFY `text` TEXT NOT NULL,
    MODIFY `link` TEXT NULL;

-- AlterTable
ALTER TABLE `system_transactions` MODIFY `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `session_bundles` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `gift_cards` MODIFY `message` TEXT NULL;


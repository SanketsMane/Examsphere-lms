-- Notes module: notes, versions, course links, entitlements, events (phase 1); AI generation
-- jobs and sources (phase 2); notes settings (refund policy, AI budget) and refund requests.
-- Also NOTE_PURCHASE in TransactionType / WalletTransactionType and REFUNDED in TransactionStatus.
-- Additive only: new tables and enum values; no existing data changes.
-- Generated with: prisma migrate diff --from-schema-datamodel <schema at 02e9e2d> --to-schema-datamodel prisma/schema.prisma --script
-- Apply after a backup:
--   docker exec -i examsphere-mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" examsphere_lms' < prisma/sql/20261110_notes_module.sql

-- AlterTable
ALTER TABLE `wallet_transactions` MODIFY `type` ENUM('RECHARGE', 'COURSE_PURCHASE', 'SESSION_BOOKING', 'GROUP_ENROLLMENT', 'REFUND', 'ADMIN_CREDIT', 'ADMIN_DEBIT', 'NOTE_PURCHASE') NOT NULL;

-- AlterTable
ALTER TABLE `system_transactions` MODIFY `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    MODIFY `type` ENUM('COURSE_PURCHASE', 'WALLET_RECHARGE', 'WITHDRAWAL', 'SESSION_BOOKING', 'SUBSCRIPTION_PURCHASE', 'SUBSCRIPTION_RENEWAL', 'GIFT_CARD_PURCHASE', 'NOTE_PURCHASE') NOT NULL;

-- CreateTable
CREATE TABLE `notes` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `shortDescription` TEXT NULL,
    `description` TEXT NULL,
    `program` VARCHAR(100) NULL,
    `subject` VARCHAR(100) NULL,
    `chapter` VARCHAR(200) NULL,
    `language` VARCHAR(50) NOT NULL DEFAULT 'English',
    `coverKey` TEXT NULL,
    `status` ENUM('DRAFT', 'PROCESSING', 'REVIEW', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `accessType` ENUM('FREE', 'PAID', 'COURSE_ONLY') NOT NULL DEFAULT 'PAID',
    `pricePaise` INTEGER NOT NULL DEFAULT 0,
    `discountPricePaise` INTEGER NULL,
    `previewPages` INTEGER NOT NULL DEFAULT 2,
    `allowDownload` BOOLEAN NOT NULL DEFAULT false,
    `maxDownloads` INTEGER NOT NULL DEFAULT 3,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `currentVersionId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notes_slug_key`(`slug`),
    UNIQUE INDEX `notes_currentVersionId_key`(`currentVersionId`),
    INDEX `notes_status_accessType_idx`(`status`, `accessType`),
    INDEX `notes_program_subject_idx`(`program`, `subject`),
    INDEX `notes_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `note_versions` (
    `id` VARCHAR(191) NOT NULL,
    `noteId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `fileKey` TEXT NOT NULL,
    `previewKey` TEXT NULL,
    `fileSize` INTEGER NOT NULL,
    `pageCount` INTEGER NOT NULL,
    `sha256` VARCHAR(64) NOT NULL,
    `origin` VARCHAR(20) NOT NULL DEFAULT 'UPLOAD',
    `contentJson` JSON NULL,
    `changelog` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `note_versions_noteId_version_key`(`noteId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_notes` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `noteId` VARCHAR(191) NOT NULL,
    `includedWithCourse` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `course_notes_noteId_idx`(`noteId`),
    UNIQUE INDEX `course_notes_courseId_noteId_key`(`courseId`, `noteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `note_entitlements` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `noteId` VARCHAR(191) NOT NULL,
    `source` ENUM('PURCHASE', 'WALLET', 'FREE', 'COURSE', 'ADMIN_GRANT') NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'REFUNDED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
    `amountPaise` INTEGER NOT NULL DEFAULT 0,
    `razorpayOrderId` VARCHAR(64) NULL,
    `razorpayPaymentId` VARCHAR(64) NULL,
    `grantedById` VARCHAR(191) NULL,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `lastReadPage` INTEGER NULL,
    `maxReadPage` INTEGER NULL,
    `lastReadAt` DATETIME(3) NULL,
    `activatedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `revokeReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `note_entitlements_razorpayOrderId_key`(`razorpayOrderId`),
    INDEX `note_entitlements_noteId_status_idx`(`noteId`, `status`),
    INDEX `note_entitlements_status_activatedAt_idx`(`status`, `activatedAt`),
    UNIQUE INDEX `note_entitlements_userId_noteId_key`(`userId`, `noteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `note_events` (
    `id` VARCHAR(191) NOT NULL,
    `noteId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `type` ENUM('VIEW', 'PREVIEW', 'DOWNLOAD') NOT NULL,
    `page` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `note_events_noteId_type_createdAt_idx`(`noteId`, `type`, `createdAt`),
    INDEX `note_events_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `note_generation_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `noteId` VARCHAR(191) NOT NULL,
    `type` ENUM('GENERATE', 'RENDER') NOT NULL,
    `status` ENUM('QUEUED', 'RUNNING', 'REVIEW', 'DONE', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'QUEUED',
    `stage` VARCHAR(30) NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `message` TEXT NULL,
    `options` JSON NOT NULL,
    `draftDoc` JSON NULL,
    `reviewIssues` JSON NULL,
    `provider` VARCHAR(30) NULL,
    `model` VARCHAR(60) NULL,
    `inputTokens` INTEGER NOT NULL DEFAULT 0,
    `outputTokens` INTEGER NOT NULL DEFAULT 0,
    `costUsdMicros` INTEGER NOT NULL DEFAULT 0,
    `error` TEXT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `lockedBy` VARCHAR(100) NULL,
    `lockedAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `resultVersionId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `note_generation_jobs_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `note_generation_jobs_noteId_createdAt_idx`(`noteId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `note_sources` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `kind` ENUM('PDF', 'IMAGE') NOT NULL,
    `fileKey` TEXT NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `size` INTEGER NOT NULL,
    `pageCount` INTEGER NOT NULL DEFAULT 1,
    `sha256` VARCHAR(64) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `extraction` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `note_sources_jobId_sortOrder_idx`(`jobId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notes_settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `refundWindowHours` INTEGER NOT NULL DEFAULT 48,
    `refundMaxReadPercent` INTEGER NOT NULL DEFAULT 20,
    `refundRequiresNoDownload` BOOLEAN NOT NULL DEFAULT true,
    `autoApproveRefunds` BOOLEAN NOT NULL DEFAULT false,
    `aiModel` VARCHAR(60) NOT NULL DEFAULT 'claude-opus-5-5',
    `aiMonthlyBudgetUsd` INTEGER NOT NULL DEFAULT 50,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `note_refund_requests` (
    `id` VARCHAR(191) NOT NULL,
    `entitlementId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `noteId` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `adminNote` TEXT NULL,
    `decidedById` VARCHAR(191) NULL,
    `decidedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `note_refund_requests_entitlementId_key`(`entitlementId`),
    INDEX `note_refund_requests_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notes` ADD CONSTRAINT `notes_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notes` ADD CONSTRAINT `notes_currentVersionId_fkey` FOREIGN KEY (`currentVersionId`) REFERENCES `note_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note_versions` ADD CONSTRAINT `note_versions_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_notes` ADD CONSTRAINT `course_notes_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_notes` ADD CONSTRAINT `course_notes_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note_entitlements` ADD CONSTRAINT `note_entitlements_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note_entitlements` ADD CONSTRAINT `note_entitlements_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note_events` ADD CONSTRAINT `note_events_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note_events` ADD CONSTRAINT `note_events_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note_generation_jobs` ADD CONSTRAINT `note_generation_jobs_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note_sources` ADD CONSTRAINT `note_sources_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `note_generation_jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note_refund_requests` ADD CONSTRAINT `note_refund_requests_entitlementId_fkey` FOREIGN KEY (`entitlementId`) REFERENCES `note_entitlements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note_refund_requests` ADD CONSTRAINT `note_refund_requests_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `notes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- Notes module (phase 1): notes, versions, course links, entitlements, events,
-- plus NOTE_PURCHASE in TransactionType / WalletTransactionType.
-- Additive only: new tables and two enum values; no existing data changes.
-- Generated with: prisma migrate diff --from-schema-datamodel <before> --to-schema-datamodel prisma/schema.prisma --script
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


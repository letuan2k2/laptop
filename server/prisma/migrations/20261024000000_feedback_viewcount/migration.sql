-- AlterTable
ALTER TABLE `product` ADD COLUMN `viewCount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `feedback` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `orderCode` VARCHAR(191) NULL,
    `type` ENUM('SUGGESTION', 'COMPLAINT', 'WARRANTY') NOT NULL DEFAULT 'SUGGESTION',
    `content` TEXT NOT NULL,
    `status` ENUM('NEW', 'PROCESSING', 'RESOLVED') NOT NULL DEFAULT 'NEW',
    `adminNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `feedback_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


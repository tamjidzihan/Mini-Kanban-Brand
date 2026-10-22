SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for table `SequelizeMeta`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `SequelizeMeta`;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `User`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
  `id` varchar(36) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `avatarUrl` varchar(191) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Board`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Board`;
CREATE TABLE `Board` (
  `id` varchar(36) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `ownerId` varchar(36) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ownerId` (`ownerId`),
  CONSTRAINT `Board_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `BoardMember`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `BoardMember`;
CREATE TABLE `BoardMember` (
  `id` varchar(36) NOT NULL,
  `boardId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `role` enum('OWNER','EDITOR','VIEWER') NOT NULL DEFAULT 'VIEWER',
  `status` enum('PENDING','ACCEPTED','DECLINED') NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `BoardMember_boardId_userId_key` (`boardId`,`userId`),
  KEY `userId` (`userId`),
  CONSTRAINT `BoardMember_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `Board` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `BoardMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Column`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Column`;
CREATE TABLE `Column` (
  `id` varchar(36) NOT NULL,
  `title` varchar(191) NOT NULL,
  `position` double NOT NULL,
  `boardId` varchar(36) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `boardId` (`boardId`),
  CONSTRAINT `Column_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `Board` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Task`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Task`;
CREATE TABLE `Task` (
  `id` varchar(36) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `columnId` varchar(36) NOT NULL,
  `boardId` varchar(36) NOT NULL,
  `position` double NOT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  `dueDate` datetime DEFAULT NULL,
  `assignedToId` varchar(36) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `columnId` (`columnId`),
  KEY `boardId` (`boardId`),
  KEY `assignedToId` (`assignedToId`),
  CONSTRAINT `Task_columnId_fkey` FOREIGN KEY (`columnId`) REFERENCES `Column` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Task_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `Board` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Task_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Subtask`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Subtask`;
CREATE TABLE `Subtask` (
  `id` varchar(36) NOT NULL,
  `title` varchar(191) NOT NULL,
  `isCompleted` tinyint(1) NOT NULL DEFAULT 0,
  `position` double NOT NULL DEFAULT 0,
  `taskId` varchar(36) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `taskId` (`taskId`),
  CONSTRAINT `Subtask_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Comment`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Comment`;
CREATE TABLE `Comment` (
  `id` varchar(36) NOT NULL,
  `content` text NOT NULL,
  `taskId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `taskId` (`taskId`),
  KEY `userId` (`userId`),
  CONSTRAINT `Comment_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `ActivityLog`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ActivityLog`;
CREATE TABLE `ActivityLog` (
  `id` varchar(36) NOT NULL,
  `action` varchar(191) NOT NULL,
  `details` text DEFAULT NULL,
  `taskId` varchar(36) DEFAULT NULL,
  `boardId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `taskId` (`taskId`),
  KEY `boardId` (`boardId`),
  KEY `userId` (`userId`),
  CONSTRAINT `ActivityLog_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ActivityLog_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `Board` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Mark migration as applied in SequelizeMeta
-- --------------------------------------------------------
INSERT INTO `SequelizeMeta` (`name`) VALUES ('20261023000000-init-database.js') ON DUPLICATE KEY UPDATE `name`=`name`;

SET FOREIGN_KEY_CHECKS = 1;

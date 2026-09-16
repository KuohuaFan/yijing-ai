CREATE TABLE `commentaryAnnotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`anchor` varchar(255) NOT NULL,
	`commentator` varchar(120) NOT NULL DEFAULT '我的研讀註解',
	`versionLabel` varchar(120) NOT NULL DEFAULT '使用者註解',
	`body` text NOT NULL,
	`visibility` enum('private','shared') NOT NULL DEFAULT 'private',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commentaryAnnotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `commentaryAnnotations` ADD CONSTRAINT `commentaryAnnotations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
CREATE TABLE `mediaAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chatRecordKey` varchar(128) NOT NULL,
	`divinationRecordId` int,
	`kind` enum('image','video','audio') NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`sizeBytes` int NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`storageUrl` varchar(1200) NOT NULL,
	`transcript` text,
	`transcriptSegments` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mediaAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shareSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`payload` json NOT NULL,
	`includesAttachments` boolean NOT NULL DEFAULT false,
	`isRevoked` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shareSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `shareSnapshots_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `mediaAttachments` ADD CONSTRAINT `mediaAttachments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mediaAttachments` ADD CONSTRAINT `mediaAttachments_divinationRecordId_divinationRecords_id_fk` FOREIGN KEY (`divinationRecordId`) REFERENCES `divinationRecords`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shareSnapshots` ADD CONSTRAINT `shareSnapshots_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
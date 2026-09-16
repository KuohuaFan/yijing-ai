CREATE TABLE `divinationRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`question` text,
	`method` enum('three_coins','manual') NOT NULL DEFAULT 'three_coins',
	`lineValues` json NOT NULL,
	`originalHexagramId` int NOT NULL,
	`transformedHexagramId` int NOT NULL,
	`movingLines` json NOT NULL,
	`sourceVersion` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `divinationRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reflectionNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`divinationRecordId` int,
	`anchor` varchar(255),
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reflectionNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sourceReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterEmail` varchar(320),
	`anchor` varchar(255),
	`message` text NOT NULL,
	`status` enum('new','reviewed','resolved') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sourceReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `divinationRecords` ADD CONSTRAINT `divinationRecords_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reflectionNotes` ADD CONSTRAINT `reflectionNotes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reflectionNotes` ADD CONSTRAINT `reflectionNotes_divinationRecordId_divinationRecords_id_fk` FOREIGN KEY (`divinationRecordId`) REFERENCES `divinationRecords`(`id`) ON DELETE set null ON UPDATE no action;
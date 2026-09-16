CREATE TABLE `annualReadings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`birthProfileId` int NOT NULL,
	`baziChartId` int NOT NULL,
	`targetYear` int NOT NULL,
	`annualResult` json NOT NULL,
	`guideContent` text,
	`guideKind` enum('guide','fallback','safety_redirect'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `annualReadings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `baziCharts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`birthProfileId` int NOT NULL,
	`targetYear` int NOT NULL,
	`sect` int NOT NULL,
	`chartResult` json NOT NULL,
	`engineVersion` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `baziCharts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `birthProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`encryptedPayload` text NOT NULL,
	`encryptionIv` varchar(64) NOT NULL,
	`encryptionAuthTag` varchar(64) NOT NULL,
	`encryptionVersion` varchar(64) NOT NULL,
	`consentVersion` varchar(64) NOT NULL,
	`consentedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `birthProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sensitiveDataConsents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`birthProfileId` int NOT NULL,
	`purpose` enum('bazi_private_storage') NOT NULL DEFAULT 'bazi_private_storage',
	`policyVersion` varchar(64) NOT NULL,
	`consentedAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sensitiveDataConsents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `annualReadings` ADD CONSTRAINT `annualReadings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `annualReadings` ADD CONSTRAINT `annualReadings_birthProfileId_birthProfiles_id_fk` FOREIGN KEY (`birthProfileId`) REFERENCES `birthProfiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `annualReadings` ADD CONSTRAINT `annualReadings_baziChartId_baziCharts_id_fk` FOREIGN KEY (`baziChartId`) REFERENCES `baziCharts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `baziCharts` ADD CONSTRAINT `baziCharts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `baziCharts` ADD CONSTRAINT `baziCharts_birthProfileId_birthProfiles_id_fk` FOREIGN KEY (`birthProfileId`) REFERENCES `birthProfiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `birthProfiles` ADD CONSTRAINT `birthProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sensitiveDataConsents` ADD CONSTRAINT `sensitiveDataConsents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sensitiveDataConsents` ADD CONSTRAINT `sensitiveDataConsents_birthProfileId_birthProfiles_id_fk` FOREIGN KEY (`birthProfileId`) REFERENCES `birthProfiles`(`id`) ON DELETE cascade ON UPDATE no action;
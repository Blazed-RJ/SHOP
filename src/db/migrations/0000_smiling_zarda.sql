CREATE TABLE `batch_registry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inventory_item_id` integer NOT NULL,
	`batch_number` text NOT NULL,
	`supplier_id` integer,
	`mfg_date` integer,
	`expiry_date` integer,
	`cost_price_paise` integer NOT NULL,
	`quantity_primary` integer DEFAULT 0,
	`quantity_secondary` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`gstin` text,
	`address` text,
	`loyalty_points` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_phone_unique` ON `customers` (`phone`);--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`barcode` text,
	`category` text,
	`hsn_code` text,
	`gst_rate` real NOT NULL,
	`base_price_paise` integer NOT NULL,
	`selling_price_paise` integer NOT NULL,
	`primary_unit` text DEFAULT 'pcs',
	`secondary_unit` text,
	`conversion_rate` real,
	`attributes` text DEFAULT '{}',
	`total_stock_primary` integer DEFAULT 0,
	`total_stock_secondary` integer DEFAULT 0,
	`low_stock_threshold` integer DEFAULT 5,
	`is_active` integer DEFAULT true,
	`store_id` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_items_sku_unique` ON `inventory_items` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_items_barcode_unique` ON `inventory_items` (`barcode`);--> statement-breakpoint
CREATE TABLE `invoice_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`inventory_item_id` integer NOT NULL,
	`batch_id` integer,
	`quantity` integer NOT NULL,
	`unit` text,
	`price_at_sale_paise` integer NOT NULL,
	`gst_rate_at_sale` real NOT NULL,
	`total_line_cgst_paise` integer DEFAULT 0,
	`total_line_sgst_paise` integer DEFAULT 0,
	`total_line_igst_paise` integer DEFAULT 0,
	`total_line_amount_paise` integer NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales_ledger`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`batch_id`) REFERENCES `batch_registry`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text NOT NULL,
	`customer_id` integer,
	`cashier_id` integer,
	`store_id` integer,
	`subtotal_paise` integer NOT NULL,
	`cgst_paise` integer DEFAULT 0,
	`sgst_paise` integer DEFAULT 0,
	`igst_paise` integer DEFAULT 0,
	`discount_paise` integer DEFAULT 0,
	`round_off_paise` integer DEFAULT 0,
	`grand_total_paise` integer NOT NULL,
	`payment_method` text DEFAULT 'cash',
	`payment_status` text DEFAULT 'paid',
	`created_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cashier_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_ledger_invoice_number_unique` ON `sales_ledger` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`contact_person` text,
	`phone` text,
	`email` text,
	`gstin` text,
	`address` text,
	`balance_paise` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'cashier',
	`store_id` integer,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
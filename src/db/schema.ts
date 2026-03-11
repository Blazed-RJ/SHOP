import {
    pgTable,
    serial,
    varchar,
    timestamp,
    integer,
    jsonb,
    boolean,
    text,
    bigint,
    decimal,
  } from 'drizzle-orm/pg-core';
  
  // 1. Users & Roles
  export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    passwordHash: text('password_hash').notNull(),
    role: varchar('role', { length: 50 }).default('cashier'), // admin, manager, cashier
    storeId: integer('store_id'), // For multi-branch
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  });
  
  // 2. Suppliers
  export const suppliers = pgTable('suppliers', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    contactPerson: varchar('contact_person', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 255 }),
    gstin: varchar('gstin', { length: 50 }),
    address: text('address'),
    balancePaise: bigint('balance_paise', { mode: 'number' }).default(0), // Track what we owe them
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  });
  
  // 3. Customers (CRM)
  export const customers = pgTable('customers', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).unique(),
    email: varchar('email', { length: 255 }),
    gstin: varchar('gstin', { length: 50 }), // Important for IGST/CGST split
    address: text('address'),
    loyaltyPoints: integer('loyalty_points').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  });
  
  // 4. Inventory Items (The "Precision" Layer)
  export const inventoryItems = pgTable('inventory_items', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).unique(),
    barcode: varchar('barcode', { length: 150 }).unique(),
    category: varchar('category', { length: 100 }),
    hsnCode: varchar('hsn_code', { length: 50 }),
    gstRate: decimal('gst_rate', { precision: 5, scale: 2 }).notNull(), // e.g., 18.00
    
    // Core pricing (stored in paise to avoid float math errors)
    basePricePaise: bigint('base_price_paise', { mode: 'number' }).notNull(),
    sellingPricePaise: bigint('selling_price_paise', { mode: 'number' }).notNull(),
    
    // Multi-unit tracking
    primaryUnit: varchar('primary_unit', { length: 50 }).default('pcs'), // 'roll', 'box'
    secondaryUnit: varchar('secondary_unit', { length: 50 }), // 'meter', 'tablet'
    conversionRate: decimal('conversion_rate', { precision: 10, scale: 4 }), // 1 roll = 100 meters
    
    // JSONB for segment-specific dynamic data
    attributes: jsonb('attributes').default({}),
    
    totalStockPrimary: integer('total_stock_primary').default(0),
    totalStockSecondary: integer('total_stock_secondary').default(0),
    
    lowStockThreshold: integer('low_stock_threshold').default(5),
    isActive: boolean('is_active').default(true),
    storeId: integer('store_id'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  });
  
  // 5. Batch Registry (FEFO & granular tracking)
  export const batchRegistry = pgTable('batch_registry', {
    id: serial('id').primaryKey(),
    inventoryItemId: integer('inventory_item_id').references(() => inventoryItems.id).notNull(),
    batchNumber: varchar('batch_number', { length: 100 }).notNull(),
    supplierId: integer('supplier_id').references(() => suppliers.id),
    
    mfgDate: timestamp('mfg_date'),
    expiryDate: timestamp('expiry_date'),
    
    costPricePaise: bigint('cost_price_paise', { mode: 'number' }).notNull(),
    
    quantityPrimary: integer('quantity_primary').default(0),
    quantitySecondary: integer('quantity_secondary').default(0),
    
    createdAt: timestamp('created_at').defaultNow(),
  });
  
  // 6. Sales Ledger (Invoices)
  export const salesLedger = pgTable('sales_ledger', {
    id: serial('id').primaryKey(),
    invoiceNumber: varchar('invoice_number', { length: 100 }).unique().notNull(),
    customerId: integer('customer_id').references(() => customers.id),
    cashierId: integer('cashier_id').references(() => users.id),
    storeId: integer('store_id'),
    
    subtotalPaise: bigint('subtotal_paise', { mode: 'number' }).notNull(),
    cgstPaise: bigint('cgst_paise', { mode: 'number' }).default(0),
    sgstPaise: bigint('sgst_paise', { mode: 'number' }).default(0),
    igstPaise: bigint('igst_paise', { mode: 'number' }).default(0),
    discountPaise: bigint('discount_paise', { mode: 'number' }).default(0),
    roundOffPaise: bigint('round_off_paise', { mode: 'number' }).default(0),
    grandTotalPaise: bigint('grand_total_paise', { mode: 'number' }).notNull(),
    
    paymentMethod: varchar('payment_method', { length: 50 }).default('cash'),
    paymentStatus: varchar('payment_status', { length: 50 }).default('paid'),
    
    createdAt: timestamp('created_at').defaultNow(),
  });
  
  // 7. Invoice Details (Line items)
  export const invoiceDetails = pgTable('invoice_details', {
    id: serial('id').primaryKey(),
    saleId: integer('sale_id').references(() => salesLedger.id).notNull(),
    inventoryItemId: integer('inventory_item_id').references(() => inventoryItems.id).notNull(),
    batchId: integer('batch_id').references(() => batchRegistry.id),
    
    quantity: integer('quantity').notNull(),
    unit: varchar('unit', { length: 50 }),
    
    priceAtSalePaise: bigint('price_at_sale_paise', { mode: 'number' }).notNull(),
    gstRateAtSale: decimal('gst_rate_at_sale', { precision: 5, scale: 2 }).notNull(),
    
    totalLineCgstPaise: bigint('total_line_cgst_paise', { mode: 'number' }).default(0),
    totalLineSgstPaise: bigint('total_line_sgst_paise', { mode: 'number' }).default(0),
    totalLineIgstPaise: bigint('total_line_igst_paise', { mode: 'number' }).default(0),
    totalLineAmountPaise: bigint('total_line_amount_paise', { mode: 'number' }).notNull(),
  });

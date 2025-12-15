import { pgTable, text, integer, timestamp, boolean, uuid, jsonb, pgEnum } from "drizzle-orm/pg-core";
			
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
    role: text('role').default('user'),
    phone: text('phone').unique(),
    payoutCardPan: text('payout_card_pan'),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(()=> user.id),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(()=> user.id),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});

export const addresses = pgTable("addresses", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    title: text("title").notNull(), // e.g. "Home", "Work"
    addressLine: text("address_line").notNull(),
    city: text("city").notNull(),
    zipCode: text("zip_code"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// App Specific Tables

export const listingStatusEnum = pgEnum('listing_status', ['active', 'sold', 'draft'])
export const escrowStatusEnum = pgEnum('escrow_status', ['held', 'released', 'disputed', 'refunded'])
export const disputeStatusEnum = pgEnum('dispute_status', ['open', 'resolved_refund', 'resolved_payout'])

export const listings = pgTable('listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: text('seller_id').references(() => user.id).notNull(),
  modelName: text('model_name').notNull(),
  imeiMasked: text('imei_masked').notNull(),
  imeiEncrypted: text('imei_encrypted').notNull(),
  faultTree: jsonb('fault_tree').$type<Record<string, any>>().notNull(),
  photos: text('photos').array().notNull(),
  price: integer('price').notNull(), // Storing in cents/lowest unit or use numeric
  status: listingStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  listingId: uuid('listing_id').references(() => listings.id).notNull(),
  buyerId: text('buyer_id').references(() => user.id).notNull(),
  sellerId: text('seller_id').references(() => user.id).notNull(),
  amount: integer('amount').notNull(),
  escrowStatus: escrowStatusEnum('escrow_status').default('held').notNull(),
  cargoTrackingCode: text('cargo_tracking_code'),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const disputes = pgTable('disputes', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  reason: text('reason').notNull(),
  videoProofUrl: text('video_proof_url').notNull(),
  status: disputeStatusEnum('status').default('open').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: text('sender_id').references(() => user.id).notNull(),
  receiverId: text('receiver_id').references(() => user.id).notNull(),
  listingId: uuid('listing_id').references(() => listings.id),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => user.id).notNull(),
  listingId: uuid('listing_id').references(() => listings.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

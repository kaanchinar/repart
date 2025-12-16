import { relations } from "drizzle-orm";
import { pgTable, text, integer, timestamp, boolean, uuid, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
			
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
export const deviceTypeEnum = pgEnum('device_type', ['phone', 'computer', 'tablet'])
export const userRoleEnum = pgEnum('user_role', ['user', 'moderator', 'admin'])
export const deviceCatalogStatusEnum = pgEnum('device_catalog_status', ['active', 'draft', 'archived'])
export const payoutTypeEnum = pgEnum('payout_type', ['seller_release', 'buyer_refund'])
export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'processed', 'failed'])
export const notificationChannelEnum = pgEnum('notification_channel', ['push', 'sms', 'both'])
export const notificationAudienceEnum = pgEnum('notification_audience', ['all', 'buyers', 'sellers'])
export const notificationStatusEnum = pgEnum('notification_status', ['draft', 'sent', 'failed'])
export const deliveryStatusEnum = pgEnum('delivery_status', ['pending', 'sent', 'failed'])

export const listings = pgTable('listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: text('seller_id').references(() => user.id).notNull(),
  modelName: text('model_name').notNull(),
  brand: text('brand').default('Unknown').notNull(),
  deviceType: deviceTypeEnum('device_type').default('phone').notNull(),
  imeiMasked: text('imei_masked').notNull(),
  imeiEncrypted: text('imei_encrypted').notNull(),
  faultTree: jsonb('fault_tree').$type<Record<string, unknown>>().notNull(),
  photos: text('photos').array().notNull(),
  conditionSummary: text('condition_summary'),
  price: integer('price').notNull(), // Storing in cents/lowest unit or use numeric
  moderationNotes: text('moderation_notes'),
  riskScore: integer('risk_score').default(50).notNull(),
  status: listingStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const deviceCatalogEntries = pgTable('device_catalog_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  deviceType: deviceTypeEnum('device_type').default('phone').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  chipset: text('chipset'),
  storage: text('storage'),
  ram: text('ram'),
  basePrice: integer('base_price').notNull(),
  floorPrice: integer('floor_price').notNull(),
  status: deviceCatalogStatusEnum('status').default('active').notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
})

export const deviceCategories = pgTable('device_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: text('label').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  deviceType: deviceTypeEnum('device_type').default('phone').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
}, (table) => [
  index('device_categories_slug_idx').on(table.slug),
])

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

export const payouts = pgTable('payouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  amount: integer('amount').notNull(),
  type: payoutTypeEnum('type').notNull(),
  status: payoutStatusEnum('status').default('processed').notNull(),
  processedBy: text('processed_by').references(() => user.id),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at').defaultNow().notNull(),
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

export const systemNotifications = pgTable('system_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  channel: notificationChannelEnum('channel').default('push').notNull(),
  audience: notificationAudienceEnum('audience').default('all').notNull(),
  status: notificationStatusEnum('status').default('draft').notNull(),
  sentCount: integer('sent_count').default(0).notNull(),
  createdBy: text('created_by').references(() => user.id),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastSentAt: timestamp('last_sent_at'),
})

export const systemNotificationRecipients = pgTable('system_notification_recipients', {
  id: uuid('id').defaultRandom().primaryKey(),
  notificationId: uuid('notification_id').references(() => systemNotifications.id).notNull(),
  userId: text('user_id').references(() => user.id).notNull(),
  deliveryStatus: deliveryStatusEnum('delivery_status').default('pending').notNull(),
  deliveredAt: timestamp('delivered_at'),
})

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: text('actor_id').references(() => user.id).notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})




export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  phoneNumber: text("phone_number"),
  phoneNumberVerified: boolean("phone_number_verified"),
  role: userRoleEnum('role').default('user').notNull(),
  isBanned: boolean('is_banned').default(false).notNull(),
  trustScore: integer('trust_score').default(80).notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const twoFactor = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("twoFactor_secret_idx").on(table.secret),
    index("twoFactor_userId_idx").on(table.userId),
  ],
);

export const passkey = pgTable(
  "passkey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull(),
    counter: integer("counter").notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports"),
    createdAt: timestamp("created_at"),
    aaguid: text("aaguid"),
  },
  (table) => [
    index("passkey_userId_idx").on(table.userId),
    index("passkey_credentialID_idx").on(table.credentialID),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  twoFactors: many(twoFactor),
  passkeys: many(passkey),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

export const passkeyRelations = relations(passkey, ({ one }) => ({
  user: one(user, {
    fields: [passkey.userId],
    references: [user.id],
  }),
}));

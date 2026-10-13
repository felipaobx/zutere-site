import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(), name: text('name').notNull(), email: text('email').notNull(), phone: text('phone'), country: text('country').notNull().default('Brasil (+55)'), language: text('language').notNull().default('Português (BR)'), notes: text('notes'), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_clients_owner_email').on(table.ownerId, table.email), index('idx_clients_owner_name').on(table.ownerId, table.name)]);

export const accountSettings = sqliteTable('account_settings', {
  ownerId: text('owner_id').primaryKey(), displayName: text('display_name').notNull().default('Felipe Costa'), studioName: text('studio_name').notNull().default('Estúdio Lume'), loginEmail: text('login_email'), primaryColor: text('primary_color').notNull().default('#6f4cc3'), accentColor: text('accent_color').notNull().default('#a95072'), appearance: text('appearance', { enum: ['light', 'dark', 'system'] }).notNull().default('light'), plan: text('plan', { enum: ['essential', 'studio', 'pro'] }).notNull().default('studio'), updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const galleries = sqliteTable('galleries', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(), clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }), slug: text('slug').notNull(), name: text('name').notNull(), clientName: text('client_name').notNull(), projectType: text('project_type', { enum: ['selection', 'delivery', 'album'] }).notNull().default('selection'), category: text('category').notNull().default('Ensaio'), eventDate: text('event_date'), deadline: text('deadline').notNull(), status: text('status', { enum: ['draft', 'selecting', 'completed', 'expired'] }).notNull().default('draft'), watermarkEnabled: integer('watermark_enabled', { mode: 'boolean' }).notNull().default(true), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_galleries_owner_slug').on(table.ownerId, table.slug), index('idx_galleries_owner_created').on(table.ownerId, table.createdAt), index('idx_galleries_client').on(table.clientId)]);

export const galleryClients = sqliteTable('gallery_clients', {
  id: text('id').primaryKey(), galleryId: text('gallery_id').notNull().references(() => galleries.id, { onDelete: 'cascade' }), clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_gallery_clients_pair').on(table.galleryId, table.clientId), index('idx_gallery_clients_client').on(table.clientId)]);

export const clientCredentials = sqliteTable('client_credentials', {
  id: text('id').primaryKey(), clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }), login: text('login').notNull(), passwordHash: text('password_hash').notNull(), salt: text('salt').notNull(), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(), updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_client_credentials_client').on(table.clientId), uniqueIndex('idx_client_credentials_login').on(table.login)]);

export const clientSessions = sqliteTable('client_sessions', {
  id: text('id').primaryKey(), credentialId: text('credential_id').notNull().references(() => clientCredentials.id, { onDelete: 'cascade' }), tokenHash: text('token_hash').notNull(), expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_client_sessions_token').on(table.tokenHash), index('idx_client_sessions_credential_expiry').on(table.credentialId, table.expiresAt)]);

export const photos = sqliteTable('photos', {
  id: text('id').primaryKey(), galleryId: text('gallery_id').notNull().references(() => galleries.id, { onDelete: 'cascade' }), storageKey: text('storage_key').notNull().unique(), filename: text('filename').notNull(), contentType: text('content_type').notNull(), size: integer('size').notNull(), sortOrder: integer('sort_order').notNull().default(0), isCover: integer('is_cover', { mode: 'boolean' }).notNull().default(false), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_photos_gallery_order').on(table.galleryId, table.sortOrder)]);

export const selections = sqliteTable('selections', {
  id: text('id').primaryKey(), galleryId: text('gallery_id').notNull().references(() => galleries.id, { onDelete: 'cascade' }), photoId: text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }), clientToken: text('client_token').notNull(), comment: text('comment'), selectedAt: integer('selected_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_selections_client_photo').on(table.clientToken, table.photoId), index('idx_selections_gallery_client').on(table.galleryId, table.clientToken)]);

export const photoComments = sqliteTable('photo_comments', {
  id: text('id').primaryKey(), galleryId: text('gallery_id').notNull().references(() => galleries.id, { onDelete: 'cascade' }), photoId: text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }), clientToken: text('client_token').notNull(), comment: text('comment').notNull(), updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_photo_comments_client_photo').on(table.clientToken, table.photoId), index('idx_photo_comments_gallery').on(table.galleryId)]);

export const gallerySubmissions = sqliteTable('gallery_submissions', {
  id: text('id').primaryKey(), galleryId: text('gallery_id').notNull().references(() => galleries.id, { onDelete: 'cascade' }), clientToken: text('client_token').notNull(), message: text('message'), completedAt: integer('completed_at', { mode: 'timestamp_ms' }), updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_gallery_submissions_client').on(table.galleryId, table.clientToken)]);

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(), clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }), galleryId: text('gallery_id').references(() => galleries.id, { onDelete: 'set null' }), description: text('description').notNull(), amountCents: integer('amount_cents').notNull(), status: text('status', { enum: ['pending', 'paid', 'production', 'completed', 'cancelled'] }).notNull().default('pending'), dueAt: integer('due_at', { mode: 'timestamp_ms' }), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_orders_owner_status').on(table.ownerId, table.status), index('idx_orders_client').on(table.clientId)]);

export const deliveries = sqliteTable('deliveries', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(), galleryId: text('gallery_id').notNull().references(() => galleries.id, { onDelete: 'cascade' }), status: text('status', { enum: ['preparing', 'uploading', 'ready', 'delivered', 'expired'] }).notNull().default('preparing'), downloadLimit: integer('download_limit'), downloadCount: integer('download_count').notNull().default(0), expiresAt: integer('expires_at', { mode: 'timestamp_ms' }), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('idx_deliveries_owner_status').on(table.ownerId, table.status), uniqueIndex('idx_deliveries_gallery').on(table.galleryId)]);

export const galleryCredentials = sqliteTable('gallery_credentials', {
  id: text('id').primaryKey(), galleryId: text('gallery_id').notNull().references(() => galleries.id, { onDelete: 'cascade' }), login: text('login').notNull(), passwordHash: text('password_hash').notNull(), salt: text('salt').notNull(), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(), updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_gallery_credentials_gallery').on(table.galleryId), uniqueIndex('idx_gallery_credentials_login').on(table.login)]);

export const gallerySessions = sqliteTable('gallery_sessions', {
  id: text('id').primaryKey(), credentialId: text('credential_id').notNull().references(() => galleryCredentials.id, { onDelete: 'cascade' }), tokenHash: text('token_hash').notNull(), expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [uniqueIndex('idx_gallery_sessions_token').on(table.tokenHash), index('idx_gallery_sessions_credential_expiry').on(table.credentialId, table.expiresAt)]);

export const photographers = sqliteTable('photographers', {
 id: text('id').primaryKey(), email: text('email').notNull().unique(), name: text('name').notNull(), passwordHash: text('password_hash').notNull(), salt: text('salt').notNull(), createdAt: integer('created_at', {mode:'timestamp_ms'}).notNull(),
});
export const photographerSessions = sqliteTable('photographer_sessions', {
 id: text('id').primaryKey(), photographerId: text('photographer_id').notNull().references(()=>photographers.id,{onDelete:'cascade'}), tokenHash: text('token_hash').notNull().unique(), expiresAt: integer('expires_at',{mode:'timestamp_ms'}).notNull(), createdAt: integer('created_at',{mode:'timestamp_ms'}).notNull(),
});

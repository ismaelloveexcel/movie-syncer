import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const watchHistory = pgTable("watch_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  url: text("url"),
  platform: text("platform"), // netflix, youtube, vimeo, etc
  watchedAt: timestamp("watched_at").defaultNow(),
  watchedWith: text("watched_with"), // partner name
  rating: text("rating"), // loved, liked, ok
});

export const movieList = pgTable("movie_list", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  url: text("url"),
  platform: text("platform"),
  listType: text("list_type").notNull(), // favorites, towatch
  addedAt: timestamp("added_at").defaultNow(),
  notes: text("notes"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWatchHistorySchema = createInsertSchema(watchHistory).omit({
  id: true,
  watchedAt: true,
});

export const insertMovieListSchema = createInsertSchema(movieList).omit({
  id: true,
  addedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type WatchHistory = typeof watchHistory.$inferSelect;
export type InsertWatchHistory = z.infer<typeof insertWatchHistorySchema>;
export type MovieListItem = typeof movieList.$inferSelect;
export type InsertMovieListItem = z.infer<typeof insertMovieListSchema>;

// Chat conversations for AI assistant
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

import { 
  type User, type InsertUser, 
  type WatchHistory, type InsertWatchHistory,
  type MovieListItem, type InsertMovieListItem,
  users, watchHistory, movieList 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Watch history
  getWatchHistory(): Promise<WatchHistory[]>;
  addWatchHistory(item: InsertWatchHistory): Promise<WatchHistory>;
  
  // Movie lists
  getMovieList(listType: string): Promise<MovieListItem[]>;
  addToMovieList(item: InsertMovieListItem): Promise<MovieListItem>;
  removeFromMovieList(id: string): Promise<void>;
  moveToWatched(id: string, rating?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getWatchHistory(): Promise<WatchHistory[]> {
    return db.select().from(watchHistory).orderBy(desc(watchHistory.watchedAt));
  }

  async addWatchHistory(item: InsertWatchHistory): Promise<WatchHistory> {
    const [entry] = await db.insert(watchHistory).values(item).returning();
    return entry;
  }

  async getMovieList(listType: string): Promise<MovieListItem[]> {
    return db.select().from(movieList).where(eq(movieList.listType, listType)).orderBy(desc(movieList.addedAt));
  }

  async addToMovieList(item: InsertMovieListItem): Promise<MovieListItem> {
    const [entry] = await db.insert(movieList).values(item).returning();
    return entry;
  }

  async removeFromMovieList(id: string): Promise<void> {
    await db.delete(movieList).where(eq(movieList.id, id));
  }

  async moveToWatched(id: string, rating?: string): Promise<void> {
    const [item] = await db.select().from(movieList).where(eq(movieList.id, id));
    if (item) {
      await db.insert(watchHistory).values({
        title: item.title,
        url: item.url,
        platform: item.platform,
        rating: rating,
      });
      await db.delete(movieList).where(eq(movieList.id, id));
    }
  }
}

export const storage = new DatabaseStorage();

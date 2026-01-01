import {
  type User,
  type InsertUser,
  type WatchHistory,
  type InsertWatchHistory,
  type MovieListItem,
  type InsertMovieListItem,
  users,
  watchHistory,
  movieList,
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
  constructor(private readonly database: NonNullable<typeof db>) {}

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.database.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.database.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.database.insert(users).values(insertUser).returning();
    return user;
  }

  async getWatchHistory(): Promise<WatchHistory[]> {
    return this.database.select().from(watchHistory).orderBy(desc(watchHistory.watchedAt));
  }

  async addWatchHistory(item: InsertWatchHistory): Promise<WatchHistory> {
    const [entry] = await this.database.insert(watchHistory).values(item).returning();
    return entry;
  }

  async getMovieList(listType: string): Promise<MovieListItem[]> {
    return this.database
      .select()
      .from(movieList)
      .where(eq(movieList.listType, listType))
      .orderBy(desc(movieList.addedAt));
  }

  async addToMovieList(item: InsertMovieListItem): Promise<MovieListItem> {
    const [entry] = await this.database.insert(movieList).values(item).returning();
    return entry;
  }

  async removeFromMovieList(id: string): Promise<void> {
    await this.database.delete(movieList).where(eq(movieList.id, id));
  }

  async moveToWatched(id: string, rating?: string): Promise<void> {
    const [item] = await this.database.select().from(movieList).where(eq(movieList.id, id));
    if (item) {
      await this.database.insert(watchHistory).values({
        title: item.title,
        url: item.url,
        platform: item.platform,
        rating: rating,
      });
      await this.database.delete(movieList).where(eq(movieList.id, id));
    }
  }
}

class InMemoryStorage implements IStorage {
  private users: User[] = [];
  private watchHistory: WatchHistory[] = [];
  private movieList: MovieListItem[] = [];

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser: User = {
      id: randomUUID(),
      ...insertUser,
    };
    this.users.push(newUser);
    return newUser;
  }

  async getWatchHistory(): Promise<WatchHistory[]> {
    return [...this.watchHistory].sort((a, b) => {
      const aDate = a.watchedAt ? new Date(a.watchedAt).getTime() : 0;
      const bDate = b.watchedAt ? new Date(b.watchedAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  async addWatchHistory(item: InsertWatchHistory): Promise<WatchHistory> {
    const entry: WatchHistory = {
      id: randomUUID(),
      watchedAt: new Date(),
      title: item.title,
      url: item.url ?? null,
      platform: item.platform ?? null,
      watchedWith: item.watchedWith ?? null,
      rating: item.rating ?? null,
    };
    this.watchHistory.push(entry);
    return entry;
  }

  async getMovieList(listType: string): Promise<MovieListItem[]> {
    return this.movieList
      .filter((item) => item.listType === listType)
      .sort((a, b) => {
        const aDate = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const bDate = b.addedAt ? new Date(b.addedAt).getTime() : 0;
        return bDate - aDate;
      });
  }

  async addToMovieList(item: InsertMovieListItem): Promise<MovieListItem> {
    const entry: MovieListItem = {
      id: randomUUID(),
      addedAt: new Date(),
      title: item.title,
      url: item.url ?? null,
      platform: item.platform ?? null,
      listType: item.listType,
      notes: item.notes ?? null,
    };
    this.movieList.unshift(entry);
    return entry;
  }

  async removeFromMovieList(id: string): Promise<void> {
    this.movieList = this.movieList.filter((item) => item.id !== id);
  }

  async moveToWatched(id: string, rating?: string): Promise<void> {
    const index = this.movieList.findIndex((item) => item.id === id);
    if (index !== -1) {
      const [item] = this.movieList.splice(index, 1);
      await this.addWatchHistory({
        title: item.title,
        url: item.url,
        platform: item.platform,
        rating,
      });
    }
  }
}

const selectedStorage: IStorage = db ? new DatabaseStorage(db) : new InMemoryStorage();

if (!db) {
  console.warn(
    "No DATABASE_URL configured. Using in-memory storage for users, watch history, and movie lists (data resets on restart).",
  );
}

export const storage: IStorage = selectedStorage;

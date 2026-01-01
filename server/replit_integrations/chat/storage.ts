import { db } from "../../db";
import { conversations, messages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

type Conversation = typeof conversations.$inferSelect;
type Message = typeof messages.$inferSelect;
const database = db;

export interface IChatStorage {
  getConversation(id: number): Promise<typeof conversations.$inferSelect | undefined>;
  getAllConversations(): Promise<(typeof conversations.$inferSelect)[]>;
  createConversation(title: string): Promise<typeof conversations.$inferSelect>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<(typeof messages.$inferSelect)[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<typeof messages.$inferSelect>;
}

const databaseBackedStorage: IChatStorage | null = database
  ? {
      async getConversation(id: number) {
        const [conversation] = await database
          .select()
          .from(conversations)
          .where(eq(conversations.id, id));
        return conversation;
      },

      async getAllConversations() {
        return database.select().from(conversations).orderBy(desc(conversations.createdAt));
      },

      async createConversation(title: string) {
        const [conversation] = await database.insert(conversations).values({ title }).returning();
        return conversation;
      },

      async deleteConversation(id: number) {
        await database.delete(messages).where(eq(messages.conversationId, id));
        await database.delete(conversations).where(eq(conversations.id, id));
      },

      async getMessagesByConversation(conversationId: number) {
        return database
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversationId))
          .orderBy(messages.createdAt);
      },

      async createMessage(conversationId: number, role: string, content: string) {
        const [message] = await database.insert(messages).values({ conversationId, role, content }).returning();
        return message;
      },
    }
  : null;

const inMemoryStorage: IChatStorage = (() => {
  let conversationIdCounter = 1;
  let messageIdCounter = 1;
  const conversationStore: Conversation[] = [];
  const messageStore: Message[] = [];

  return {
    async getConversation(id: number) {
      return conversationStore.find((conversation) => conversation.id === id);
    },

    async getAllConversations() {
      return [...conversationStore].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async createConversation(title: string) {
      const conversation: Conversation = {
        id: conversationIdCounter++,
        title,
        createdAt: new Date(),
      };
      conversationStore.unshift(conversation);
      return conversation;
    },

    async deleteConversation(id: number) {
      const index = conversationStore.findIndex((conversation) => conversation.id === id);
      if (index !== -1) {
        conversationStore.splice(index, 1);
      }
      for (let i = messageStore.length - 1; i >= 0; i -= 1) {
        if (messageStore[i].conversationId === id) {
          messageStore.splice(i, 1);
        }
      }
    },

    async getMessagesByConversation(conversationId: number) {
      return messageStore
        .filter((message) => message.conversationId === conversationId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },

    async createMessage(conversationId: number, role: string, content: string) {
      const message: Message = {
        id: messageIdCounter++,
        conversationId,
        role,
        content,
        createdAt: new Date(),
      };
      messageStore.push(message);
      return message;
    },
  };
})();

export const chatStorage: IChatStorage = databaseBackedStorage ?? inMemoryStorage;


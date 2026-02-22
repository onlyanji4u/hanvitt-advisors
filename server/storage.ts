import { db } from "./db";
import { lt, sql } from "drizzle-orm";
import {
  contactRequests,
  securityLogs,
  type InsertContactRequest,
  type ContactRequest,
  type SecurityLog,
} from "@shared/schema";

export interface IStorage {
  createContactRequest(request: InsertContactRequest & { ipAddress?: string; userAgent?: string }): Promise<ContactRequest>;
  logSecurityEvent(ipAddress: string, attempt: string): Promise<void>;
  purgeOldRecords(daysOld: number): Promise<{ contactsDeleted: number; logsDeleted: number }>;
}

export class DatabaseStorage implements IStorage {
  async createContactRequest(request: InsertContactRequest & { ipAddress?: string; userAgent?: string }): Promise<ContactRequest> {
    const [newItem] = await db.insert(contactRequests).values(request).returning();
    return newItem;
  }

  async logSecurityEvent(ipAddress: string, attempt: string): Promise<void> {
    try {
      await db.insert(securityLogs).values({
        ipAddress: ipAddress.substring(0, 50),
        attempt: attempt.substring(0, 500),
      });
    } catch {
    }
  }

  async purgeOldRecords(daysOld: number): Promise<{ contactsDeleted: number; logsDeleted: number }> {
    const cutoff = sql`NOW() - INTERVAL '${sql.raw(String(daysOld))} days'`;
    const contactResult = await db.delete(contactRequests).where(lt(contactRequests.createdAt, cutoff)).returning({ id: contactRequests.id });
    const logResult = await db.delete(securityLogs).where(lt(securityLogs.createdAt, cutoff)).returning({ id: securityLogs.id });
    return { contactsDeleted: contactResult.length, logsDeleted: logResult.length };
  }
}

export const storage = new DatabaseStorage();

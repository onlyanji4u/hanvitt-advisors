import { db } from "./db";
import { eq, lt, and, or, desc, sql } from "drizzle-orm";
import {
  contactRequests,
  securityLogs,
  caServices,
  crossSellOffers,
  adminUsers,
  adminOtps,
  auditLogs,
  siteSettings,
  type InsertContactRequest,
  type ContactRequest,
  type SecurityLog,
  type CaService,
  type InsertCaService,
  type CrossSellOffer,
  type InsertCrossSellOffer,
  type AdminUser,
  type AdminOtp,
  type AuditLog,
  type SiteSetting,
} from "@shared/schema";

export interface IStorage {
  createContactRequest(request: InsertContactRequest & { ipAddress?: string; userAgent?: string }): Promise<ContactRequest>;
  logSecurityEvent(ipAddress: string, attempt: string): Promise<void>;
  purgeOldRecords(daysOld: number): Promise<{ contactsDeleted: number; logsDeleted: number }>;

  getCaServices(activeOnly?: boolean): Promise<CaService[]>;
  getCaServiceById(id: string): Promise<CaService | undefined>;
  createCaService(service: InsertCaService): Promise<CaService>;
  updateCaService(id: string, service: Partial<InsertCaService>): Promise<CaService | undefined>;
  deleteCaService(id: string): Promise<boolean>;

  getCrossSellOffers(activeOnly?: boolean): Promise<CrossSellOffer[]>;
  getCrossSellOfferById(id: string): Promise<CrossSellOffer | undefined>;
  createCrossSellOffer(offer: InsertCrossSellOffer): Promise<CrossSellOffer>;
  updateCrossSellOffer(id: string, offer: Partial<InsertCrossSellOffer>): Promise<CrossSellOffer | undefined>;
  deleteCrossSellOffer(id: string): Promise<boolean>;
  deactivateOffersByService(serviceId: string, serviceName: string): Promise<number>;

  getAdminByEmail(email: string): Promise<AdminUser | undefined>;
  getAdminById(id: string): Promise<AdminUser | undefined>;
  createAdminUser(email: string, role?: string): Promise<AdminUser>;
  updateAdminTotp(adminId: string, totpSecret: string | null, totpEnabled: boolean): Promise<void>;

  createOtp(adminId: string, otpHash: string, expiresAt: Date): Promise<AdminOtp>;
  getLatestOtp(adminId: string): Promise<AdminOtp | undefined>;
  markOtpUsed(otpId: string): Promise<void>;

  createAuditLog(adminId: string, action: string, entity: string, entityId?: string): Promise<void>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  getSecurityLogs(limit?: number): Promise<SecurityLog[]>;
  getSecurityStats(): Promise<{ total: number; last24h: number; topIps: { ip: string; count: number }[]; recentTypes: { type: string; count: number }[] }>;

  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<SiteSetting[]>;
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
    } catch {}
  }

  async purgeOldRecords(daysOld: number): Promise<{ contactsDeleted: number; logsDeleted: number }> {
    const cutoff = sql`NOW() - INTERVAL '${sql.raw(String(daysOld))} days'`;
    const contactResult = await db.delete(contactRequests).where(lt(contactRequests.createdAt, cutoff)).returning({ id: contactRequests.id });
    const logResult = await db.delete(securityLogs).where(lt(securityLogs.createdAt, cutoff)).returning({ id: securityLogs.id });
    return { contactsDeleted: contactResult.length, logsDeleted: logResult.length };
  }

  async getCaServices(activeOnly = false): Promise<CaService[]> {
    if (activeOnly) {
      return db.select().from(caServices).where(eq(caServices.isActive, true)).orderBy(caServices.category, caServices.serviceName);
    }
    return db.select().from(caServices).orderBy(caServices.category, caServices.serviceName);
  }

  async getCaServiceById(id: string): Promise<CaService | undefined> {
    const [service] = await db.select().from(caServices).where(eq(caServices.id, id));
    return service;
  }

  async createCaService(service: InsertCaService): Promise<CaService> {
    const [created] = await db.insert(caServices).values(service).returning();
    return created;
  }

  async updateCaService(id: string, service: Partial<InsertCaService>): Promise<CaService | undefined> {
    const [updated] = await db.update(caServices)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(caServices.id, id))
      .returning();
    return updated;
  }

  async deleteCaService(id: string): Promise<boolean> {
    const result = await db.delete(caServices).where(eq(caServices.id, id)).returning({ id: caServices.id });
    return result.length > 0;
  }

  async getCrossSellOffers(activeOnly = false): Promise<CrossSellOffer[]> {
    if (activeOnly) {
      const today = new Date().toISOString().split('T')[0];
      return db.select().from(crossSellOffers).where(
        and(
          eq(crossSellOffers.isActive, true),
          sql`${crossSellOffers.startDate} <= ${today}`,
          sql`${crossSellOffers.endDate} >= ${today}`,
        )
      ).orderBy(crossSellOffers.createdAt);
    }
    return db.select().from(crossSellOffers).orderBy(desc(crossSellOffers.createdAt));
  }

  async getCrossSellOfferById(id: string): Promise<CrossSellOffer | undefined> {
    const [offer] = await db.select().from(crossSellOffers).where(eq(crossSellOffers.id, id));
    return offer;
  }

  async createCrossSellOffer(offer: InsertCrossSellOffer): Promise<CrossSellOffer> {
    const [created] = await db.insert(crossSellOffers).values(offer).returning();
    return created;
  }

  async updateCrossSellOffer(id: string, offer: Partial<InsertCrossSellOffer>): Promise<CrossSellOffer | undefined> {
    const [updated] = await db.update(crossSellOffers)
      .set(offer)
      .where(eq(crossSellOffers.id, id))
      .returning();
    return updated;
  }

  async deleteCrossSellOffer(id: string): Promise<boolean> {
    const result = await db.delete(crossSellOffers).where(eq(crossSellOffers.id, id)).returning({ id: crossSellOffers.id });
    return result.length > 0;
  }

  async deactivateOffersByService(serviceId: string, serviceName: string): Promise<number> {
    const result = await db.update(crossSellOffers)
      .set({ isActive: false })
      .where(
        and(
          eq(crossSellOffers.isActive, true),
          or(
            eq(crossSellOffers.triggerProduct, serviceName),
            eq(crossSellOffers.freeServiceId, serviceId)
          )
        )
      )
      .returning({ id: crossSellOffers.id });
    return result.length;
  }

  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase()));
    return admin;
  }

  async getAdminById(id: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return admin;
  }

  async createAdminUser(email: string, role = "admin"): Promise<AdminUser> {
    const [admin] = await db.insert(adminUsers).values({ email: email.toLowerCase(), role }).returning();
    return admin;
  }

  async updateAdminTotp(adminId: string, totpSecret: string | null, totpEnabled: boolean): Promise<void> {
    await db.update(adminUsers).set({ totpSecret, totpEnabled }).where(eq(adminUsers.id, adminId));
  }

  async createOtp(adminId: string, otpHash: string, expiresAt: Date): Promise<AdminOtp> {
    const [otp] = await db.insert(adminOtps).values({ adminId, otpHash, expiresAt }).returning();
    return otp;
  }

  async getLatestOtp(adminId: string): Promise<AdminOtp | undefined> {
    const [otp] = await db.select().from(adminOtps)
      .where(and(eq(adminOtps.adminId, adminId), eq(adminOtps.isUsed, false)))
      .orderBy(desc(adminOtps.createdAt))
      .limit(1);
    return otp;
  }

  async markOtpUsed(otpId: string): Promise<void> {
    await db.update(adminOtps).set({ isUsed: true }).where(eq(adminOtps.id, otpId));
  }

  async createAuditLog(adminId: string, action: string, entity: string, entityId?: string): Promise<void> {
    await db.insert(auditLogs).values({ adminId, action, entity, entityId: entityId || undefined });
  }

  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit);
  }

  async getSecurityLogs(limit = 100): Promise<SecurityLog[]> {
    return db.select().from(securityLogs).orderBy(desc(securityLogs.createdAt)).limit(limit);
  }

  async getSecurityStats(): Promise<{ total: number; last24h: number; topIps: { ip: string; count: number }[]; recentTypes: { type: string; count: number }[] }> {
    const allLogs = await db.select().from(securityLogs).orderBy(desc(securityLogs.createdAt));
    const total = allLogs.length;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last24h = allLogs.filter(l => l.createdAt && l.createdAt > oneDayAgo).length;

    const ipCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();
    for (const log of allLogs) {
      ipCounts.set(log.ipAddress, (ipCounts.get(log.ipAddress) || 0) + 1);
      const type = log.attempt.includes("SQL") ? "SQL Injection" :
                   log.attempt.includes("XSS") || log.attempt.includes("script") ? "XSS Attack" :
                   log.attempt.includes("header") ? "Email Injection" : "Other";
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    }
    const topIps = [...ipCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([ip, count]) => ({ ip, count }));
    const recentTypes = [...typeCounts.entries()].map(([type, count]) => ({ type, count }));
    return { total, last24h, topIps, recentTypes };
  }

  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db.insert(siteSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  async getAllSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings);
  }
}

export const storage = new DatabaseStorage();

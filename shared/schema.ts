import { pgTable, text, serial, timestamp, boolean, varchar, index, numeric, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const interestTypes = [
  "health_insurance",
  "term_insurance",
  "retirement_planning",
  "child_plan",
  "sme_insurance",
  "general_query",
  "insurance_gap_analysis",
  "ca_tax_advisory",
] as const;

export const contactRequests = pgTable("contact_requests", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  city: varchar("city", { length: 100 }),
  interestType: varchar("interest_type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  consentGiven: boolean("consent_given").notNull(),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_contact_created_at").on(table.createdAt),
  index("idx_contact_interest_type").on(table.interestType),
]);

export const insertContactRequestSchema = createInsertSchema(contactRequests).omit({
  id: true,
  createdAt: true,
  ipAddress: true,
  userAgent: true,
}).extend({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
  email: z.string().email("Please enter a valid email").max(30, "Email must be at most 30 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number").optional().or(z.literal("")),
  city: z.string().max(20, "City must be at most 20 characters").optional().or(z.literal("")),
  interestType: z.enum(interestTypes, { required_error: "Please select what you're interested in" }),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message must be at most 1000 characters"),
  consentGiven: z.literal(true, { errorMap: () => ({ message: "You must agree to be contacted" }) }),
});

export const contactFormSchema = insertContactRequestSchema.extend({
  recaptcha_token: z.string(),
});

export const securityLogs = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  ipAddress: varchar("ip_address", { length: 50 }).notNull(),
  attempt: text("attempt").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_security_logs_created_at").on(table.createdAt),
  index("idx_security_logs_ip").on(table.ipAddress),
]);

export type SecurityLog = typeof securityLogs.$inferSelect;

// ==================== CA & TAX SERVICES ====================

export const caServices = pgTable("ca_services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceName: varchar("service_name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  priceMin: numeric("price_min", { precision: 10, scale: 2 }).notNull(),
  priceMax: numeric("price_max", { precision: 10, scale: 2 }),
  frequency: varchar("frequency", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ca_services_category").on(table.category),
  index("idx_ca_services_active").on(table.isActive),
]);

export const insertCaServiceSchema = createInsertSchema(caServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  serviceName: z.string().min(2).max(200),
  description: z.string().min(5).max(2000),
  category: z.string().min(2).max(100),
  priceMin: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  priceMax: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").optional().or(z.literal("")),
  frequency: z.string().max(50).optional().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
});

export type CaService = typeof caServices.$inferSelect;
export type InsertCaService = z.infer<typeof insertCaServiceSchema>;

// ==================== CROSS-SELL OFFERS ====================

export const offerTypes = ["free_service", "percentage", "flat_discount"] as const;

export const crossSellOffers = pgTable("cross_sell_offers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  triggerProduct: varchar("trigger_product", { length: 100 }).notNull(),
  offerTitle: varchar("offer_title", { length: 200 }).notNull(),
  offerDescription: text("offer_description").notNull(),
  offerType: varchar("offer_type", { length: 50 }).notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }),
  freeServiceId: uuid("free_service_id"),
  isActive: boolean("is_active").default(true).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_cross_sell_trigger").on(table.triggerProduct),
  index("idx_cross_sell_active").on(table.isActive),
]);

export const insertCrossSellOfferSchema = createInsertSchema(crossSellOffers).omit({
  id: true,
  createdAt: true,
}).extend({
  triggerProduct: z.string().min(2).max(100),
  offerTitle: z.string().min(2).max(200),
  offerDescription: z.string().min(5).max(2000),
  offerType: z.enum(offerTypes),
  discountValue: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  freeServiceId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  startDate: z.string(),
  endDate: z.string(),
});

export type CrossSellOffer = typeof crossSellOffers.$inferSelect;
export type InsertCrossSellOffer = z.infer<typeof insertCrossSellOfferSchema>;

// ==================== ADMIN USERS ====================

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 50 }).default("admin").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  totpSecret: varchar("totp_secret", { length: 512 }),
  totpEnabled: boolean("totp_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_admin_email").on(table.email),
]);

export type AdminUser = typeof adminUsers.$inferSelect;

// ==================== ADMIN OTPS ====================

export const adminOtps = pgTable("admin_otps", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: uuid("admin_id").notNull(),
  otpHash: varchar("otp_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_otp_admin").on(table.adminId),
  index("idx_otp_expires").on(table.expiresAt),
]);

export type AdminOtp = typeof adminOtps.$inferSelect;

// ==================== AUDIT LOGS ====================

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: uuid("admin_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: uuid("entity_id"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_audit_admin").on(table.adminId),
  index("idx_audit_timestamp").on(table.timestamp),
]);

export type AuditLog = typeof auditLogs.$inferSelect;

// ==================== SITE SETTINGS ====================

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

// ==================== ADMIN AUTH SCHEMAS ====================

export const requestOtpSchema = z.object({
  email: z.string().email("Invalid email").max(255),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
});

// Calculator Types (Client-side only)
export const savingsCalculatorSchema = z.object({
  initialAmount: z.number().min(0),
  monthlyContribution: z.number().min(0),
  interestRate: z.number().min(0).max(100),
  years: z.number().min(1).max(100),
});

export const gapCalculatorSchema = z.object({
  annualExpenses: z.number().min(0),
  currentAge: z.number().min(18).max(100),
  retirementAge: z.number().min(18).max(100),
});

export const dimeCalculatorSchema = z.object({
  debt: z.number().min(0),
  income: z.number().min(0),
  mortgage: z.number().min(0),
  education: z.number().min(0),
  assets: z.number().min(0),
});

export const retirementCalculatorSchema = z.object({
  currentAge: z.number().min(18).max(80),
  retirementAge: z.number().min(30).max(85),
  lifeExpectancy: z.number().min(60).max(110),
  monthlyExpenses: z.number().min(1000).max(100000000),
  currentSavings: z.number().min(0).max(1000000000000),
  monthlySIP: z.number().min(0).max(100000000),
  expectedReturn: z.number().min(0).max(30),
  inflationRate: z.number().min(0).max(20),
  postRetirementReturn: z.number().min(0).max(20),
}).refine(data => data.retirementAge > data.currentAge, {
  message: "Retirement age must be greater than current age",
  path: ["retirementAge"],
}).refine(data => data.lifeExpectancy > data.retirementAge, {
  message: "Life expectancy must be greater than retirement age",
  path: ["lifeExpectancy"],
});

export const retirementAIInputSchema = z.object({
  calculationResult: z.object({
    requiredCorpus: z.number(),
    projectedCorpus: z.number(),
    shortfall: z.number(),
    monthlyExpensesAtRetirement: z.number(),
    additionalMonthlySIPNeeded: z.number(),
    savingsRate: z.number(),
    yearByYearProjection: z.array(z.object({
      age: z.number(),
      year: z.number(),
      corpus: z.number(),
      annualContribution: z.number(),
      annualReturn: z.number(),
    })),
  }),
  userProfile: z.object({
    riskTolerance: z.enum(["low", "moderate", "high"]),
    incomeRange: z.string().optional(),
    goalPriority: z.string().optional(),
  }),
});

// Shared Types
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;
export type ContactRequest = typeof contactRequests.$inferSelect;
export type RetirementCalculatorInput = z.infer<typeof retirementCalculatorSchema>;
export type RetirementAIInput = z.infer<typeof retirementAIInputSchema>;

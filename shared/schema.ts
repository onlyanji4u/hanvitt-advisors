import { pgTable, text, serial, timestamp, boolean, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const interestTypes = [
  "health_insurance",
  "term_insurance",
  "retirement_planning",
  "child_plan",
  "sme_insurance",
  "general_query",
  "insurance_gap_analysis",
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

// Calculator Types (Client-side only, but useful for validation consistency if needed)
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

// Retirement Calculator Input Schema
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

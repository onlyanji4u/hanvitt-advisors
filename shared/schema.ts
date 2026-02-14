import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Contact Requests Table (Only data that leaves the browser)
export const contactRequests = pgTable("contact_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactRequestSchema = createInsertSchema(contactRequests).omit({ 
  id: true, 
  createdAt: true,
  isRead: true 
}).extend({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  phone: z.string().max(20).optional(),
  message: z.string().min(5).max(2000),
});

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

// Shared Types
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;
export type ContactRequest = typeof contactRequests.$inferSelect;

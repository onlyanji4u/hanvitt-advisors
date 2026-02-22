import { z } from 'zod';
import { insertContactRequestSchema, contactRequests, retirementCalculatorSchema, retirementAIInputSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  contact: {
    create: {
      method: 'POST' as const,
      path: '/api/contact' as const,
      input: insertContactRequestSchema,
      responses: {
        201: z.custom<typeof contactRequests.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  retirement: {
    calculate: {
      method: 'POST' as const,
      path: '/api/retirement/calculate' as const,
      input: retirementCalculatorSchema,
    },
    aiAnalysis: {
      method: 'POST' as const,
      path: '/api/retirement/ai-analysis' as const,
      input: retirementAIInputSchema,
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

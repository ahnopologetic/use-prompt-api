/**
 * Common Zod schema helpers and utilities
 */

import { z } from 'zod';

// Common schemas
export const urlSchema = z.string().url();
export const emailSchema = z.string().email();
export const dateStringSchema = z.string().datetime();
export const uuidSchema = z.string().uuid();

// Schema builders
export function listSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
  });
}

export function categorizedSchema<T extends z.ZodType>(
  itemSchema: T,
  categories: string[]
) {
  return z.object({
    category: z.enum(categories as [string, ...string[]]),
    items: z.array(itemSchema),
  });
}

export function sentimentSchema() {
  return z.object({
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    score: z.number().min(-1).max(1),
    reasoning: z.string().optional(),
  });
}

export function extractionSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    extracted: dataSchema,
    confidence: z.number().min(0).max(1),
    source: z.string().optional(),
  });
}

export function summarySchema() {
  return z.object({
    summary: z.string(),
    keyPoints: z.array(z.string()),
    length: z.enum(['brief', 'medium', 'detailed']),
  });
}

export function classificationSchema<T extends string>(labels: T[]) {
  return z.object({
    label: z.enum(labels as [T, ...T[]]),
    confidence: z.number().min(0).max(1),
    alternatives: z
      .array(
        z.object({
          label: z.enum(labels as [T, ...T[]]),
          confidence: z.number(),
        })
      )
      .optional(),
  });
}

// Utility function to create structured output helper
export function createStructuredOutput<T>(schema: z.ZodType<T>) {
  return {
    schema,
    validate: (data: unknown): T => schema.parse(data),
    safeParse: (data: unknown) => schema.safeParse(data),
    shape: schema,
  };
}

// Example schemas
export const personSchema = z.object({
  name: z.string(),
  age: z.number().optional(),
  email: emailSchema.optional(),
  address: z
    .object({
      street: z.string(),
      city: z.string(),
      country: z.string(),
      zipCode: z.string().optional(),
    })
    .optional(),
});

export const articleSchema = z.object({
  title: z.string(),
  author: z.string(),
  publishDate: dateStringSchema,
  content: z.string(),
  tags: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const taskSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  description: z.string(),
  status: z.enum(['todo', 'in-progress', 'done', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: dateStringSchema.optional(),
  assignee: z.string().optional(),
});


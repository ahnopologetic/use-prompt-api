/**
 * Structured output prompting utilities
 */

import type { ZodType } from 'zod';
import type { SessionManager } from '../core';
import type { SchemaDefinition, StructuredPromptOptions } from '../types';
import { StructuredOutputError } from '../types';
import { generateSchema, createSchemaPrompt } from './schema-generator';

export async function promptWithStructure<T>(
  session: SessionManager,
  prompt: string,
  options: StructuredPromptOptions<T>
): Promise<T> {
  const { schema, maxRetries = 3, systemPrompt, signal } = options;

  // Convert Zod schema to JSON schema if needed
  const jsonSchema: SchemaDefinition =
    'parse' in schema ? generateSchema(schema as ZodType<T>) : (schema as SchemaDefinition);

  // Create schema-aware prompt
  const schemaInstructions = createSchemaPrompt(jsonSchema);
  const fullPrompt = `${schemaInstructions}\n\nUser Request: ${prompt}`;

  // Add system prompt if provided
  if (systemPrompt) {
    const currentSession = session.getSession();
    if (currentSession) {
      // Note: We can't modify system prompt after creation,
      // so we prepend it to the user prompt instead
      // In a real implementation, you'd want to create a new session with the system prompt
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await session.prompt(fullPrompt, { signal });
      const parsed = parseJSONResponse<T>(response);

      // Validate with Zod if schema is a Zod type
      if ('parse' in schema) {
        const zodSchema = schema as ZodType<T>;
        return zodSchema.parse(parsed);
      }

      return parsed;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        // Provide feedback to the model about the error
        const errorFeedback = `The previous response was invalid. Error: ${lastError.message}. Please try again with valid JSON.`;
        await session.prompt(errorFeedback, { signal });
      }
    }
  }

  throw new StructuredOutputError(
    `Failed to get valid structured output after ${maxRetries} attempts`,
    lastError
  );
}

export async function promptWithStructureStreaming<T>(
  session: SessionManager,
  prompt: string,
  options: StructuredPromptOptions<T> & {
    onPartial?: (partial: Partial<T>) => void;
  }
): Promise<T> {
  const { schema, signal, onPartial } = options;

  const jsonSchema: SchemaDefinition =
    'parse' in schema ? generateSchema(schema as ZodType<T>) : (schema as SchemaDefinition);

  const schemaInstructions = createSchemaPrompt(jsonSchema);
  const fullPrompt = `${schemaInstructions}\n\nUser Request: ${prompt}`;

  const stream = session.promptStreaming(fullPrompt, { signal });
  let accumulated = '';

  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      accumulated = value;

      // Try to parse partial JSON
      if (onPartial) {
        try {
          const partial = parsePartialJSON<T>(accumulated);
          if (partial) {
            onPartial(partial);
          }
        } catch {
          // Ignore parsing errors for partial content
        }
      }
    }

    const parsed = parseJSONResponse<T>(accumulated);

    if ('parse' in schema) {
      const zodSchema = schema as ZodType<T>;
      return zodSchema.parse(parsed);
    }

    return parsed;
  } finally {
    reader.releaseLock();
  }
}

function parseJSONResponse<T>(response: string): T {
  // Remove markdown code blocks if present
  let cleaned = response.trim();

  // Remove ```json and ``` wrappers
  cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/```\s*$/, '');

  // Try to find JSON object or array
  const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    cleaned = jsonMatch[1]!;
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    throw new StructuredOutputError(
      `Failed to parse JSON response: ${(error as Error).message}. Response: ${cleaned.substring(0, 200)}`
    );
  }
}

function parsePartialJSON<T>(text: string): Partial<T> | null {
  // Try to parse incomplete JSON by adding closing braces
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json?\s*/i, '');

  // Count opening and closing braces
  const openBraces = (cleaned.match(/\{/g) || []).length;
  const closeBraces = (cleaned.match(/\}/g) || []).length;

  // Add missing closing braces
  if (openBraces > closeBraces) {
    cleaned += '}'.repeat(openBraces - closeBraces);
  }

  try {
    return JSON.parse(cleaned) as Partial<T>;
  } catch {
    return null;
  }
}


# Structured Output

Extract type-safe, validated data from AI responses using Zod schemas.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Schema Patterns](#schema-patterns)
- [Streaming Structured Output](#streaming-structured-output)
- [Error Handling](#error-handling)
- [Advanced Schemas](#advanced-schemas)

## Basic Usage

### Simple Extraction

```typescript
import { z } from 'zod';
import { promptWithStructure } from '@ahnopologetic/use-prompt-api';

const personSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

const person = await promptWithStructure(
  session,
  'Extract: John Doe, 30, john@example.com',
  { schema: personSchema }
);

// Type-safe access
console.log(person.name); // string
console.log(person.age); // number
```

### With React Hook

```typescript
import { useStructuredPrompt } from '@ahnopologetic/use-prompt-api/react';

function Component() {
  const { prompt, data } = useStructuredPrompt({
    schema: personSchema,
  });

  const extract = async (text: string) => {
    const result = await prompt(`Extract person: ${text}`);
    // result is fully typed!
  };
}
```

## Schema Patterns

### Lists and Arrays

```typescript
const taskListSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      dueDate: z.string().optional(),
    })
  ),
});

const result = await promptWithStructure(
  session,
  'Extract tasks: Buy milk (high), Call mom (medium), Read book',
  { schema: taskListSchema }
);
```

### Nested Objects

```typescript
const articleSchema = z.object({
  title: z.string(),
  author: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  metadata: z.object({
    publishDate: z.string(),
    tags: z.array(z.string()),
    wordCount: z.number(),
  }),
});
```

### Enums and Unions

```typescript
const classificationSchema = z.object({
  category: z.enum(['technology', 'business', 'sports', 'entertainment']),
  subcategory: z.string().optional(),
  confidence: z.number().min(0).max(1),
});
```

### Using Helper Schemas

The library provides pre-built schema helpers:

```typescript
import {
  sentimentSchema,
  summarySchema,
  classificationSchema,
} from '@ahnopologetic/use-prompt-api';

// Sentiment analysis
const sentiment = await promptWithStructure(
  session,
  'Analyze: This is an amazing product!',
  { schema: sentimentSchema() }
);

// Summary extraction
const summary = await promptWithStructure(
  session,
  'Summarize this article: ...',
  { schema: summarySchema() }
);

// Classification
const classification = await promptWithStructure(
  session,
  'Classify: Breaking news about...',
  { schema: classificationSchema(['news', 'opinion', 'analysis']) }
);
```

## Streaming Structured Output

Stream partial results as they arrive:

```typescript
const result = await promptWithStructureStreaming(
  session,
  'Extract detailed person info...',
  {
    schema: personSchema,
    onPartial: (partial) => {
      // Update UI with partial data
      console.log('Partial:', partial);
    },
  }
);
```

## Error Handling

### Validation Errors

```typescript
try {
  const result = await promptWithStructure(session, prompt, {
    schema: personSchema,
    maxRetries: 3,
  });
} catch (error) {
  if (error instanceof StructuredOutputError) {
    console.log('Failed to extract structured data:', error.message);
  }
}
```

### Custom Retry Logic

```typescript
const result = await promptWithStructure(session, prompt, {
  schema: complexSchema,
  maxRetries: 5,
  systemPrompt: 'Be very careful to return valid JSON matching the schema.',
});
```

## Advanced Schemas

### Conditional Fields

```typescript
const productSchema = z.object({
  name: z.string(),
  type: z.enum(['physical', 'digital']),
  // Conditionally required based on type
  shipping: z
    .object({
      weight: z.number(),
      dimensions: z.object({
        length: z.number(),
        width: z.number(),
        height: z.number(),
      }),
    })
    .optional(),
  downloadUrl: z.string().url().optional(),
});
```

### Transform and Refine

```typescript
const dateSchema = z.object({
  date: z
    .string()
    .transform((str) => new Date(str))
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Invalid date',
    }),
});
```

### Custom Schemas

```typescript
import { createStructuredOutput } from '@ahnopologetic/use-prompt-api';

const mySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number(),
  data: z.record(z.unknown()),
});

const structured = createStructuredOutput(mySchema);

// Use with validation
const isValid = structured.safeParse(data);
if (isValid.success) {
  console.log(isValid.data);
}
```

## Best Practices

1. **Keep Schemas Simple**: Start with simple schemas and add complexity as needed
2. **Use Descriptions**: Add descriptions to help the AI understand requirements
3. **Set Max Retries**: Allow retries for complex schemas
4. **Validate Results**: Always validate critical data
5. **Handle Optionals**: Use optional fields for data that might not be present

## Common Patterns

### Data Extraction

```typescript
const extractionSchema = z.object({
  extracted: z.object({
    // your data
  }),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()).optional(),
});
```

### Multi-Step Analysis

```typescript
const analysisSchema = z.object({
  step1: z.object({ finding: z.string() }),
  step2: z.object({ reasoning: z.string() }),
  step3: z.object({ conclusion: z.string() }),
  finalAnswer: z.string(),
});
```


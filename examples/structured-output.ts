/**
 * Structured output example
 * Demonstrates extracting structured data using Zod schemas
 */

import { z } from 'zod';
import { PromptClient, promptWithStructure } from '../src';

// Define schemas
const personSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
  occupation: z.string().optional(),
});

const sentimentSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  score: z.number().min(-1).max(1),
  keywords: z.array(z.string()),
});

async function main() {
  console.log('📊 Structured Output Example\n');

  const client = new PromptClient();
  await client.initialize();

  const session = await client.createSession();

  // Example 1: Extract person information
  console.log('Example 1: Person Extraction');
  const personData = await promptWithStructure(
    session,
    'Extract person info: Sarah Johnson, 28 years old, software engineer, sarah.j@example.com',
    { schema: personSchema }
  );
  console.log('Extracted person:', personData);
  console.log('Type-safe access:', personData.name, personData.age, '\n');

  // Example 2: Sentiment analysis
  console.log('Example 2: Sentiment Analysis');
  const sentimentData = await promptWithStructure(
    session,
    'Analyze sentiment: "This product is absolutely amazing! Best purchase ever!"',
    { schema: sentimentSchema }
  );
  console.log('Sentiment:', sentimentData);
  console.log('Score:', sentimentData.score, '\n');

  // Example 3: List extraction
  const taskListSchema = z.object({
    tasks: z.array(
      z.object({
        title: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        completed: z.boolean(),
      })
    ),
  });

  console.log('Example 3: Task List Extraction');
  const tasks = await promptWithStructure(
    session,
    'Extract tasks: Buy groceries (high priority), Call dentist (medium), Read book (low)',
    { schema: taskListSchema }
  );
  console.log('Tasks:', JSON.stringify(tasks, null, 2));

  session.destroy();
  console.log('\n✅ Done!');
}

main().catch(console.error);


/**
 * Basic agent example
 * Demonstrates multi-turn task execution
 */

import { BasicAgent, createFunctionDefinition } from '../src';

// Create some utility functions
const searchFunction = createFunctionDefinition(
  'search',
  'Search for information on a topic',
  {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
    },
    required: ['query'],
  },
  async ({ query }: { query: string }) => {
    // Simulate search results
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      results: [
        `Result 1 for "${query}": Important finding about ${query}`,
        `Result 2 for "${query}": Additional context for ${query}`,
      ],
    };
  }
);

const saveFunction = createFunctionDefinition(
  'saveNote',
  'Save a note or finding',
  {
    type: 'object',
    properties: {
      content: { type: 'string', description: 'Note content' },
      category: { type: 'string', description: 'Note category' },
    },
    required: ['content'],
  },
  async ({ content, category }: { content: string; category?: string }) => {
    console.log(`\n📝 Saved note (${category || 'general'}): ${content}`);
    return { success: true, noteId: Math.random().toString(36).substr(2, 9) };
  }
);

async function main() {
  console.log('🤖 Basic Agent Example\n');

  const agent = new BasicAgent({
    maxIterations: 10,
    functions: [searchFunction, saveFunction],
    systemPrompt:
      'You are a research assistant. Use the search function to find information and save important findings.',
    onStep: (step) => {
      console.log(`\n--- Step ${step.iteration} ---`);
      if (step.thought) console.log('💭 Thinking:', step.thought.substring(0, 100) + '...');
      if (step.action) {
        console.log(`🔧 Action: ${step.action.name}`);
        console.log('   Args:', JSON.stringify(step.action.arguments, null, 2));
      }
      if (step.observation) {
        console.log('👁️  Observation:', step.observation.success ? 'Success' : 'Failed');
      }
    },
  });

  const task =
    'Research TypeScript best practices and save the three most important findings.';

  console.log('📋 Task:', task);
  console.log('\n🚀 Starting agent...\n');

  const result = await agent.run(task);

  console.log('\n\n=== Agent Complete ===');
  console.log('Status:', result.status);
  console.log('Iterations:', result.iterations);
  console.log('\nFinal Answer:');
  console.log(result.finalAnswer);

  console.log('\n✅ Done!');
}

main().catch(console.error);


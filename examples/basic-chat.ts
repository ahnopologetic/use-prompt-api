/**
 * Basic chat example
 * Demonstrates simple conversation with the Prompt API
 */

import { PromptClient } from '../src';

async function main() {
  console.log('🤖 Basic Chat Example\n');

  // Initialize the client
  const client = new PromptClient();
  console.log('Initializing Prompt API...');
  await client.initialize();

  // Create a session
  const session = await client.createSession({
    systemPrompt: 'You are a friendly and helpful AI assistant.',
    temperature: 0.7,
  });

  console.log('Session created!\n');

  // Single prompt
  console.log('User: Hello! What can you help me with?');
  const response1 = await session.prompt('Hello! What can you help me with?');
  console.log('Assistant:', response1, '\n');

  // Follow-up prompt (maintains context)
  console.log('User: What is TypeScript?');
  const response2 = await session.prompt('What is TypeScript?');
  console.log('Assistant:', response2, '\n');

  // Check quota
  const quotaTracker = session.getQuotaTracker();
  const quotaInfo = quotaTracker.getQuotaInfo();
  console.log('Quota used:', `${quotaInfo.percentageUsed.toFixed(1)}%`);

  // Clean up
  session.destroy();
  console.log('\n✅ Session destroyed');
}

main().catch(console.error);


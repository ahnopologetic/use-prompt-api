/**
 * Advanced agent example
 * Demonstrates planning, execution, and reflection
 */

import { AdvancedAgent, createFunctionDefinition } from '../src';

// Create research and analysis functions
const researchFunction = createFunctionDefinition(
  'research',
  'Research a specific topic',
  {
    type: 'object',
    properties: {
      topic: { type: 'string' },
      depth: { type: 'string', enum: ['shallow', 'deep'] },
    },
    required: ['topic'],
  },
  async ({ topic, depth }: { topic: string; depth?: string }) => {
    console.log(`\n🔍 Researching: ${topic} (${depth || 'shallow'})`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      topic,
      findings: [
        `Key insight about ${topic}`,
        `Important trend in ${topic}`,
        `Future direction for ${topic}`,
      ],
    };
  }
);

const analyzeFunction = createFunctionDefinition(
  'analyze',
  'Analyze data or findings',
  {
    type: 'object',
    properties: {
      data: { type: 'string' },
      method: { type: 'string' },
    },
    required: ['data'],
  },
  async ({ data, method }: { data: string; method?: string }) => {
    console.log(`\n📊 Analyzing: ${data} (method: ${method || 'standard'})`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      analysis: `Detailed analysis of ${data}`,
      confidence: 0.85,
    };
  }
);

async function main() {
  console.log('🧠 Advanced Agent with Planning Example\n');

  const agent = new AdvancedAgent({
    maxIterations: 15,
    maxReflections: 2,
    enablePlanning: true,
    functions: [researchFunction, analyzeFunction],
    systemPrompt: 'You are an advanced research assistant capable of planning and reflection.',
    planningPrompt:
      'Create a detailed plan to accomplish the research task. Break it into clear steps.',
    reflectionPrompt:
      'Reflect on your progress. What went well? What could be improved? What should you do next?',
    onStep: (step) => {
      console.log(`\n[Step ${step.iteration}]`);
      if (step.thought) console.log('💭', step.thought.substring(0, 150));
      if (step.action) console.log('⚡', step.action.name);
    },
  });

  const task =
    'Research AI trends in 2024, analyze the findings, and provide a comprehensive summary with predictions.';

  console.log('📋 Complex Task:', task);
  console.log('\n🚀 Starting advanced agent with planning...\n');

  const result = await agent.runWithPlanning(task);

  console.log('\n\n=== Agent Complete ===');
  console.log('Status:', result.status);
  console.log('Total Iterations:', result.iterations);
  console.log('Reflections:', agent.getReflectionCount());

  const plan = agent.getCurrentPlan();
  if (plan) {
    console.log('\nOriginal Plan:');
    plan.steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
  }

  console.log('\n📄 Final Report:');
  console.log(result.finalAnswer);

  console.log('\n✅ Done!');
}

main().catch(console.error);


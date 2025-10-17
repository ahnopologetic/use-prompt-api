/**
 * Function calling example
 * Demonstrates AI using custom functions
 */

import { PromptClient, FunctionRegistry, createFunctionDefinition, BasicAgent } from '../src';

// Define functions
const weatherFunction = createFunctionDefinition(
  'getWeather',
  'Get current weather for a location',
  {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'City name' },
    },
    required: ['location'],
  },
  async ({ location }: { location: string }) => {
    // Simulate API call
    const weather = {
      Paris: { temp: 18, condition: 'Cloudy' },
      Tokyo: { temp: 24, condition: 'Sunny' },
      'New York': { temp: 22, condition: 'Rainy' },
    };
    return weather[location as keyof typeof weather] || { temp: 20, condition: 'Unknown' };
  }
);

const calculatorFunction = createFunctionDefinition(
  'calculate',
  'Perform mathematical calculations',
  {
    type: 'object',
    properties: {
      expression: { type: 'string', description: 'Math expression (e.g., "2 + 2")' },
    },
    required: ['expression'],
  },
  async ({ expression }: { expression: string }) => {
    try {
      // Simple eval (use a proper math parser in production!)
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      // eslint-disable-next-line no-eval
      const result = eval(sanitized);
      return { result, expression };
    } catch (error) {
      return { error: 'Invalid expression' };
    }
  }
);

async function main() {
  console.log('🛠️  Function Calling Example\n');

  // Using BasicAgent for automatic function calling
  const agent = new BasicAgent({
    maxIterations: 5,
    functions: [weatherFunction, calculatorFunction],
    systemPrompt: 'You are a helpful assistant with access to weather and calculator functions.',
    onStep: (step) => {
      console.log(`\nStep ${step.iteration}:`);
      if (step.thought) console.log('  Thought:', step.thought);
      if (step.action) console.log('  Action:', step.action.name, step.action.arguments);
      if (step.observation) {
        console.log('  Result:', step.observation.success ? '✅' : '❌');
      }
    },
  });

  // Example 1: Weather query
  console.log('=== Example 1: Weather Query ===');
  const result1 = await agent.run('What is the weather in Paris?');
  console.log('\nFinal Answer:', result1.finalAnswer);

  // Example 2: Calculation
  console.log('\n\n=== Example 2: Calculation ===');
  const result2 = await agent.run('Calculate 15 * 7 + 23');
  console.log('\nFinal Answer:', result2.finalAnswer);

  // Example 3: Multiple functions
  console.log('\n\n=== Example 3: Multiple Functions ===');
  const result3 = await agent.run(
    'What is the weather in Tokyo and New York, and what is their temperature difference?'
  );
  console.log('\nFinal Answer:', result3.finalAnswer);

  console.log('\n✅ Done!');
}

main().catch(console.error);


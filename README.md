# use-prompt-api

A comprehensive TypeScript library for Chrome's built-in Prompt API with advanced features including structured output, function calling, agentic workflows, and React hooks integration.

## Features

- 🎯 **Type-Safe**: Full TypeScript support with strict typing
- 🔄 **Session Management**: Persistent sessions with localStorage integration
- 📊 **Structured Output**: Zod schema integration for validated responses
- 🛠️ **Function Calling**: OpenAI-style function calling support
- 🤖 **Agentic Workflows**: Multi-turn task execution with planning and reflection
- ⚛️ **React Hooks**: Seamless React integration
- 📡 **Streaming**: Full streaming support with custom renderers
- 💾 **Quota Management**: Smart quota tracking and warnings

## Installation

```bash
npm install @ahnopologetic/use-prompt-api zod
# or
pnpm add @ahnopologetic/use-prompt-api zod
# or
yarn add @ahnopologetic/use-prompt-api zod
```

## Prerequisites

This library requires Chrome 128+ with the Prompt API origin trial enabled. Learn more at [Chrome AI Documentation](https://developer.chrome.com/docs/ai/prompt-api).

## Quick Start

### Basic Usage

```typescript
import { PromptClient } from '@ahnopologetic/use-prompt-api';

// Initialize the client
const client = new PromptClient();
await client.initialize();

// Create a session
const session = await client.createSession({
  systemPrompt: 'You are a helpful assistant',
  temperature: 0.7,
});

// Prompt the model
const response = await session.prompt('What is the capital of France?');
console.log(response);
```

### Streaming Responses

```typescript
const stream = session.promptStreaming('Tell me a story');
const reader = stream.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(value); // Print each chunk as it arrives
}
```

### Structured Output with Zod

```typescript
import { z } from 'zod';
import { promptWithStructure } from '@ahnopologetic/use-prompt-api';

const personSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

const result = await promptWithStructure(
  session,
  'Extract person info: John Doe, 30 years old, john@example.com',
  { schema: personSchema }
);

console.log(result); // { name: 'John Doe', age: 30, email: 'john@example.com' }
```

### Function Calling

```typescript
import { FunctionRegistry, createFunctionDefinition } from '@ahnopologetic/use-prompt-api';

const registry = new FunctionRegistry();

registry.register(
  createFunctionDefinition(
    'getWeather',
    'Get the current weather for a location',
    {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' },
      },
      required: ['location'],
    },
    async ({ location }: { location: string }) => {
      // Your weather API call here
      return { temperature: 72, condition: 'sunny' };
    }
  )
);
```

### Basic Agent

```typescript
import { BasicAgent } from '@ahnopologetic/use-prompt-api';

const agent = new BasicAgent({
  maxIterations: 10,
  functions: [weatherFunction, calculatorFunction],
  systemPrompt: 'You are a helpful assistant',
  onStep: (step) => console.log('Step:', step.iteration),
});

const result = await agent.run('What is the weather in Paris and Tokyo?');
console.log(result.finalAnswer);
```

### Advanced Agent with Planning

```typescript
import { AdvancedAgent } from '@ahnopologetic/use-prompt-api';

const agent = new AdvancedAgent({
  maxIterations: 20,
  functions: [...],
  enablePlanning: true,
  maxReflections: 2,
});

const result = await agent.runWithPlanning('Research and summarize AI trends in 2024');
```

## React Integration

### Basic Hook

```tsx
import { usePromptAPI } from '@ahnopologetic/use-prompt-api/react';

function ChatComponent() {
  const { prompt, ready, loading, error, quota } = usePromptAPI({
    systemPrompt: 'You are a helpful assistant',
  });

  const [response, setResponse] = useState('');

  const handleSubmit = async (message: string) => {
    const result = await prompt(message);
    setResponse(result);
  };

  if (!ready) return <div>Loading AI model...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <QuotaDisplay quota={quota} />
      <ChatInterface onSubmit={handleSubmit} response={response} />
    </div>
  );
}
```

### Structured Output Hook

```tsx
import { useStructuredPrompt } from '@ahnopologetic/use-prompt-api/react';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string(),
});

function TaskExtractor() {
  const { prompt, data, loading } = useStructuredPrompt({
    schema: taskSchema,
  });

  const extractTask = async (text: string) => {
    const task = await prompt(`Extract task from: ${text}`);
    console.log(task); // Fully typed!
  };

  return <TaskForm onExtract={extractTask} loading={loading} />;
}
```

### Function Calling Hook

```tsx
import { useFunctionCalling } from '@ahnopologetic/use-prompt-api/react';

function AssistantComponent() {
  const { prompt, results, loading } = useFunctionCalling({
    functions: [weatherFunction, calculatorFunction],
    autoExecute: true,
  });

  return <Assistant onPrompt={prompt} results={results} />;
}
```

### Agent Hook

```tsx
import { useAgent } from '@ahnopologetic/use-prompt-api/react';

function AgentComponent() {
  const { run, steps, status, progress } = useAgent({
    maxIterations: 10,
    functions: [...],
  });

  return (
    <div>
      <button onClick={() => run('Complete this task...')}>Start</button>
      <Progress value={progress} />
      <StepsList steps={steps} />
    </div>
  );
}
```

## API Reference

### Core Classes

#### `PromptClient`

High-level client for managing sessions.

```typescript
const client = new PromptClient();
await client.initialize();
const session = await client.createSession(options);
```

#### `SessionManager`

Manages individual conversation sessions.

```typescript
const manager = new SessionManager();
await manager.create({ systemPrompt: '...' });
const response = await manager.prompt('Hello');
```

### Structured Output

#### `promptWithStructure<T>`

Get structured output validated against a Zod schema.

```typescript
const result = await promptWithStructure<PersonType>(session, prompt, {
  schema: personSchema,
  maxRetries: 3,
});
```

### Function Calling

#### `FunctionRegistry`

Manage available functions for the AI.

```typescript
const registry = new FunctionRegistry();
registry.register(functionDefinition);
registry.list(); // Get all functions
```

### Agents

#### `BasicAgent`

Simple multi-turn task execution.

```typescript
const agent = new BasicAgent({
  maxIterations: 10,
  functions: [...],
  onStep: (step) => {...},
});
```

#### `AdvancedAgent`

Agent with planning and reflection.

```typescript
const agent = new AdvancedAgent({
  maxIterations: 20,
  enablePlanning: true,
  maxReflections: 2,
});
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [Basic Chat](./examples/basic-chat.ts) - Simple conversational interface
- [Structured Output](./examples/structured-output.ts) - Type-safe data extraction with Zod
- [Function Calling](./examples/function-calling.ts) - Using custom functions with the AI
- [Basic Agent](./examples/basic-agent.ts) - Multi-turn task execution
- [Advanced Agent](./examples/advanced-agent.ts) - Planning and reflection capabilities
- **[Streaming Agent](./examples/streaming-agent.ts) ⭐ NEW** - Real-time streaming with visual tool calls
- [React Chatbot](./examples/react-chatbot/) - Full React integration

### Run Examples

```bash
# TypeScript examples (requires pnpm install)
pnpm example:basic         # Basic chat
pnpm example:functions     # Function calling
pnpm example:agent         # Basic agent
pnpm example:advanced      # Advanced agent
pnpm example:streaming     # Streaming agent ⭐
pnpm example:structured    # Structured output

# Browser examples
# Open examples/streaming-agent.html in Chrome
```

## Documentation

- [Session Management](./docs/session-management.md)
- [Structured Output](./docs/structured-output.md)
- [Function Calling](./docs/function-calling.md)
- [Agentic Workflows](./docs/agents.md)
- [Migration Guide](./docs/migration.md)

## Browser Support

- Chrome 128+ (with Prompt API origin trial enabled)
- Edge 128+ (with origin trial)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

## Acknowledgments

Built for Chrome's built-in Prompt API. Learn more at [Chrome AI Documentation](https://developer.chrome.com/docs/ai/).


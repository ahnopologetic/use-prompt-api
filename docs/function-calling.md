# Function Calling

Enable AI to use custom functions to accomplish tasks.

## Table of Contents

- [Basic Concepts](#basic-concepts)
- [Defining Functions](#defining-functions)
- [Function Registry](#function-registry)
- [Using with Agents](#using-with-agents)
- [React Integration](#react-integration)
- [Best Practices](#best-practices)

## Basic Concepts

Function calling allows the AI to invoke predefined functions to:

- Access external data (APIs, databases)
- Perform calculations
- Execute actions (send emails, create tasks)
- Query real-time information

## Defining Functions

### Basic Function

```typescript
import { createFunctionDefinition } from '@ahnopologetic/use-prompt-api';

const getTimeFunction = createFunctionDefinition(
  'getCurrentTime',
  'Get the current time',
  {
    type: 'object',
    properties: {},
  },
  async () => {
    return new Date().toISOString();
  }
);
```

### Function with Parameters

```typescript
const weatherFunction = createFunctionDefinition(
  'getWeather',
  'Get weather for a location',
  {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name',
      },
      units: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'Temperature units',
      },
    },
    required: ['location'],
  },
  async ({ location, units = 'celsius' }: { location: string; units?: string }) => {
    // Call weather API
    const data = await fetchWeatherAPI(location, units);
    return data;
  }
);
```

### Helper for Parameters

```typescript
import { createParameters } from '@ahnopologetic/use-prompt-api';

const params = createParameters(
  {
    query: { type: 'string', description: 'Search query' },
    limit: { type: 'number', description: 'Max results' },
  },
  ['query'] // required fields
);
```

## Function Registry

### Creating and Managing Registry

```typescript
import { FunctionRegistry } from '@ahnopologetic/use-prompt-api';

const registry = new FunctionRegistry();

// Register functions
registry.register(weatherFunction);
registry.register(calculatorFunction);

// Register multiple
registry.registerMultiple([func1, func2, func3]);

// List available functions
const available = registry.list();

// Check if function exists
if (registry.has('getWeather')) {
  // ...
}

// Remove a function
registry.unregister('oldFunction');
```

### Built-in Functions

```typescript
import { builtInFunctions } from '@ahnopologetic/use-prompt-api';

registry.register(builtInFunctions.getCurrentTime);
registry.register(builtInFunctions.calculateMath);
```

## Using with Agents

### Basic Agent

```typescript
import { BasicAgent } from '@ahnopologetic/use-prompt-api';

const agent = new BasicAgent({
  maxIterations: 10,
  functions: [weatherFunction, timeFunction],
  systemPrompt: 'You are a helpful assistant.',
  onStep: (step) => {
    if (step.action) {
      console.log('Calling:', step.action.name);
    }
  },
});

const result = await agent.run('What time is it in Tokyo and what is the weather?');
```

### Manual Execution

```typescript
import { executeFunctionCall, parseFunctionCall } from '@ahnopologetic/use-prompt-api';

// Get AI response
const response = await session.prompt(promptWithFunctions);

// Parse for function calls
const parsed = parseFunctionCall(response);

if (parsed.functionCall) {
  // Execute the function
  const result = await executeFunctionCall(parsed.functionCall, registry);

  // Send result back to AI
  const followUp = `Function result: ${JSON.stringify(result.result)}`;
  const finalResponse = await session.prompt(followUp);
}
```

## React Integration

### Using the Hook

```typescript
import { useFunctionCalling } from '@ahnopologetic/use-prompt-api/react';

function Assistant() {
  const { prompt, results, loading } = useFunctionCalling({
    functions: [weatherFunction, searchFunction],
    autoExecute: true, // Automatically execute function calls
  });

  const handleQuery = async (query: string) => {
    const response = await prompt(query);
    // Functions are called automatically
    return response;
  };

  return (
    <div>
      <QueryInput onSubmit={handleQuery} />
      <Results data={results} />
    </div>
  );
}
```

## Best Practices

### 1. Clear Descriptions

```typescript
createFunctionDefinition(
  'searchDatabase',
  'Search the customer database for records matching criteria. Returns up to 10 results.',
  {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query. Use natural language or specific field:value pairs.',
      },
      filters: {
        type: 'object',
        description: 'Optional filters to narrow results',
      },
    },
  },
  handler
);
```

### 2. Error Handling

```typescript
const safeFunction = createFunctionDefinition(
  'apiCall',
  'Make an API call',
  params,
  async (args) => {
    try {
      const result = await api.call(args);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestion: 'Try adjusting the parameters',
      };
    }
  }
);
```

### 3. Validation

```typescript
const validatedFunction = createFunctionDefinition(
  'updateRecord',
  'Update a database record',
  params,
  async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
    // Validate inputs
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid ID');
    }

    // Perform operation
    const result = await db.update(id, data);
    return result;
  }
);
```

### 4. Rate Limiting

```typescript
class RateLimitedFunction {
  private lastCall = 0;
  private minInterval = 1000; // 1 second

  createFunction() {
    return createFunctionDefinition('apiCall', 'Call API', params, async (args) => {
      const now = Date.now();
      if (now - this.lastCall < this.minInterval) {
        throw new Error('Rate limit exceeded. Please wait.');
      }

      this.lastCall = now;
      return await this.execute(args);
    });
  }
}
```

## Common Patterns

### Data Fetching

```typescript
const fetchFunction = createFunctionDefinition(
  'fetchData',
  'Fetch data from external source',
  createParameters({ endpoint: { type: 'string' } }),
  async ({ endpoint }: { endpoint: string }) => {
    const response = await fetch(endpoint);
    return response.json();
  }
);
```

### CRUD Operations

```typescript
const createRecordFunction = createFunctionDefinition(
  'createRecord',
  'Create a new record',
  createParameters({ data: { type: 'object' } }),
  async ({ data }) => {
    return await db.create(data);
  }
);

const updateRecordFunction = createFunctionDefinition(
  'updateRecord',
  'Update existing record',
  createParameters({ id: { type: 'string' }, data: { type: 'object' } }),
  async ({ id, data }) => {
    return await db.update(id, data);
  }
);
```

### Chained Functions

```typescript
// The AI can chain multiple function calls
const agent = new BasicAgent({
  functions: [searchFunction, analyzeFunction, saveFunction],
  // AI will: search → analyze results → save findings
});
```


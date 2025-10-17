# Agentic Workflows

Build autonomous AI agents that can plan, execute, and reflect on multi-turn tasks.

## Table of Contents

- [Basic Agent](#basic-agent)
- [Advanced Agent](#advanced-agent)
- [Agent Configuration](#agent-configuration)
- [Stopping Conditions](#stopping-conditions)
- [Error Recovery](#error-recovery)
- [Best Practices](#best-practices)

## Basic Agent

### Simple Task Execution

```typescript
import { BasicAgent } from '@ahnopologetic/use-prompt-api';

const agent = new BasicAgent({
  maxIterations: 10,
  functions: [searchFunction, saveFunction],
  systemPrompt: 'You are a research assistant.',
  onStep: (step) => {
    console.log(`Step ${step.iteration}:`, step.thought);
  },
});

const result = await agent.run('Research TypeScript best practices and save key findings');
```

### Agent Lifecycle

```typescript
const agent = new BasicAgent(config);

// Start task
const result = await agent.run(task);

// Stop early if needed
agent.stop();

// Check status
const status = agent.getStatus(); // 'idle' | 'running' | 'completed' | 'failed' | 'stopped'

// Get execution history
const steps = agent.getSteps();
```

## Advanced Agent

### With Planning

```typescript
import { AdvancedAgent } from '@ahnopologetic/use-prompt-api';

const agent = new AdvancedAgent({
  maxIterations: 20,
  maxReflections: 2,
  enablePlanning: true,
  functions: [...],
  planningPrompt: 'Create a detailed plan with clear steps',
  reflectionPrompt: 'Reflect on progress and identify improvements',
});

const result = await agent.runWithPlanning('Complex multi-step research task');
```

### Planning, Execution, Reflection

```typescript
const agent = new AdvancedAgent(config);

// Run with planning
const result = await agent.runWithPlanning(task);

// Get the plan
const plan = agent.getCurrentPlan();
console.log('Steps:', plan.steps);
console.log('Dependencies:', plan.dependencies);

// Manual reflection
const reflection = await agent.reflect();
console.log('Reflection:', reflection);

// Replan based on reflection
await agent.replan(task);
```

## Agent Configuration

### Basic Configuration

```typescript
const config: AgentConfig = {
  maxIterations: 10,
  functions: [func1, func2],
  systemPrompt: 'You are a helpful assistant',
  onStep: (step) => {
    // Handle each step
  },
  stopCondition: (steps) => {
    // Custom stopping logic
    return steps.length >= 5;
  },
};
```

### Advanced Configuration

```typescript
const config: AdvancedAgentConfig = {
  // Basic config
  maxIterations: 20,
  functions: [...],
  systemPrompt: '...',

  // Planning
  enablePlanning: true,
  planningPrompt: 'Create a comprehensive plan...',

  // Reflection
  maxReflections: 3,
  reflectionPrompt: 'Analyze your progress...',

  // Callbacks
  onStep: (step) => {
    console.log('Step:', step);
  },
};
```

## Stopping Conditions

### Built-in Conditions

```typescript
import { StoppingConditions } from '@ahnopologetic/use-prompt-api';

// Stop after N function calls
const agent = new BasicAgent({
  stopCondition: StoppingConditions.maxFunctionCalls(5),
});

// Stop when keyword detected
const agent2 = new BasicAgent({
  stopCondition: StoppingConditions.keywordDetected(['complete', 'finished']),
});

// Stop if no progress
const agent3 = new BasicAgent({
  stopCondition: StoppingConditions.noProgressAfter(3),
});

// Stop when answer provided
const agent4 = new BasicAgent({
  stopCondition: StoppingConditions.answerProvided(),
});
```

### Custom Stopping Condition

```typescript
const customStop = (steps: AgentStep[]): boolean => {
  // Stop if we found a high-confidence result
  const lastStep = steps[steps.length - 1];
  if (lastStep?.observation?.result?.confidence > 0.95) {
    return true;
  }
  return false;
};

const agent = new BasicAgent({
  stopCondition: customStop,
});
```

## Error Recovery

### Retry Strategy

```typescript
import { createRetryStrategy } from '@ahnopologetic/use-prompt-api';

const retryStrategy = createRetryStrategy(3);

const agent = new BasicAgent({
  onStep: (step) => {
    const feedback = retryStrategy(step);
    if (feedback) {
      console.log('Recovery:', feedback);
    }
  },
});
```

### Graceful Degradation

```typescript
const agent = new BasicAgent({
  functions: [primaryFunction, fallbackFunction],
  onStep: (step) => {
    if (step.observation?.success === false) {
      // Try fallback approach
      console.log('Primary failed, trying fallback...');
    }
  },
});
```

## React Integration

### Basic Agent Hook

```typescript
import { useAgent } from '@ahnopologetic/use-prompt-api/react';

function AgentComponent() {
  const { run, stop, status, steps, progress } = useAgent({
    maxIterations: 10,
    functions: [...],
  });

  return (
    <div>
      <button onClick={() => run('Do the task')}>Start</button>
      <button onClick={stop}>Stop</button>
      <Progress value={progress} />
      <Steps items={steps} />
      <Status status={status} />
    </div>
  );
}
```

### Advanced Agent Hook

```typescript
import { useAdvancedAgent } from '@ahnopologetic/use-prompt-api/react';

function AdvancedAgentComponent() {
  const { runWithPlanning, reflect, replan, reflectionCount } = useAdvancedAgent({
    maxIterations: 20,
    enablePlanning: true,
    maxReflections: 2,
  });

  const handleTask = async (task: string) => {
    const result = await runWithPlanning(task);
    console.log('Reflections made:', reflectionCount);
  };

  return <TaskInterface onSubmit={handleTask} />;
}
```

## Best Practices

### 1. Set Appropriate Iteration Limits

```typescript
// Simple tasks
const quickAgent = new BasicAgent({
  maxIterations: 5,
});

// Complex research
const researchAgent = new AdvancedAgent({
  maxIterations: 30,
});
```

### 2. Provide Clear System Prompts

```typescript
const agent = new BasicAgent({
  systemPrompt: `You are a research assistant with these goals:
  1. Search for relevant information
  2. Analyze and summarize findings
  3. Save important insights
  
  Always explain your reasoning before taking action.`,
});
```

### 3. Monitor Progress

```typescript
const agent = new BasicAgent({
  onStep: (step) => {
    // Log to analytics
    analytics.track('agent_step', {
      iteration: step.iteration,
      hasAction: !!step.action,
      success: step.observation?.success,
    });

    // Update UI
    updateProgressBar(step.iteration / maxIterations);
  },
});
```

### 4. Handle Long-Running Tasks

```typescript
// Use timeouts
const timeout = setTimeout(() => agent.stop(), 60000); // 1 minute

const result = await agent.run(task);
clearTimeout(timeout);

// Or use AbortController
const controller = new AbortController();
setTimeout(() => controller.abort(), 60000);
```

## Common Patterns

### Research Agent

```typescript
const researchAgent = new AdvancedAgent({
  functions: [searchFunction, analyzeFunction, saveFunction],
  enablePlanning: true,
  systemPrompt: 'Research topics thoroughly and provide citations',
});
```

### Data Processing Agent

```typescript
const dataAgent = new BasicAgent({
  functions: [fetchDataFunction, transformFunction, validateFunction, saveFunction],
  stopCondition: StoppingConditions.answerProvided(),
});
```

### Multi-Step Workflow

```typescript
const workflowAgent = new AdvancedAgent({
  functions: [step1Func, step2Func, step3Func],
  enablePlanning: true,
  planningPrompt: 'Break this into sequential steps with dependencies',
});
```


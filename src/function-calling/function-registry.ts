/**
 * Function registry for managing available functions
 */

import type { FunctionDefinition, FunctionParameter } from '../types';
import { FunctionCallError } from '../types';

export class FunctionRegistry {
  private functions: Map<string, FunctionDefinition> = new Map();

  register(definition: FunctionDefinition): void {
    if (this.functions.has(definition.name)) {
      console.warn(`Function ${definition.name} already registered, overwriting`);
    }

    this.functions.set(definition.name, definition);
  }

  registerMultiple(definitions: FunctionDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  unregister(name: string): void {
    this.functions.delete(name);
  }

  get(name: string): FunctionDefinition | undefined {
    return this.functions.get(name);
  }

  has(name: string): boolean {
    return this.functions.has(name);
  }

  list(): FunctionDefinition[] {
    return Array.from(this.functions.values());
  }

  listNames(): string[] {
    return Array.from(this.functions.keys());
  }

  clear(): void {
    this.functions.clear();
  }

  toJSON(): Array<{
    name: string;
    description: string;
    parameters: FunctionParameter;
  }> {
    return this.list().map(({ name, description, parameters }) => ({
      name,
      description,
      parameters,
    }));
  }
}

// Helper function to create function definitions from TypeScript functions
export function createFunctionDefinition(
  name: string,
  description: string,
  parameters: FunctionParameter,
  handler: (...args: unknown[]) => Promise<unknown> | unknown
): FunctionDefinition {
  return {
    name,
    description,
    parameters,
    handler,
  };
}

// Helper to create parameter schema
export function createParameters(
  properties: Record<string, Omit<FunctionParameter, 'type'> & { type: string }>,
  required: string[] = []
): FunctionParameter {
  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : Object.keys(properties),
  };
}

// Example function definitions
export const builtInFunctions = {
  getCurrentTime: createFunctionDefinition(
    'getCurrentTime',
    'Get the current time in ISO format',
    {
      type: 'object',
      properties: {},
    },
    () => new Date().toISOString()
  ),

  calculateMath: createFunctionDefinition(
    'calculateMath',
    'Perform mathematical calculations',
    createParameters({
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5")',
      },
    }),
    async (...args: unknown[]) => {
      const { expression } = args[0] as { expression: string };
      try {
        // Note: In production, use a safe math parser library
        // This is simplified for demonstration
        const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
        // eslint-disable-next-line no-eval
        const result = eval(sanitized);
        return { result };
      } catch (error) {
        throw new FunctionCallError('Invalid mathematical expression', error);
      }
    }
  ),
};


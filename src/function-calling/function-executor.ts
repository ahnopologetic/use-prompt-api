/**
 * Function execution utilities
 */

import type { FunctionCall, ToolResult } from '../types';
import { FunctionRegistry } from './function-registry';

export async function executeFunctionCall(
  call: FunctionCall,
  registry: FunctionRegistry
): Promise<ToolResult> {
  const { name, arguments: args } = call;

  const definition = registry.get(name);

  if (!definition) {
    return {
      success: false,
      error: `Function "${name}" not found in registry`,
    };
  }

  try {
    // Validate arguments against schema
    const validationError = validateArguments(args, definition.parameters);
    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    // Execute the function
    const result = await definition.handler(args);

    return {
      success: true,
      result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function validateArguments(
  args: Record<string, unknown>,
  parameters: { type: string; properties?: Record<string, unknown>; required?: string[] }
): string | null {
  if (parameters.type !== 'object') {
    return 'Parameters must be an object';
  }

  const { properties, required = [] } = parameters;

  if (!properties) {
    return null;
  }

  // Check required fields
  for (const field of required) {
    if (!(field in args)) {
      return `Missing required parameter: ${field}`;
    }
  }

  // Basic type validation (can be expanded)
  for (const key of Object.keys(args)) {
    if (!(key in properties)) {
      console.warn(`Unexpected parameter: ${key}`);
    }
  }

  return null;
}

export async function executeFunctionCalls(
  calls: FunctionCall[],
  registry: FunctionRegistry
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const call of calls) {
    const result = await executeFunctionCall(call, registry);
    results.push(result);
  }

  return results;
}

export function formatToolResult(result: ToolResult): string {
  if (result.success) {
    return JSON.stringify(result.result, null, 2);
  }

  return `Error: ${result.error}`;
}

export function formatToolResults(results: ToolResult[], calls: FunctionCall[]): string {
  return results
    .map((result, index) => {
      const call = calls[index];
      return `Function: ${call?.name}\nResult: ${formatToolResult(result)}`;
    })
    .join('\n\n');
}


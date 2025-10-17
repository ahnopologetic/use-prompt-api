/**
 * Prompt building utilities for function calling
 */

import { FunctionRegistry } from './function-registry';

export function buildFunctionSystemPrompt(registry: FunctionRegistry): string {
  const functions = registry.toJSON();

  if (functions.length === 0) {
    return '';
  }

  const functionsJson = JSON.stringify(functions, null, 2);

  return `You are a helpful assistant with access to the following functions:

${functionsJson}

When you need to use a function, respond with a JSON object in this exact format:
{
  "functionCall": {
    "name": "function_name",
    "arguments": {
      "param1": "value1",
      "param2": "value2"
    }
  },
  "reasoning": "Why you're calling this function"
}

If you don't need to call a function, respond normally without the functionCall object.

Rules:
- Only use functions that are listed above
- Ensure all required parameters are provided
- Use the exact function and parameter names as specified
- If a function call fails, you'll receive an error message and can try again`;
}

export function buildFewShotExamples(): string {
  return `Example 1:
User: What time is it?
Assistant: {
  "functionCall": {
    "name": "getCurrentTime",
    "arguments": {}
  },
  "reasoning": "User wants to know the current time"
}

Example 2:
User: Calculate 15 * 7
Assistant: {
  "functionCall": {
    "name": "calculateMath",
    "arguments": {
      "expression": "15 * 7"
    }
  },
  "reasoning": "User wants to perform a calculation"
}

Example 3:
User: Hello, how are you?
Assistant: Hello! I'm doing well, thank you for asking. How can I help you today?
`;
}

export function parseFunctionCall(response: string): {
  functionCall?: { name: string; arguments: Record<string, unknown> };
  reasoning?: string;
  regularResponse?: string;
} {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { regularResponse: response };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.functionCall) {
      return {
        functionCall: parsed.functionCall,
        reasoning: parsed.reasoning,
      };
    }

    return { regularResponse: response };
  } catch {
    return { regularResponse: response };
  }
}

export function formatFunctionResult(
  functionName: string,
  result: unknown,
  success: boolean
): string {
  if (success) {
    return `Function "${functionName}" executed successfully. Result: ${JSON.stringify(result, null, 2)}`;
  }

  return `Function "${functionName}" failed with error: ${result}`;
}

export function createFunctionCallingPrompt(
  userMessage: string,
  registry: FunctionRegistry,
  includeFewShot = false
): string {
  const systemPrompt = buildFunctionSystemPrompt(registry);
  const fewShot = includeFewShot ? `\n\n${buildFewShotExamples()}` : '';

  return `${systemPrompt}${fewShot}

User: ${userMessage}`;
}


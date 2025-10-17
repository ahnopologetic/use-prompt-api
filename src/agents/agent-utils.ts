/**
 * Utility functions for agents
 */

import type { AgentConfig, AgentStep, AdvancedAgentConfig } from '../types';
import { BasicAgent } from './basic-agent';
import { AdvancedAgent } from './advanced-agent';

export function createAgent(config: AgentConfig): BasicAgent {
  return new BasicAgent(config);
}

export function createAdvancedAgent(config: AdvancedAgentConfig): AdvancedAgent {
  return new AdvancedAgent(config);
}

export function isTaskComplete(steps: AgentStep[]): boolean {
  if (steps.length === 0) return false;

  const lastStep = steps[steps.length - 1];
  
  // Check if last step has a thought without an action
  if (lastStep?.thought && !lastStep.action) {
    return true;
  }

  // Check if last action was successful
  if (lastStep?.observation?.success) {
    return true;
  }

  return false;
}

export function formatAgentHistory(steps: AgentStep[]): string {
  return steps
    .map((step) => {
      let output = `=== Step ${step.iteration} ===\n`;
      
      if (step.thought) {
        output += `Thought: ${step.thought}\n`;
      }
      
      if (step.action) {
        output += `Action: ${step.action.name}\n`;
        output += `Arguments: ${JSON.stringify(step.action.arguments, null, 2)}\n`;
      }
      
      if (step.observation) {
        output += `Observation: ${step.observation.success ? 'Success' : 'Failed'}\n`;
        if (step.observation.result) {
          output += `Result: ${JSON.stringify(step.observation.result, null, 2)}\n`;
        }
        if (step.observation.error) {
          output += `Error: ${step.observation.error}\n`;
        }
      }
      
      return output;
    })
    .join('\n');
}

export function extractFinalAnswer(steps: AgentStep[]): string | undefined {
  // Look for the last step with a thought and no action
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    if (step?.thought && !step.action) {
      return step.thought;
    }
  }

  return undefined;
}

export function countFunctionCalls(steps: AgentStep[]): number {
  return steps.filter((step) => step.action !== undefined).length;
}

export function getSuccessfulSteps(steps: AgentStep[]): AgentStep[] {
  return steps.filter((step) => step.observation?.success !== false);
}

export function getFailedSteps(steps: AgentStep[]): AgentStep[] {
  return steps.filter((step) => step.observation?.success === false);
}

export function hasErrors(steps: AgentStep[]): boolean {
  return steps.some((step) => step.observation?.success === false);
}

// Predefined stopping conditions
export const StoppingConditions = {
  maxFunctionCalls: (max: number) => (steps: AgentStep[]) => {
    return countFunctionCalls(steps) >= max;
  },

  keywordDetected: (keywords: string[]) => (steps: AgentStep[]) => {
    const lastStep = steps[steps.length - 1];
    if (!lastStep?.thought) return false;

    const thought = lastStep.thought.toLowerCase();
    return keywords.some((keyword) => thought.includes(keyword.toLowerCase()));
  },

  noProgressAfter: (iterations: number) => (steps: AgentStep[]) => {
    if (steps.length < iterations) return false;

    const recentSteps = steps.slice(-iterations);
    const allFailed = recentSteps.every((step) => step.observation?.success === false);

    return allFailed;
  },

  answerProvided: () => (steps: AgentStep[]) => {
    return isTaskComplete(steps);
  },
};

// Error recovery strategies
export function createRetryStrategy(maxRetries = 3) {
  let retries = 0;

  return (step: AgentStep): string | null => {
    if (step.observation?.success === false && retries < maxRetries) {
      retries++;
      return `The previous action failed. Error: ${step.observation.error}. Please try a different approach (attempt ${retries}/${maxRetries}).`;
    }

    if (retries >= maxRetries) {
      return 'Max retries reached. Please provide your best answer based on the information available.';
    }

    retries = 0; // Reset on success
    return null;
  };
}


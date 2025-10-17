/**
 * Basic agent for multi-turn task execution
 */

import type { AgentConfig, AgentResult, AgentStep, TaskStatus } from '../types';
import { SessionManager } from '../core';
import { FunctionRegistry } from '../function-calling/function-registry';
import { executeFunctionCall } from '../function-calling/function-executor';
import {
  buildFunctionSystemPrompt,
  parseFunctionCall,
  formatFunctionResult,
} from '../function-calling/function-prompt-builder';

export class BasicAgent {
  protected session: SessionManager | null = null;
  protected registry: FunctionRegistry;
  protected status: TaskStatus = 'idle';
  protected steps: AgentStep[] = [];
  protected shouldStop = false;

  constructor(protected config: AgentConfig) {
    this.registry = new FunctionRegistry();
    if (config.functions) {
      this.registry.registerMultiple(config.functions);
    }
  }

  async run(task: string): Promise<AgentResult> {
    this.status = 'running';
    this.steps = [];
    this.shouldStop = false;

    try {
      // Create session with system prompt
      this.session = new SessionManager();
      const systemPrompt = this.buildSystemPrompt();

      await this.session.create({
        systemPrompt,
        enablePersistence: false,
      });

      // Initial task prompt
      let currentPrompt = task;
      let iteration = 0;

      while (iteration < this.config.maxIterations && !this.shouldStop) {
        iteration++;

        const step: AgentStep = {
          iteration,
          timestamp: Date.now(),
        };

        // Get model response
        const response = await this.session.prompt(currentPrompt);
        
        // Parse for function calls
        const parsed = parseFunctionCall(response);

        if (parsed.functionCall) {
          // Function call detected
          step.thought = parsed.reasoning;
          step.action = parsed.functionCall;

          // Execute function
          const result = await executeFunctionCall(parsed.functionCall, this.registry);
          step.observation = result;

          // Prepare next prompt with function result
          const formattedResult = formatFunctionResult(
            parsed.functionCall.name,
            result.result || result.error,
            result.success
          );

          currentPrompt = `${formattedResult}\n\nContinue with the task. If the task is complete, respond with your final answer without calling any functions.`;
        } else {
          // No function call - regular response
          step.thought = parsed.regularResponse;

          // Check if task is complete
          if (
            this.config.stopCondition
              ? this.config.stopCondition(this.steps)
              : this.isTaskComplete(parsed.regularResponse || '')
          ) {
            this.steps.push(step);
            this.status = 'completed';

            if (this.config.onStep) {
              this.config.onStep(step);
            }

            return {
              status: 'completed',
              steps: this.steps,
              finalAnswer: parsed.regularResponse,
              iterations: iteration,
            };
          }

          // Task not complete, continue
          currentPrompt = 'Continue with the task.';
        }

        this.steps.push(step);

        if (this.config.onStep) {
          this.config.onStep(step);
        }
      }

      // Max iterations reached
      this.status = this.shouldStop ? 'stopped' : 'completed';

      return {
        status: this.status,
        steps: this.steps,
        finalAnswer: this.steps[this.steps.length - 1]?.thought,
        iterations: iteration,
      };
    } catch (error) {
      this.status = 'failed';
      return {
        status: 'failed',
        steps: this.steps,
        error: error as Error,
        iterations: this.steps.length,
      };
    } finally {
      if (this.session) {
        this.session.destroy();
        this.session = null;
      }
    }
  }

  stop(): void {
    this.shouldStop = true;
  }

  getStatus(): TaskStatus {
    return this.status;
  }

  getSteps(): AgentStep[] {
    return this.steps;
  }

  protected buildSystemPrompt(): string {
    const functionPrompt = buildFunctionSystemPrompt(this.registry);
    const basePrompt =
      this.config.systemPrompt ||
      'You are a helpful AI assistant. Complete the given task step by step.';

    if (functionPrompt) {
      return `${basePrompt}\n\n${functionPrompt}`;
    }

    return basePrompt;
  }

  protected isTaskComplete(response: string): boolean {
    // Simple heuristic: check for completion indicators
    const completionIndicators = [
      'task is complete',
      'task complete',
      'finished',
      'done',
      'completed',
      'final answer',
    ];

    const lowerResponse = response.toLowerCase();
    return completionIndicators.some((indicator) => lowerResponse.includes(indicator));
  }
}


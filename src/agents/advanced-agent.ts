/**
 * Advanced agent with planning and reflection capabilities
 */

import type { AdvancedAgentConfig, AgentResult, AgentPlan } from '../types';
import { BasicAgent } from './basic-agent';

export class AdvancedAgent extends BasicAgent {
  private currentPlan: AgentPlan | null = null;
  private reflectionCount = 0;

  constructor(protected override config: AdvancedAgentConfig) {
    super(config);
  }

  async runWithPlanning(task: string): Promise<AgentResult> {
    if (!this.config.enablePlanning) {
      return this.run(task);
    }

    this.status = 'running';
    this.steps = [];
    this.shouldStop = false;

    try {
      // Create session
      this.session = await this.createPlanningSession();

      // Phase 1: Planning
      this.currentPlan = await this.createPlan(task);

      // Phase 2: Execution with reflection
      const result = await this.executeWithReflection(task);

      return result;
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

  async reflect(): Promise<string> {
    if (!this.session || this.steps.length === 0) {
      return 'No steps to reflect on';
    }

    const reflectionPrompt =
      this.config.reflectionPrompt ||
      `Review the steps taken so far and provide:
1. What has been accomplished
2. What challenges were encountered
3. What should be done differently
4. Next recommended actions

Steps taken:
${this.formatStepsForReflection()}`;

    const reflection = await this.session.prompt(reflectionPrompt);
    this.reflectionCount++;

    return reflection;
  }

  async replan(task: string): Promise<AgentPlan> {
    if (!this.session) {
      throw new Error('No active session for replanning');
    }

    const replanPrompt = `Based on the reflection and current progress, create a new plan to complete the task: "${task}"

Current progress:
${this.formatStepsForReflection()}

Create a revised step-by-step plan.`;

    const planResponse = await this.session.prompt(replanPrompt);
    this.currentPlan = this.parsePlan(planResponse);

    return this.currentPlan;
  }

  private async createPlanningSession() {
    const manager = new (await import('../core')).SessionManager();
    const systemPrompt = this.buildPlanningSystemPrompt();

    await manager.create({
      systemPrompt,
      enablePersistence: false,
    });

    return manager;
  }

  private async createPlan(task: string): Promise<AgentPlan> {
    if (!this.session) {
      throw new Error('No active session');
    }

    const planningPrompt =
      this.config.planningPrompt ||
      `Create a detailed step-by-step plan to accomplish this task: "${task}"

Break it down into clear, actionable steps. For each step, specify:
1. What needs to be done
2. What resources or functions might be needed
3. Dependencies on other steps`;

    const planResponse = await this.session.prompt(planningPrompt);
    return this.parsePlan(planResponse);
  }

  private async executeWithReflection(task: string): Promise<AgentResult> {
    const maxReflections = this.config.maxReflections || 2;

    let result = await this.run(task);

    // Reflect and adjust if not successful
    while (
      result.status !== 'completed' &&
      this.reflectionCount < maxReflections &&
      !this.shouldStop
    ) {
      const reflection = await this.reflect();

      // Create a continuation prompt based on reflection
      const continuationPrompt = `Previous attempt was not fully successful. 

Reflection:
${reflection}

Please continue with the task: "${task}"`;

      // Continue execution
      result = await this.run(continuationPrompt);
    }

    return result;
  }

  private buildPlanningSystemPrompt(): string {
    const basePrompt = super.buildSystemPrompt();
    const planningAddition = `

You are also capable of:
- Creating detailed plans before execution
- Reflecting on your progress
- Adjusting your approach based on feedback
- Breaking complex tasks into manageable steps`;

    return basePrompt + planningAddition;
  }

  private parsePlan(planText: string): AgentPlan {
    // Simple plan parsing - extract numbered steps
    const stepRegex = /(\d+)\.\s*([^\n]+)/g;
    const steps: string[] = [];
    let match;

    while ((match = stepRegex.exec(planText)) !== null) {
      steps.push(match[2]!.trim());
    }

    // Build simple sequential dependencies
    const dependencies: Record<number, number[]> = {};
    for (let i = 1; i < steps.length; i++) {
      dependencies[i] = [i - 1];
    }

    return { steps, dependencies };
  }

  private formatStepsForReflection(): string {
    return this.steps
      .map((step) => {
        let formatted = `Step ${step.iteration}:`;
        if (step.thought) formatted += `\n  Thought: ${step.thought}`;
        if (step.action) formatted += `\n  Action: ${step.action.name}`;
        if (step.observation) {
          formatted += `\n  Result: ${step.observation.success ? 'Success' : 'Failed'}`;
        }
        return formatted;
      })
      .join('\n\n');
  }

  getCurrentPlan(): AgentPlan | null {
    return this.currentPlan;
  }

  getReflectionCount(): number {
    return this.reflectionCount;
  }
}


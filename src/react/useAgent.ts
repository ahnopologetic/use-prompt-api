/**
 * React hooks for agent execution
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AgentConfig, AgentResult, AgentStep, TaskStatus, AdvancedAgentConfig } from '../types';
import { BasicAgent } from '../agents/basic-agent';
import { AdvancedAgent } from '../agents/advanced-agent';

export interface UseAgentReturn {
  run: (task: string) => Promise<AgentResult>;
  stop: () => void;
  status: TaskStatus;
  steps: AgentStep[];
  result: AgentResult | null;
  loading: boolean;
  error: Error | null;
  progress: number;
}

export function useAgent(config: AgentConfig): UseAgentReturn {
  const [status, setStatus] = useState<TaskStatus>('idle');
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const agentRef = useRef<BasicAgent | null>(null);

  // Create agent with config
  useEffect(() => {
    agentRef.current = new BasicAgent({
      ...config,
      onStep: (step) => {
        setSteps((prev) => [...prev, step]);
        if (config.onStep) {
          config.onStep(step);
        }
      },
    });

    return () => {
      agentRef.current = null;
    };
  }, [config]);

  const run = useCallback(async (task: string): Promise<AgentResult> => {
    if (!agentRef.current) {
      throw new Error('Agent not initialized');
    }

    setLoading(true);
    setError(null);
    setSteps([]);
    setResult(null);

    try {
      const agentResult = await agentRef.current.run(task);
      setResult(agentResult);
      setStatus(agentResult.status);
      return agentResult;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setStatus('failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (agentRef.current) {
      agentRef.current.stop();
      setStatus('stopped');
    }
  }, []);

  const progress = result
    ? Math.min((result.iterations / config.maxIterations) * 100, 100)
    : steps.length > 0
    ? Math.min((steps.length / config.maxIterations) * 100, 100)
    : 0;

  return {
    run,
    stop,
    status,
    steps,
    result,
    loading,
    error,
    progress,
  };
}

export interface UseAdvancedAgentReturn extends UseAgentReturn {
  runWithPlanning: (task: string) => Promise<AgentResult>;
  reflect: () => Promise<string>;
  replan: (task: string) => Promise<void>;
  reflectionCount: number;
}

export function useAdvancedAgent(config: AdvancedAgentConfig): UseAdvancedAgentReturn {
  const basicReturn = useAgent(config);
  const [reflectionCount, setReflectionCount] = useState(0);

  const advancedAgentRef = useRef<AdvancedAgent | null>(null);

  useEffect(() => {
    advancedAgentRef.current = new AdvancedAgent({
      ...config,
      onStep: (step) => {
        basicReturn.steps.push(step);
        if (config.onStep) {
          config.onStep(step);
        }
      },
    });

    return () => {
      advancedAgentRef.current = null;
    };
  }, [config]);

  const runWithPlanning = useCallback(async (task: string): Promise<AgentResult> => {
    if (!advancedAgentRef.current) {
      throw new Error('Advanced agent not initialized');
    }

    try {
      const result = await advancedAgentRef.current.runWithPlanning(task);
      setReflectionCount(advancedAgentRef.current.getReflectionCount());
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  const reflect = useCallback(async (): Promise<string> => {
    if (!advancedAgentRef.current) {
      throw new Error('Advanced agent not initialized');
    }

    const reflection = await advancedAgentRef.current.reflect();
    setReflectionCount(advancedAgentRef.current.getReflectionCount());
    return reflection;
  }, []);

  const replan = useCallback(async (task: string): Promise<void> => {
    if (!advancedAgentRef.current) {
      throw new Error('Advanced agent not initialized');
    }

    await advancedAgentRef.current.replan(task);
  }, []);

  return {
    ...basicReturn,
    runWithPlanning,
    reflect,
    replan,
    reflectionCount,
  };
}


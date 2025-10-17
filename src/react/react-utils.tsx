/**
 * React utilities and context providers
 */

import React, { createContext, useContext, ReactNode } from 'react';
import type { SessionOptions } from '../types';
import { usePromptAPI, type UsePromptAPIReturn } from './usePromptAPI';

interface PromptAPIContextValue extends UsePromptAPIReturn {}

const PromptAPIContext = createContext<PromptAPIContextValue | null>(null);

export interface PromptAPIProviderProps {
  children: ReactNode;
  config?: SessionOptions & { autoInitialize?: boolean };
}

export function PromptAPIProvider({ children, config }: PromptAPIProviderProps) {
  const promptAPI = usePromptAPI(config);

  return <PromptAPIContext.Provider value={promptAPI}>{children}</PromptAPIContext.Provider>;
}

export function usePromptAPIContext(): PromptAPIContextValue {
  const context = useContext(PromptAPIContext);

  if (!context) {
    throw new Error('usePromptAPIContext must be used within PromptAPIProvider');
  }

  return context;
}

// Error boundary for Prompt API errors
interface PromptAPIErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface PromptAPIErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PromptAPIErrorBoundary extends React.Component<
  PromptAPIErrorBoundaryProps,
  PromptAPIErrorBoundaryState
> {
  constructor(props: PromptAPIErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PromptAPIErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.state.error)
          : this.props.fallback;
      }

      return (
        <div role="alert">
          <h2>Prompt API Error</h2>
          <p>{this.state.error.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}


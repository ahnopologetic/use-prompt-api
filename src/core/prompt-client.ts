/**
 * High-level client for Chrome Prompt API
 */

import type {
  AvailabilityStatus,
  SessionOptions,
} from '../types';
import { PromptAPIError } from '../types';
import { SessionManager } from './session-manager';
import {
  checkPromptAPIAvailability,
  waitForModelReady,
  type WaitForModelOptions,
} from '../utils/availability';

export class PromptClient {
  private sessions: Map<string, SessionManager> = new Map();
  private isInitialized = false;

  async initialize(options?: WaitForModelOptions): Promise<void> {
    const status = await checkPromptAPIAvailability();

    if (status === 'unavailable') {
      throw new PromptAPIError(
        'Prompt API is not available. Please use Chrome 128+ with the origin trial enabled.'
      );
    }

    if (status === 'downloading') {
      await waitForModelReady(options);
    }

    this.isInitialized = true;
  }

  async checkAvailability(): Promise<AvailabilityStatus> {
    return checkPromptAPIAvailability();
  }

  async createSession(options?: SessionOptions): Promise<SessionManager> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const sessionId = options?.sessionId;
    const manager = new SessionManager(sessionId, {
      enablePersistence: options?.enablePersistence,
    });

    await manager.create(options);

    const id = manager.getSessionId();
    this.sessions.set(id, manager);

    return manager;
  }

  async restoreSession(sessionId: string): Promise<SessionManager> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const manager = new SessionManager(sessionId);
    await manager.restore(sessionId);

    this.sessions.set(sessionId, manager);

    return manager;
  }

  getSession(sessionId: string): SessionManager | undefined {
    return this.sessions.get(sessionId);
  }

  destroySession(sessionId: string): void {
    const manager = this.sessions.get(sessionId);
    if (manager) {
      manager.destroy();
      this.sessions.delete(sessionId);
    }
  }

  destroyAllSessions(): void {
    for (const [id, manager] of this.sessions.entries()) {
      manager.destroy();
      this.sessions.delete(id);
    }
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance for convenience
let defaultClient: PromptClient | null = null;

export function getDefaultClient(): PromptClient {
  if (!defaultClient) {
    defaultClient = new PromptClient();
  }
  return defaultClient;
}


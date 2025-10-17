/**
 * Session persistence utilities using localStorage
 */

import type { SessionData, InitialPrompt } from '../types';
import { SessionError } from '../types';

const STORAGE_KEY_PREFIX = 'prompt-api-session-';
const STORAGE_INDEX_KEY = 'prompt-api-sessions-index';

export interface SessionStorageOptions {
  ttl?: number; // Time to live in milliseconds
  compress?: boolean;
}

export class SessionStorage {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkStorageAvailability();
  }

  private checkStorageAvailability(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  save(sessionId: string, data: SessionData, options: SessionStorageOptions = {}): void {
    if (!this.isAvailable) {
      console.warn('localStorage not available, session will not be persisted');
      return;
    }

    try {
      const storageData = {
        ...data,
        expiresAt: options.ttl ? Date.now() + options.ttl : null,
      };

      const serialized = JSON.stringify(storageData);
      const key = STORAGE_KEY_PREFIX + sessionId;

      localStorage.setItem(key, serialized);
      this.updateIndex(sessionId);
    } catch (error) {
      throw new SessionError('Failed to save session to storage', error);
    }
  }

  load(sessionId: string): SessionData | null {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const key = STORAGE_KEY_PREFIX + sessionId;
      const serialized = localStorage.getItem(key);

      if (!serialized) {
        return null;
      }

      const data = JSON.parse(serialized);

      // Check if expired
      if (data.expiresAt && Date.now() > data.expiresAt) {
        this.delete(sessionId);
        return null;
      }

      return {
        id: data.id,
        initialPrompts: data.initialPrompts,
        topK: data.topK,
        temperature: data.temperature,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      throw new SessionError('Failed to load session from storage', error);
    }
  }

  delete(sessionId: string): void {
    if (!this.isAvailable) {
      return;
    }

    try {
      const key = STORAGE_KEY_PREFIX + sessionId;
      localStorage.removeItem(key);
      this.removeFromIndex(sessionId);
    } catch (error) {
      console.warn('Failed to delete session:', error);
    }
  }

  list(): string[] {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const index = localStorage.getItem(STORAGE_INDEX_KEY);
      if (!index) {
        return [];
      }

      return JSON.parse(index);
    } catch {
      return [];
    }
  }

  cleanup(olderThan?: number): number {
    if (!this.isAvailable) {
      return 0;
    }

    const sessionIds = this.list();
    let cleanedCount = 0;
    const cutoffTime = olderThan ? Date.now() - olderThan : null;

    for (const sessionId of sessionIds) {
      const data = this.load(sessionId);

      if (!data) {
        cleanedCount++;
        continue;
      }

      if (cutoffTime && data.updatedAt < cutoffTime) {
        this.delete(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  clear(): void {
    if (!this.isAvailable) {
      return;
    }

    const sessionIds = this.list();
    for (const sessionId of sessionIds) {
      this.delete(sessionId);
    }

    localStorage.removeItem(STORAGE_INDEX_KEY);
  }

  private updateIndex(sessionId: string): void {
    const sessions = this.list();
    if (!sessions.includes(sessionId)) {
      sessions.push(sessionId);
      localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(sessions));
    }
  }

  private removeFromIndex(sessionId: string): void {
    const sessions = this.list();
    const filtered = sessions.filter((id) => id !== sessionId);
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(filtered));
  }

  getStorageSize(): number {
    if (!this.isAvailable) {
      return 0;
    }

    const sessionIds = this.list();
    let totalSize = 0;

    for (const sessionId of sessionIds) {
      const key = STORAGE_KEY_PREFIX + sessionId;
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += new Blob([value]).size;
      }
    }

    return totalSize;
  }
}

export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function compressHistory(prompts: InitialPrompt[], maxLength = 10): InitialPrompt[] {
  if (prompts.length <= maxLength) {
    return prompts;
  }

  // Keep system prompts and the most recent messages
  const systemPrompts = prompts.filter((p) => p.role === 'system');
  const otherPrompts = prompts.filter((p) => p.role !== 'system');
  const recentPrompts = otherPrompts.slice(-maxLength + systemPrompts.length);

  return [...systemPrompts, ...recentPrompts];
}


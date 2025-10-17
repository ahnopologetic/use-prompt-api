# Session Management

This guide covers best practices for managing sessions with the Chrome Prompt API.

## Table of Contents

- [Creating Sessions](#creating-sessions)
- [Session Persistence](#session-persistence)
- [Cloning Sessions](#cloning-sessions)
- [Restoring Sessions](#restoring-sessions)
- [Quota Management](#quota-management)
- [Cleanup](#cleanup)

## Creating Sessions

### Basic Session

```typescript
import { SessionManager } from '@ahnopologetic/use-prompt-api';

const manager = new SessionManager();
await manager.create({
  systemPrompt: 'You are a helpful assistant',
  temperature: 0.7,
  topK: 3,
});
```

### Session with Initial Context

```typescript
await manager.create({
  systemPrompt: 'You are a coding assistant',
  initialPrompts: [
    { role: 'user', content: 'I need help with TypeScript' },
    { role: 'assistant', content: 'I can help you with TypeScript!' },
  ],
});
```

## Session Persistence

Sessions are automatically persisted to localStorage when persistence is enabled:

```typescript
const manager = new SessionManager('my-session-id', {
  enablePersistence: true,
});

await manager.create({
  systemPrompt: 'You are a helpful assistant',
});

// Session is automatically saved after each interaction
await manager.prompt('Hello!');
```

### Managing Storage

```typescript
import { SessionStorage } from '@ahnopologetic/use-prompt-api';

const storage = new SessionStorage();

// List all sessions
const sessionIds = storage.list();

// Load a specific session
const sessionData = storage.load('session-id');

// Delete old sessions
storage.cleanup(7 * 24 * 60 * 60 * 1000); // Older than 7 days

// Clear all sessions
storage.clear();
```

## Cloning Sessions

Clone a session to start a new conversation while preserving the initial context:

```typescript
const originalSession = await client.createSession({
  systemPrompt: 'You are a pirate',
});

// Clone the session
const clonedSession = await originalSession.clone();

// Both sessions work independently
await originalSession.prompt('Tell me about ships');
await clonedSession.prompt('Tell me about treasure');
```

## Restoring Sessions

Restore a previously saved session:

```typescript
const manager = new SessionManager();
await manager.restore('previous-session-id');

// Continue the conversation
await manager.prompt('What were we talking about?');
```

## Quota Management

Monitor and manage session quota:

```typescript
const quotaTracker = manager.getQuotaTracker();

// Get quota information
const quota = quotaTracker.getQuotaInfo();
console.log(`Used: ${quota.tokensUsed}/${quota.maxTokens}`);

// Check if quota is available
if (!quotaTracker.hasAvailableQuota(1000)) {
  console.log('Low quota, consider creating a new session');
}

// Get warning level
const level = quotaTracker.getQuotaWarningLevel();
// 'safe' | 'warning' | 'critical' | 'exhausted'
```

### Handling Quota Exhaustion

```typescript
try {
  await manager.prompt('Long prompt...');
} catch (error) {
  if (error instanceof QuotaExceededError) {
    // Clone the session to continue
    const newSession = await manager.clone();
    // Continue with new session
  }
}
```

## Cleanup

Always clean up sessions when done:

```typescript
// Destroy a single session
manager.destroy();

// Destroy all sessions in a client
client.destroyAllSessions();
```

### React Cleanup

In React, cleanup is automatic:

```typescript
function Component() {
  const { session, destroy } = usePromptAPI();

  useEffect(() => {
    // Cleanup happens automatically on unmount
    return () => destroy();
  }, []);
}
```

## Best Practices

1. **Use Unique IDs**: Assign meaningful session IDs for easy restoration
2. **Monitor Quota**: Check quota regularly to avoid mid-conversation failures
3. **Clone Early**: Clone sessions before quota is exhausted
4. **Clean Old Sessions**: Regularly clean up old sessions from storage
5. **Handle Errors**: Always handle quota and session errors gracefully

## Advanced: Session Pooling

For applications with many users, consider session pooling:

```typescript
class SessionPool {
  private sessions: Map<string, SessionManager> = new Map();
  private maxSessions = 10;

  async getSession(userId: string): Promise<SessionManager> {
    if (this.sessions.has(userId)) {
      return this.sessions.get(userId)!;
    }

    if (this.sessions.size >= this.maxSessions) {
      // Evict oldest session
      const oldestId = this.sessions.keys().next().value;
      this.sessions.get(oldestId)?.destroy();
      this.sessions.delete(oldestId);
    }

    const session = new SessionManager();
    await session.create({});
    this.sessions.set(userId, session);
    return session;
  }
}
```


# Migration Guide

Guide for handling Chrome Prompt API changes and future-proofing your application.

## Flexibility for API Evolution

This library is designed to be flexible as the Chrome Prompt API evolves. Here's how to prepare for changes:

## Version Detection

```typescript
import { getCapabilities } from '@ahnopologetic/use-prompt-api';

const capabilities = await getCapabilities();

if (capabilities) {
  console.log('Available:', capabilities.available);
  console.log('Max TopK:', capabilities.maxTopK);
  console.log('Default Temperature:', capabilities.defaultTemperature);
}
```

## Graceful Degradation

### Check Feature Availability

```typescript
import { checkPromptAPIAvailability, isFeatureAvailable } from '@ahnopologetic/use-prompt-api';

const status = await checkPromptAPIAvailability();

if (status === 'unavailable') {
  // Fallback to cloud API
  return useCloudAPI();
}

if (!isFeatureAvailable('streaming')) {
  // Use non-streaming fallback
  return useNonStreamingMode();
}
```

### Progressive Enhancement

```typescript
function ChatComponent() {
  const { ready, error } = usePromptAPI();

  if (error || !ready) {
    // Fallback to traditional chat
    return <CloudChatComponent />;
  }

  // Use local AI
  return <LocalChatComponent />;
}
```

## Handling Breaking Changes

### Adapter Pattern

If the API changes significantly, the library uses adapters internally:

```typescript
// Internal implementation
class APIAdapter {
  static async createSession(options: SessionOptions) {
    // Detect API version and adapt
    if (window.ai?.languageModel?.version === 'v2') {
      return this.createV2Session(options);
    }
    return this.createV1Session(options);
  }
}
```

### Version-Specific Code

```typescript
import { getCapabilities } from '@ahnopologetic/use-prompt-api';

const capabilities = await getCapabilities();

// Adapt to capabilities
const sessionOptions = {
  temperature: Math.min(
    desiredTemperature,
    capabilities?.defaultTemperature ?? 0.7
  ),
  topK: capabilities?.maxTopK ?? 3,
};
```

## Deprecation Warnings

The library will warn about deprecated features:

```typescript
// Console warnings for deprecated usage
@deprecated('Use createSession instead of create', '2.0.0')
function create() {
  // ...
}
```

## Future-Proofing Strategies

### 1. Use Abstraction Layer

Don't access Chrome API directly:

```typescript
// ❌ Bad - Direct API access
const model = await window.ai.languageModel.create();

// ✅ Good - Use library abstraction
import { PromptClient } from '@ahnopologetic/use-prompt-api';
const client = new PromptClient();
```

### 2. Handle All Error Cases

```typescript
try {
  const result = await session.prompt(input);
} catch (error) {
  if (error instanceof PromptAPIError) {
    // Handle specific error types
  } else {
    // Handle unexpected errors
  }
}
```

### 3. Monitor API Changes

```typescript
// Check for API availability on app start
async function initializeApp() {
  const status = await checkPromptAPIAvailability();

  if (status === 'unavailable') {
    analytics.track('prompt_api_unavailable');
    // Use fallback
  }
}
```

### 4. Keep Dependencies Updated

```bash
# Regularly update the library
npm update use-prompt-api

# Check for breaking changes
npm outdated use-prompt-api
```

## Common Migration Scenarios

### API Endpoint Changes

If Chrome changes the API surface:

```typescript
// The library will handle this internally
// Your code remains the same:
const session = await client.createSession();
```

### Parameter Changes

If session parameters change:

```typescript
// Library provides sensible defaults
const session = await client.createSession({
  // These will be adapted to whatever the API supports
  temperature: 0.7,
  topK: 3,
});
```

### Response Format Changes

If response formats change:

```typescript
// Library normalizes responses
const response = await session.prompt(input);
// Always returns string, regardless of internal changes
```

## Rollback Strategy

If you need to support older Chrome versions:

```typescript
import { checkPromptAPIAvailability } from '@ahnopologetic/use-prompt-api';

async function getChatInterface() {
  const status = await checkPromptAPIAvailability();

  // Version-specific logic
  if (status === 'available') {
    return new LocalChatInterface();
  }

  // Fallback for older browsers
  return new CloudChatInterface();
}
```

## Testing for Compatibility

```typescript
describe('Prompt API Compatibility', () => {
  it('should work with current API version', async () => {
    const client = new PromptClient();
    await expect(client.initialize()).resolves.not.toThrow();
  });

  it('should gracefully handle unavailable API', async () => {
    // Mock unavailable API
    window.ai = undefined;

    const client = new PromptClient();
    await expect(client.initialize()).rejects.toThrow();
  });
});
```

## Stay Updated

- Monitor [Chrome AI documentation](https://developer.chrome.com/docs/ai/)
- Watch the library's GitHub for updates
- Subscribe to Chrome release notes
- Test with Chrome Canary for early warning

## Support

If you encounter issues after a Chrome update:

1. Check the library's GitHub issues
2. Update to the latest library version
3. Review the changelog
4. File an issue with details about the API change


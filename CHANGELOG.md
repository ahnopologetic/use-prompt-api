# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-01-XX

### Added

- Initial release of use-prompt-api
- Core session management with persistence
- Structured output with Zod integration
- Function calling support (OpenAI-style)
- Basic agent for multi-turn tasks
- Advanced agent with planning and reflection
- React hooks integration
  - usePromptAPI
  - useStructuredPrompt
  - useFunctionCalling
  - useAgent
  - useAdvancedAgent
- Streaming support with custom renderers
- Quota tracking and management
- Comprehensive documentation and examples
- TypeScript support with full type safety

### Features

#### Core API
- `PromptClient` for high-level session management
- `SessionManager` for individual sessions
- Session persistence with localStorage
- Session cloning and restoration
- Quota tracking and warnings

#### Structured Output
- Zod schema integration
- Automatic JSON parsing and validation
- Retry logic for malformed responses
- Streaming structured output support
- Pre-built common schemas

#### Function Calling
- Function registry for managing tools
- OpenAI-style function definitions
- Automatic function execution
- Built-in functions (time, calculator)
- Error handling and validation

#### Agents
- BasicAgent for simple workflows
- AdvancedAgent with planning/reflection
- Configurable stopping conditions
- Step-by-step execution tracking
- Error recovery strategies

#### React Integration
- Complete hook suite
- Context provider
- Error boundary
- Automatic cleanup
- Real-time updates

#### Streaming
- Stream processors
- Custom renderers (word, sentence, chunk)
- Debouncing and buffering
- Abort controller support

#### Utilities
- Availability checking
- Model download progress
- Quota management
- Session storage
- Error handling with recovery suggestions

[Unreleased]: https://github.com/yourusername/use-prompt-api/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/use-prompt-api/releases/tag/v0.1.0


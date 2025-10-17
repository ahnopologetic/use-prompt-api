# Contributing to use-prompt-api

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/your-username/use-prompt-api.git
cd use-prompt-api
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Run tests**

```bash
pnpm test
```

4. **Build the library**

```bash
pnpm build
```

## Development Workflow

### Making Changes

1. Create a new branch for your feature/fix:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following our code style:
   - Use TypeScript with strict mode
   - Follow existing patterns in the codebase
   - Add JSDoc comments for public APIs
   - Keep functions focused and single-purpose

3. Run linting and formatting:

```bash
pnpm lint
pnpm format
```

4. Add tests for your changes:
   - Unit tests in `__tests__` directories
   - Integration tests for complex features
   - Mock the Chrome API appropriately

5. Update documentation:
   - Update README.md if adding features
   - Add examples to the examples/ directory
   - Update relevant docs/ files

### Code Style

- Use meaningful variable and function names
- Prefer async/await over promises
- Use TypeScript types, avoid `any`
- Add error handling for all external interactions
- Follow the existing file structure

### Commit Messages

Use conventional commit format:

```
feat: add structured output streaming support
fix: resolve quota tracking bug
docs: update function calling guide
test: add tests for session cloning
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Testing

### Unit Tests

```bash
pnpm test
```

### Type Checking

```bash
pnpm type-check
```

### Build Test

```bash
pnpm build
```

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the CHANGELOG.md with notes on your changes
3. Ensure all tests pass and coverage is maintained
4. Request review from maintainers

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Examples added if needed

## Reporting Bugs

### Before Submitting

- Check existing issues
- Test with the latest version
- Verify it's not a Chrome API limitation

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. Create session with...
2. Call function...
3. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- Browser: Chrome 128
- Library version: 0.1.0
- OS: macOS/Windows/Linux

**Additional context**
Any other relevant information.
```

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists
2. Describe the use case clearly
3. Explain why this would be valuable
4. Propose an API design if possible

## Questions?

- Open a discussion on GitHub
- Check the documentation first
- Look at existing issues

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn

## License

By contributing, you agree that your contributions will be licensed under the MIT License.


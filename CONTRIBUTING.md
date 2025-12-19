# Contributing to AI Sales Agent

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Supabase account (for testing)
- Basic knowledge of React, TypeScript, and PostgreSQL

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/ai-sales-agent.git
   cd ai-sales-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/email-integration`)
- `fix/` - Bug fixes (e.g., `fix/intent-detection`)
- `docs/` - Documentation updates (e.g., `docs/api-guide`)
- `refactor/` - Code refactoring (e.g., `refactor/components`)
- `test/` - Test additions/updates (e.g., `test/chat-api`)

### Commit Message Format

Follow the conventional commits specification:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

**Examples**:
```bash
feat(chat): add conversation export functionality
fix(scoring): correct lead score calculation
docs(readme): update installation instructions
```

### Code Style Guidelines

**TypeScript**:
- Use TypeScript for all new code
- Define explicit types (avoid `any`)
- Use interfaces for object shapes
- Export types from `src/types/index.ts`

**React**:
- Use functional components with hooks
- Keep components focused (single responsibility)
- Extract reusable logic into custom hooks
- Props should be typed with interfaces

**CSS/Tailwind**:
- Use Tailwind utility classes
- Follow existing color schemes
- Maintain responsive design patterns
- Add custom animations in `index.css`

**File Organization**:
- Components in `src/components/`
- Types in `src/types/`
- Utilities in `src/lib/`
- One component per file
- Co-locate related files

### Code Quality Checks

Before submitting a PR, ensure:

```bash
# Type checking passes
npm run typecheck

# Linting passes
npm run lint

# Build succeeds
npm run build
```

## Making Changes

### Adding a New Feature

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement your feature**
   - Write clean, typed code
   - Follow existing patterns
   - Add comments for complex logic

3. **Test your changes**
   - Manual testing in browser
   - Test edge cases
   - Verify mobile responsiveness

4. **Document your changes**
   - Update README if needed
   - Add API documentation for new endpoints
   - Update ARCHITECTURE.md for significant changes

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Fixing a Bug

1. **Create a fix branch**
   ```bash
   git checkout -b fix/bug-description
   ```

2. **Reproduce the bug**
   - Understand the issue
   - Identify root cause
   - Consider edge cases

3. **Implement the fix**
   - Minimal changes to fix the issue
   - Add safeguards to prevent recurrence
   - Test thoroughly

4. **Document the fix**
   - Update changelog
   - Add comments explaining the fix
   - Reference issue number in commit

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Type checking passes
- [ ] Build succeeds without errors
- [ ] Tested manually in browser
- [ ] Documentation updated
- [ ] Commit messages follow convention

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (specify)

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Added comments for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass
```

### Review Process

1. **Automated Checks**: CI/CD runs type checking and build
2. **Code Review**: Maintainers review code quality
3. **Testing**: Manual testing of changes
4. **Approval**: At least one approval required
5. **Merge**: Maintainer merges to main branch

## Areas for Contribution

### High Priority

- [ ] Add unit tests for components
- [ ] Add integration tests for API
- [ ] Implement webhook support
- [ ] Email integration for follow-ups
- [ ] Analytics dashboard
- [ ] Export conversation history

### Medium Priority

- [ ] Multi-language support (i18n)
- [ ] Dark mode theme
- [ ] Keyboard shortcuts
- [ ] Advanced filtering for leads
- [ ] Calendar integration
- [ ] CRM integrations (Salesforce, HubSpot)

### Documentation

- [ ] Video tutorials
- [ ] Interactive demo
- [ ] Case studies
- [ ] API client libraries (Python, Ruby, etc.)
- [ ] Troubleshooting guide expansion

### Performance

- [ ] Implement request caching
- [ ] Optimize bundle size
- [ ] Add service worker for offline support
- [ ] Lazy load components
- [ ] Database query optimization

## Reporting Issues

### Bug Reports

Use this template:

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable

## Environment
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.17.0]

## Additional Context
Any other relevant information
```

### Feature Requests

Use this template:

```markdown
## Feature Description
Clear description of the feature

## Problem It Solves
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternatives Considered
Other ways to solve this

## Additional Context
Mockups, examples, etc.
```

## Development Tips

### Testing Locally

**Test Different Intents**:
```typescript
const testMessages = [
  "What's the pricing?",           // pricing_inquiry
  "I want a demo",                 // demo_request
  "Tell me about features",        // feature_inquiry
  "Can someone call me?",          // follow_up
  "Not interested right now",      // not_interested
];
```

**Check Lead Scoring**:
- Send multiple messages and watch score increase
- Test with different intents
- Verify status changes (cold → warm → hot)

**Test Error Handling**:
- Try with invalid lead_id
- Send empty messages
- Test with network offline

### Database Migrations

If adding new tables or columns:

1. Create migration file in proper format
2. Test migration locally
3. Document schema changes
4. Update TypeScript types

### Edge Function Updates

When modifying the chat function:

1. Test locally first
2. Ensure CORS headers are correct
3. Handle all error cases
4. Update API_GUIDE.md

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions
- No harassment or discrimination

### Communication

- **Issues**: Bug reports and feature requests
- **Discussions**: Questions and ideas
- **Pull Requests**: Code contributions

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## Questions?

- Check existing documentation
- Search closed issues
- Ask in discussions
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AI Sales Agent! 🎉

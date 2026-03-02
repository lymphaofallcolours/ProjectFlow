# Testing Patterns

<!-- Claude: Update when new testing patterns, fixtures, or conventions are established. -->

## Philosophy

Red-Green-Refactor. Tests are specifications. TDD for domain logic (entity tag parser, graph operations). Test-after acceptable for UI components during exploration.

## Pyramid Ratio

| Layer | Target | Scope | Tools |
|-------|--------|-------|-------|
| Unit | ~70% | Domain logic, store actions, pure functions | Vitest |
| Integration | ~20% | Store + component, serialization roundtrips | Vitest + React Testing Library |
| E2E | ~10% | Create node, edit content, save/load, entity tagging | Playwright |

## Conventions

### File Naming & Location

- Unit tests: colocated as `{module}.test.ts` next to source file
- Integration tests: `tests/integration/{feature}.integration.test.ts`
- E2E tests: `tests/e2e/{journey}.e2e.test.ts`
- Test fixtures: `tests/fixtures/` — shared factories and seed data

### High-Value Test Targets

These areas MUST have thorough coverage (they're the domain core):

1. **Entity tag parser** — every prefix/symbol combination, edge cases, malformed input
2. **Graph operations** — add/remove/connect nodes, fork, merge, rebase, cycle detection
3. **Serialization** — save/load roundtrip produces identical Campaign objects
4. **Store actions** — Zustand store mutations produce correct state shapes

### Mocking Rules

- Mock ONLY infrastructure boundaries (file I/O, browser APIs).
- NEVER mock Zustand stores — test them directly by calling actions and asserting state.
- NEVER mock domain functions — they're pure, just call them.
- For React Flow interactions in integration tests: use React Testing Library + simulated events.

### Test Factories

Create factory functions for domain objects to avoid repetitive setup:

```typescript
// tests/fixtures/factories.ts
function createStoryNode(overrides?: Partial<StoryNode>): StoryNode {
  return {
    id: crypto.randomUUID(),
    position: { x: 0, y: 0 },
    label: 'Test Node',
    sceneType: 'narration',
    fields: createEmptyNodeFields(),
    metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: [] },
    ...overrides,
  };
}

function createEntity(overrides?: Partial<Entity>): Entity { /* ... */ }
function createCampaign(overrides?: Partial<Campaign>): Campaign { /* ... */ }
```

## Test Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| (to be populated as tests are written) | | |

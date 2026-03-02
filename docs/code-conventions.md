# Code Conventions

<!-- Claude: Update when a new pattern is adopted or an anti-pattern is discovered. -->

## Guiding Principles

- Pure functions by default. Side effects only at boundaries (infrastructure/, store actions).
- Composition over inheritance — always. No class hierarchies.
- Make invalid states unrepresentable via TypeScript's type system.
- React components: small, focused, memoized where needed for React Flow performance.

## Patterns In Use

### Zustand Store Pattern

```typescript
// application/graph-store.ts
import { create } from 'zustand';
import type { StoryNode, StoryEdge } from '@/domain/types';

type GraphState = {
  nodes: Record<string, StoryNode>;
  edges: Record<string, StoryEdge>;
  addNode: (node: StoryNode) => void;
  removeNode: (id: string) => void;
  // ... other actions
};

export const useGraphStore = create<GraphState>((set) => ({
  nodes: {},
  edges: {},
  addNode: (node) => set((state) => ({
    nodes: { ...state.nodes, [node.id]: node }
  })),
  removeNode: (id) => set((state) => {
    const { [id]: _, ...rest } = state.nodes;
    return { nodes: rest };
  }),
}));
```

### Domain Functions Are Pure

```typescript
// domain/graph-operations.ts
import type { StoryNode, StoryEdge, SceneType } from './types';

function createNode(sceneType: SceneType, position: { x: number; y: number }): StoryNode {
  return {
    id: crypto.randomUUID(),
    position,
    label: 'New Scene',
    sceneType,
    fields: createEmptyNodeFields(),
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    },
  };
}

// Pure: takes state in, returns new state out. No side effects.
function connectNodes(
  edges: Record<string, StoryEdge>,
  sourceId: string,
  targetId: string,
): Record<string, StoryEdge> {
  const edge: StoryEdge = {
    id: crypto.randomUUID(),
    source: sourceId,
    target: targetId,
  };
  return { ...edges, [edge.id]: edge };
}
```

### React Flow Custom Nodes Must Be Memoized

```typescript
// ui/graph/NarrationNode.tsx
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { StoryNode } from '@/domain/types';

export const NarrationNode = memo(({ data }: { data: StoryNode }) => (
  <div className="narration-node">
    <Handle type="target" position={Position.Left} />
    <span>{data.label}</span>
    <Handle type="source" position={Position.Right} />
  </div>
));
```

### Import Order

```typescript
// 1. React / framework
import { memo, useState, useCallback } from 'react';

// 2. External packages
import { create } from 'zustand';
import { ReactFlow } from '@xyflow/react';

// 3. Internal — path aliases
import type { StoryNode } from '@/domain/types';
import { useGraphStore } from '@/application/graph-store';
import { NarrationNode } from '@/ui/graph/NarrationNode';
```

## Anti-Patterns to Avoid

| Anti-Pattern | Why | Do Instead |
|-------------|-----|------------|
| Importing React in domain/ | Breaks layer boundary | Domain is pure TS only |
| Un-memoized React Flow nodes | Canvas re-renders on every state change | Always use `memo()` |
| Direct file I/O in stores | Store should not know about browser APIs | Call infrastructure/ functions |
| Inline Zustand store in components | Couples UI to state shape | Dedicated store files in application/ |
| Mutating state directly in stores | Breaks React reactivity | Immutable updates (spread or Immer) |

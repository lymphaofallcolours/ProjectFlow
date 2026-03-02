# Dependencies

<!-- Claude: Update this file whenever a dependency is added, replaced, or removed. -->

## Production Dependencies

### react / react-dom
**Purpose:** UI framework — component model for the entire application.
**Chosen over:** Vue (less TypeScript integration), Svelte (smaller ecosystem for graph libraries).
**Removal risk:** High — foundational.
**Added:** Project init.

### @xyflow/react (React Flow)
**Purpose:** Graph canvas rendering — nodes, edges, pan, zoom, drag, custom shapes.
**Chosen over:** Cytoscape (less React-native), D3 force graph (too low-level), vis-network (less maintained).
**Removal risk:** High — core UI component. Custom node shapes and interaction model built on top.
**Added:** Phase 1.

### zustand
**Purpose:** Global state management — graph state, entity registry, campaign settings, playthrough log.
**Chosen over:** Redux (too much boilerplate), Jotai (atomic model doesn't fit nested graph state), React Context (poor performance for frequent updates).
**Removal risk:** High — all application state flows through Zustand stores.
**Added:** Phase 1.

### @tiptap/react + @tiptap/starter-kit + @tiptap/extension-*
**Purpose:** Rich text editor for node content fields. Extensible for entity tag autocomplete and chip rendering.
**Chosen over:** Slate.js (steeper learning curve), Draft.js (deprecated), CodeMirror (code-focused, not prose).
**Removal risk:** High — all content editing uses TipTap. Custom extensions for entity system.
**Added:** Phase 2.

### tailwindcss
**Purpose:** Utility-first CSS — fast styling, easy dark/light mode via `dark:` variants.
**Chosen over:** CSS Modules (more verbose), Styled Components (runtime overhead), vanilla CSS (slower dev).
**Removal risk:** Medium — deeply integrated in component classes but replaceable with effort.
**Added:** Phase 1.

---

## Dev Dependencies

### vite
**Purpose:** Build tool and dev server. Fast HMR, optimized production builds.
**Added:** Project init.

### vitest
**Purpose:** Unit and integration test runner. Vite-native, fast, compatible with Jest API.
**Added:** Phase 1.

### @playwright/test
**Purpose:** E2E testing for critical user flows.
**Added:** Phase 1 (configured), used from Phase 2+.

### eslint + typescript-eslint + prettier
**Purpose:** Code quality and formatting. Catches type errors, enforces conventions.
**Added:** Phase 1.

### immer (if added)
**Purpose:** Ergonomic immutable state updates inside Zustand stores for deeply nested graph/entity state.
**Chosen over:** Manual spread operators (error-prone for deep nesting).
**Removal risk:** Low — convenience layer, easily removed.
**Added:** (TBD — add when nested state updates become painful.)

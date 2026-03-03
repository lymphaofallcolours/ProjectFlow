# Dependencies

<!-- Claude: Update this file whenever a dependency is added, replaced, or removed. -->

## Production Dependencies

### react / react-dom (^19.1.0)
**Purpose:** UI framework — component model for the entire application.
**Chosen over:** Vue (less TypeScript integration), Svelte (smaller ecosystem for graph libraries).
**Removal risk:** High — foundational.
**Added:** Project init.

### @xyflow/react (^12.10.1)
**Purpose:** Graph canvas rendering — nodes, edges, pan, zoom, drag, custom shapes. Provides ReactFlow component, node/edge types, viewport management, and coordinate conversion (flowToScreenPosition, screenToFlowPosition).
**Chosen over:** Cytoscape (less React-native), D3 force graph (too low-level), vis-network (less maintained).
**Removal risk:** High — core UI component. Custom node shapes and interaction model built on top.
**Added:** Phase 1, Commit 1.

### zustand (^5.0.11)
**Purpose:** Global state management — graph state (nodes, edges, viewport), UI state (overlays, theme), campaign metadata.
**Chosen over:** Redux (too much boilerplate), Jotai (atomic model doesn't fit nested graph state), React Context (poor performance for frequent updates).
**Removal risk:** High — all application state flows through 3 Zustand stores.
**Added:** Phase 1, Commit 1.

### lucide-react (^0.576.0)
**Purpose:** Icon library — provides the 11 field icons (Mic, MessageSquare, StickyNote, etc.) and UI icons (Plus, X, Check, ChevronDown, etc.) used throughout the interface.
**Chosen over:** Heroicons (less variety), React Icons (larger bundle), custom SVGs (more maintenance).
**Removal risk:** Low — purely visual, replaceable by any icon set.
**Added:** Phase 1, Commit 1.

### @tiptap/react (3.20.0) + @tiptap/pm + @tiptap/starter-kit + @tiptap/extension-placeholder + @tiptap/extension-mention
**Purpose:** Rich text editor for all node content fields. StarterKit provides base editing; Mention extension drives entity tag autocomplete (two instances: @ for present, # for mentioned); Placeholder provides empty-state hints.
**Chosen over:** Slate.js (steeper learning curve), Draft.js (deprecated), CodeMirror (code-focused, not prose).
**Removal risk:** High — all content editing uses TipTap. Custom EntityChip NodeView renders inline entity chips.
**Added:** Phase 2, Commit 3.

### tailwindcss (^4.2.1)
**Purpose:** Utility-first CSS — fast styling, custom theme via `@theme` blocks and CSS custom properties. Aeroglass theme with frosted translucent surfaces.
**Chosen over:** CSS Modules (more verbose), Styled Components (runtime overhead), vanilla CSS (slower dev).
**Removal risk:** Medium — deeply integrated in component classes but replaceable with effort.
**Added:** Phase 1, Commit 1.

---

## Dev Dependencies

### vite (^7.3.1)
**Purpose:** Build tool and dev server. Fast HMR, optimized production builds.
**Added:** Project init.

### @tailwindcss/vite (^4.2.1)
**Purpose:** Vite plugin for Tailwind CSS v4. Required for the v4 `@import "tailwindcss"` syntax.
**Added:** Phase 1, Commit 1.

### vitest (^4.0.18)
**Purpose:** Unit and integration test runner. Vite-native, fast, compatible with Jest API. Uses jsdom environment for component tests.
**Added:** Phase 1, Commit 1.

### @testing-library/react (^16.3.2) + @testing-library/jest-dom (^6.6.5)
**Purpose:** DOM testing utilities for React components. `jest-dom` provides custom matchers like `toBeInTheDocument()`.
**Added:** Phase 1, Commit 1.

### jsdom (^28.1.0)
**Purpose:** Browser environment for Vitest. Simulates DOM APIs for component and store testing.
**Added:** Phase 1, Commit 1.

### vite-plugin-pwa (^1.2.0)
**Purpose:** PWA support — generates web manifest, registers service worker via Workbox, precaches static assets for offline use. Integrates with Vite build pipeline.
**Chosen over:** Manual Workbox setup (more config), workbox-webpack-plugin (wrong build tool), custom service worker (reinvents precaching).
**Removal risk:** Low — only affects build output, no runtime code dependency.
**Added:** Phase 6, Commit 4.

### sharp (^0.34.5)
**Purpose:** SVG → PNG icon generation for PWA icons. Used only by `scripts/generate-icons.mjs` to render the source SVG to 192x192, 512x512, and 180x180 (apple-touch-icon) PNGs.
**Chosen over:** Canvas-based rendering (no native canvas in Node.js without additional deps), manual icon creation (not reproducible), resvg-js (less widely used).
**Removal risk:** Very low — only used for icon generation script, never imported by application code.
**Added:** Phase 7, Commit 5.

### @playwright/test (not yet installed)
**Purpose:** E2E testing for critical user flows.
**Added:** (planned for Phase 2+)

### eslint + typescript-eslint
**Purpose:** Code quality and formatting. Catches type errors, enforces conventions.
**Added:** Project init.

### immer (not yet installed)
**Purpose:** Ergonomic immutable state updates inside Zustand stores for deeply nested graph/entity state.
**Chosen over:** Manual spread operators (error-prone for deep nesting).
**Removal risk:** Low — convenience layer, easily removed.
**Added:** (TBD — add when nested state updates become painful.)

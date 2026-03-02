# Architecture Decision Records

<!-- Claude: Append new decisions during development. NEVER delete or edit past entries. -->

---

## 2026-03-02 — Web app with JSON file export over Electron

**Status:** Accepted
**Context:** Needed to decide deployment model: local desktop app (Electron) vs. web app vs. hybrid.
**Decision:** Web application with JSON file export/import. File System Access API for direct save where supported, download/upload fallback elsewhere.
**Alternatives rejected:** Electron (adds packaging complexity, not needed since this is single-user with no backend); cloud-hosted with DB (unnecessary complexity for single-user local-first tool).
**Consequences:** No native file system access on all browsers. Must handle the File System Access API gracefully with fallback. PWA can be added later for offline support. Electron wrapper remains a future option around the same codebase.

## 2026-03-02 — Three-tier drill-down interaction model

**Status:** Accepted
**Context:** Needed to design how users access the 11 content fields per node without cluttering the graph canvas.
**Decision:** Three-tier progressive disclosure: (1) Tree view with shaped nodes, (2) Hold/Alt+click for radial field subnodes, (3) Double-click for full cockpit overlay. All overlays render over blurred graph background.
**Alternatives rejected:** Docked side panels (too static, doesn't scale to 11 fields); tabbed editor panel (loses graph context); sidebar detail view (splits attention).
**Consequences:** Requires careful interaction mapping to avoid conflicts (single click = select, hold = subnodes, double-click = cockpit, right-click = menu). The hold gesture (~500ms) needs to be tuned for feel. Blur backdrop is GPU-intensive — test on lower-end hardware.

## 2026-03-02 — Custom entity tagging DSL with 6 types

**Status:** Accepted
**Context:** GM needs to tag PCs, NPCs, enemies, objects, locations, and secret entities in scene text with presence/mention distinction.
**Decision:** Prefix-based syntax: `@`/`#` for present/mentioned, with type prefixes `!` (NPC), `%` (enemy), `$` (object), `~` (location), `&` (secret). Status markers via `+status` suffix. Rendered as colored inline chips in TipTap.
**Alternatives rejected:** Unified `@` prefix with type selector popup (slower to type); hashtag-only system (no present/mentioned distinction); dropdown-based tagging (breaks writing flow).
**Consequences:** Regex parser in domain/ must handle all combinations. TipTap needs a custom extension for autocomplete and chip rendering. Legend/cheatsheet is essential for discoverability. The `&` prefix for secrets may conflict with HTML entities in some edge cases — parser must be robust.

## 2026-03-02 — Aeroglass aesthetic over dark industrial

**Status:** Accepted
**Context:** Needed a visual identity for the application. Initially explored a dark industrial command terminal aesthetic, but user explicitly requested polished, clean surfaces with a glass/aeroglass style.
**Decision:** Frosted translucent "aeroglass" aesthetic. CSS custom properties for glass surfaces (`--color-surface-glass`, `--color-surface-glass-border`), `backdrop-filter: blur()` on panels, luminous accent colors per scene type, top highlight reflections on node shapes, and clean sans-serif typography (DM Sans display + body, JetBrains Mono for code).
**Alternatives rejected:** Dark industrial terminal (user rejected — too harsh), Material Design (too generic), flat minimal (too plain for a creative tool).
**Consequences:** Heavy use of `backdrop-filter: blur()` which is GPU-intensive. `.glass-panel` CSS utility class used everywhere. Dark and light modes both use translucent glass — light mode uses higher backdrop saturation for richness.

## 2026-03-02 — Separate vitest.config.ts for Vite 7 compatibility

**Status:** Accepted
**Context:** Vite 7 uses TypeScript config by default. Combining Vitest config inline in `vite.config.ts` caused TypeScript errors with test-specific options.
**Decision:** Maintain a separate `vitest.config.ts` that duplicates the resolve aliases and adds test-specific options (globals, jsdom, setup files).
**Alternatives rejected:** Using `/// <reference>` directives (fragile), casting config types (loses type safety).
**Consequences:** Must keep path aliases in sync between both config files. Small maintenance overhead.

## 2026-03-02 — Radial subnodes rendered in screen space, not as graph nodes

**Status:** Accepted
**Context:** The 11 radial field subnodes that orbit a node need to be clickable and positioned relative to the node. Could either add them as React Flow nodes or render them as a screen-space overlay.
**Decision:** Screen-space overlay using `flowToScreenPosition` for coordinate conversion. RadialSubnodes component is rendered inside `ReactFlowProvider` but outside the `<ReactFlow>` component tree.
**Alternatives rejected:** Adding subnodes as React Flow nodes (pollutes the graph model, creates selection/connection confusion), CSS-only positioning (can't account for zoom).
**Consequences:** Must recalculate positions on viewport change. Positions scale with zoom via `getZoom()`. The component requires React Flow context, so it lives inside GraphCanvasInner.

---

<!-- Entries above — newest first -->

# Project Specification: ProjectFlow

**Codename:** ProjectFlow (working title)
**Version:** 0.2 — Final Pre-development Spec
**Author:** Interview-derived specification

---

## 1. Project Summary

A narrative graph editor and session runner purpose-built for tabletop RPG game mastering. The tool replaces spreadsheet-based campaign scripting with a node-and-edge graph where each node represents a story stage, and edges represent transitions between stages. The GM builds branching story structures during prep, then navigates them during live play, while the graph silently tracks what actually happened versus what was planned.

**Primary user:** A single GM running tabletop RPG campaigns, both in-person and online. Only the GM sees the tool.

**Core interaction philosophy:** The graph is a memory system for events and actions, not a railroad. The GM is free to roam the tree in any direction at any time. Branching represents planned possibilities; playthrough tracking records what actually happened.

---

## 2. Architecture Overview

### 2.1 Deployment

**Web application with JSON file export/import.**

Rationale:
- Works on any device (laptop, tablet) with no installation.
- Functions offline once loaded (service worker / PWA).
- JSON export gives full data portability and backup.
- If a desktop wrapper is ever needed, the same codebase wraps in Electron trivially.

### 2.2 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | TypeScript (strict mode) | Type safety, project requirement |
| Framework | React 18+ | Component model fits the overlay-based UI |
| State management | Zustand | Lightweight, minimal boilerplate, good for complex nested state |
| Graph rendering | React Flow | Mature node/edge graph library with drag-and-drop, zoom, pan, custom node shapes |
| Rich text editing | TipTap (ProseMirror-based) | Markdown support, extensible for custom entity tags |
| Styling | Tailwind CSS | Utility-first, easy dark/light mode theming |
| Persistence | File System Access API + JSON fallback | Save/load to local files; fallback to download/upload for browsers without FS API |
| Build | Vite | Fast dev server, optimized production builds |
| Testing | Vitest + Playwright | Unit/integration + E2E |

### 2.3 Data Model (Core Types)

```typescript
// --- Campaign ---
interface Campaign {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  graph: NarrativeGraph;
  entityRegistry: EntityRegistry;
  customFieldTemplates: CustomFieldTemplate[];  // campaign-wide reusable field types
  settings: CampaignSettings;
  playthroughLog: PlaythroughEntry[];
}

// --- Graph ---
interface NarrativeGraph {
  nodes: Record<string, StoryNode>;
  edges: Record<string, StoryEdge>;
  viewport: ViewportState;
  scrollDirection: 'horizontal' | 'vertical';
}

interface StoryNode {
  id: string;
  position: { x: number; y: number };
  label: string;                     // short title shown on the node
  sceneType: SceneType;              // determines node shape
  arcLabel?: string;                 // optional "ARC 4", "MISSION 5" overlay
  fields: NodeFields;
  playthroughStatus?: PlaythroughStatus;
  playthroughNotes?: string;         // what changed vs. plan
  metadata: {
    createdAt: string;
    updatedAt: string;
    tags: string[];                  // freeform tags for filtering
  };
}

// Node shape is determined by scene type
type SceneType = 'event' | 'narration' | 'combat' | 'social' | 'investigation';

// Shape mapping:
// event         → Circle    (plot points, revelations, transitions)
// narration     → Square    (story-driven, read-aloud heavy)
// combat        → Triangle  (encounters, mechanical challenges)
// social        → Diamond   (negotiation, interrogation, roleplay)
// investigation → Hexagon   (exploration, clue-finding)

interface NodeFields {
  script: RichContent;               // read-aloud narration
  dialogues: DialogueEntry[];        // attributed NPC lines
  gmNotes: RichContent;              // private reminders, contingencies
  vibe: RichContent;                 // mood, atmosphere description
  soundtrack: SoundtrackCue[];       // track names, links
  events: RichContent;               // combat triggers, skill checks, mechanics
  combat: RichContent;               // essential combat info
  characters: RichContent;           // who is present, their state
  diceRolls: DiceRollEntry[];        // pre-planned rolls for this stage
  secrets: RichContent;              // hidden details, additional options
  custom: CustomField[];             // user-defined additional fields (per-node ad-hoc + campaign templates)
}

// Field metadata for the radial subnode system
interface FieldDefinition {
  key: keyof NodeFields;
  label: string;
  icon: string;                      // emoji or lucide icon
  color: string;                     // subnode tint
}

// Default field definitions (11 built-in):
// script       → 🎤 Script         (narration text)
// dialogues    → 💬 Dialogue        (NPC lines)
// gmNotes      → 📝 GM Notes       (private reminders)
// vibe         → 🌫️ Vibe           (mood/atmosphere)
// soundtrack   → 🎵 Soundtrack     (music cues)
// events       → ⚡ Events         (triggers, skill checks)
// combat       → ⚔️ Combat         (encounter info)
// characters   → 👥 Characters     (who is present)
// diceRolls    → 🎲 Dice Rolls     (pre-planned rolls)
// secrets      → 🔒 Secrets        (hidden details)
// custom       → ✨ Custom         (user-defined)

interface RichContent {
  markdown: string;                  // raw markdown with entity tags
  attachments?: Attachment[];        // images, maps, handouts
}

interface DialogueEntry {
  entityRef: string;                 // entity tag, e.g., "!@Voss"
  line: string;                      // the dialogue text (rich markdown)
  direction?: string;                // stage direction: "whispered", "shouting"
}

interface SoundtrackCue {
  trackName: string;
  url?: string;                      // optional link to the track
  note?: string;                     // "start when players enter the chamber"
}

interface DiceRollEntry {
  description: string;               // "Perception test for hidden threat"
  formula?: string;                  // "1d100 vs 45"
  result?: string;                   // filled in during play
}

interface CustomField {
  label: string;
  content: RichContent;
  templateId?: string;               // links to campaign-wide template, if derived from one
}

interface CustomFieldTemplate {
  id: string;
  label: string;
  icon: string;
  description?: string;              // what this field type is for
}

interface StoryEdge {
  id: string;
  source: string;
  target: string;
  label?: string;                    // condition/description on the edge
  style?: 'default' | 'conditional' | 'secret';
}

// --- Playthrough Tracking ---
type PlaythroughStatus = 'unvisited' | 'played_as_planned' | 'modified' | 'skipped';

interface PlaythroughEntry {
  id: string;
  sessionDate: string;
  sessionLabel?: string;             // "Session 12 — The Breach"
  nodesVisited: {
    nodeId: string;
    status: PlaythroughStatus;
    notes?: string;
    timestamp: string;
  }[];
}

// --- Entity System ---
interface EntityRegistry {
  entities: Record<string, Entity>;
  typeConfig: EntityTypeConfig[];
}

interface Entity {
  id: string;
  type: EntityType;
  name: string;
  description?: string;              // narrative summary
  affiliations?: string[];           // faction links
  history?: RichContent;             // backstory, narrative arc
  relationships?: EntityRelationship[];
  portrait?: Attachment;
  statusHistory: StatusEntry[];
  custom: Record<string, string>;    // extensible fields
}

type EntityType = 'pc' | 'npc' | 'enemy' | 'object' | 'location' | 'secret';

interface EntityTypeConfig {
  type: EntityType;
  prefix: string;                    // '', '!', '%', '$', '~', '&'
  presentSymbol: string;             // '@'
  mentionedSymbol: string;           // '#'
  color: string;
  icon: string;                      // lucide icon name
  label: string;
}

// Default type configuration:
// PC:       prefix ''   → @Name, #Name         (blue,   shield icon)
// NPC:      prefix '!'  → !@Name, !#Name       (green,  user icon)
// Enemy:    prefix '%'  → %@Name, %#Name       (red,    skull icon)
// Object:   prefix '$'  → $@Name, $#Name       (amber,  package icon)
// Location: prefix '~'  → ~@Name, ~#Name       (purple, map-pin icon)
// Secret:   prefix '&'  → &@Name, &#Name       (gray,   eye-off icon)

interface EntityRelationship {
  targetEntityId: string;
  type: string;                      // "ally", "rival", "subordinate", etc.
  note?: string;
}

interface StatusEntry {
  nodeId: string;
  status: string;                    // "+wounded", "+corrupted", "+dead", "+allied"
  note?: string;
}

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  dataUrl: string;                   // base64 encoded for portability
}

// --- UI Configuration ---
interface CampaignSettings {
  theme: 'light' | 'dark';
  scrollDirection: 'horizontal' | 'vertical';
  entityTypeConfig: EntityTypeConfig[];
  autoSaveEnabled: boolean;
  autoSaveIntervalMs: number;
}

type ViewportState = {
  x: number;
  y: number;
  zoom: number;
};
```

---

## 3. Feature Specification

### 3.1 Interaction Model

The app uses a **three-tier drill-down** interaction for accessing node content, keeping the graph canvas clean at rest and progressively revealing detail on demand.

#### Tier 1: Tree View (default)

The graph canvas shows nodes and edges. Nodes are rendered as **shaped cards** based on scene type:

| Scene Type | Shape | Use Case |
|-----------|-------|----------|
| Event | Circle | Plot points, revelations, transitions |
| Narration | Square | Story-driven, read-aloud heavy |
| Combat | Triangle | Encounters, mechanical challenges |
| Social/RP | Diamond | Negotiation, interrogation, roleplay |
| Investigation | Hexagon | Exploration, clue-finding |

Each node displays: label, arc label (if set), playthrough status color, and small entity-type icons summarizing what entities are tagged inside.

#### Tier 2: Radial Field Subnodes (press-and-hold OR Alt+click)

Pressing and holding (~500ms) or Alt+clicking a node causes **radial subnodes** to orbit around it. Each subnode represents one of the node's fields:

- Subnodes are small icons with labels (e.g., 🎤 Script, ⚔️ Combat, 🎵 Soundtrack).
- **Populated fields** render with full opacity and solid icons.
- **Empty fields** render dimmed/faded but remain visible (shows what's missing at a glance).
- Subnodes stay visible until the user clicks away from the node area or presses Escape.
- **Clicking a subnode** opens that field as a **panel overlay** on the left or right side of the screen (vertical scroll) or top/bottom (horizontal scroll). The field content is displayed as scrollable rich text over a blurred background of the graph.
- Clicking a different subnode swaps the panel content. Clicking the same subnode again closes it.

#### Tier 3: Full Cockpit Overlay (double-click)

Double-clicking a node opens a **full-screen cockpit view**: all 11 fields displayed as scrollable miniwindow panels arranged to fill the available screen space, overlaid on a blurred background of the graph.

- Panels are arranged in a grid/mosaic filling the screen.
- Each panel is independently scrollable.
- Empty fields are present but visually collapsed/minimal.
- Press Escape or click the blurred background to dismiss, returning directly to Tier 1 (tree view).

#### Complete Interaction Map

| Action | Result |
|--------|--------|
| **Single click** | Select node (highlight, enable multi-select with Shift+click) |
| **Click + drag** | Move selected node(s) on canvas |
| **Press and hold** (~500ms) | Show radial field subnodes around node |
| **Alt + click** | Show radial field subnodes (keyboard alternative to hold) |
| **Click a field subnode** | Open that field as a panel overlay (blurred background) |
| **Double click** | Open full cockpit overlay (all fields, blurred background) |
| **Right click** | Context menu (playthrough status, create/delete/duplicate, scene type, arc label) |
| **Escape** | Dismiss current overlay, return to tree view |
| **Click blurred background** | Dismiss current overlay, return to tree view |
| **Shift + click** | Add/remove node from multi-selection |
| **Lasso drag** (on empty canvas) | Multi-select nodes within the lasso area |
| **Click-drag from node handle** | Create a new edge |

### 3.2 Graph Editor (Prep Mode)

**Canvas interaction:**
- 2D canvas powered by React Flow with pan, zoom, and minimap.
- Custom node shapes per scene type (circle, square, triangle, diamond, hexagon).
- Edges rendered as directional arrows with optional labels.
- Scroll direction toggle (horizontal/vertical) that reflows the auto-layout.

**Node operations (right-click context menu + toolbar):**
- Create new node (connected to selected, or standalone).
- Set scene type (changes node shape).
- Duplicate node (deep copy all fields).
- Delete node (with confirmation, reassign edges).
- Cut / Copy / Paste nodes (including between branches).
- Set arc label ("ARC 4", "MISSION 5", custom text).
- Playthrough status: Played as planned / Modified / Skipped / Unvisited.
- Add playthrough notes (what changed vs. plan).

**Edge operations:**
- Click-drag from node handle to create edge.
- Delete edge.
- Label edge (condition text).
- Edge style: default (solid), conditional (dashed), secret (dotted, faded).

**Branching:**
- One node can have multiple outgoing edges (fork).
- Multiple edges can point to one node (merge/reconverge).
- Nodes can be freely rewired: detach from one parent, attach to another (rebase).

**Multi-select:**
- Shift+click to add/remove individual nodes from selection.
- Lasso/marquee drag on empty canvas area to select a group.
- Move, copy, delete selected group.
- Group into a named subgraph (collapsible in the overview).

### 3.3 Node Content Editing

Content editing happens within the Tier 2 (single-field panel) or Tier 3 (full cockpit) overlays. Both overlays support:

- TipTap rich text editor with markdown support.
- Entity tag autocomplete (see 3.5).
- Image/attachment embedding via drag-and-drop or paste.
- Hyperlink insertion.
- All 11 built-in fields are always present.
- Custom fields: add per-node ad-hoc fields, or instantiate from campaign-wide templates.

### 3.4 Playthrough Tracking & Diff

**Free navigation philosophy:**
The GM is never railroaded through the graph. They can jump to any node at any time, go backwards, skip branches, and navigate freely. The playthrough tracking layer is an **opt-in overlay** that records what happened, not a constraint on movement.

**Marking nodes during/after play (right-click context menu):**
- **Played as planned** (green) — this scene happened as written.
- **Modified** (blue) — this scene happened but with changes. Prompts for a text note describing what changed.
- **Skipped** (red) — this planned scene did not occur.
- **Unvisited** (gray, default) — not part of this session.

**Diff view (post-session):**
- Toggle a "Playthrough Overlay" that color-codes the entire graph.
- Green path = played as planned.
- Blue nodes = where the story deviated.
- Red nodes = planned content that was skipped.
- Gray = unvisited.
- Session timeline sidebar: chronological list of visited nodes with status and notes.

**Session log:**
- Each session saved as a `PlaythroughEntry` with date, label, and node visit history.
- Multiple playthroughs accumulate — view any past session's diff.
- Export session log as markdown for campaign journaling.

### 3.5 Entity System

**Registry:**
- Dedicated panel/page for managing all entities across the campaign.
- Create entities with: name, type, description, affiliations, history, relationships, portrait.
- Narrative-focused profiles: who they are, what they want, how they relate to others. No stat blocks.

**Tagging language:**

| Type | Prefix | Present (in scene) | Mentioned (referenced) | Example |
|------|--------|--------------------|------------------------|---------|
| PC | *(none)* | `@Name` | `#Name` | `@Alfa`, `#Bravo` |
| NPC | `!` | `!@Name` | `!#Name` | `!@Voss`, `!#Voss` |
| Enemy | `%` | `%@Name` | `%#Name` | `%@Target`, `%#Leader` |
| Object | `$` | `$@Name` | `$#Name` | `$@Item`, `$#Beacon` |
| Location | `~` | `~@Name` | `~#Name` | `~@North District`, `~#Sector 7` |
| Secret | `&` | `&@Name` | `&#Name` | `&@Hidden Threat`, `&#Artifact` |

**Status change markers** (attachable to any entity tag):

```
@Alfa+wounded        — PC status change
!@Voss+dead          — NPC killed at this node
%@Target+fleeing     — enemy status change
$@Item+destroyed     — object status change
```

Status changes are logged in the entity's `statusHistory` and associated with the node where they occur.

**Autocomplete:**
- Typing any tag prefix triggers an autocomplete dropdown filtered to that entity type.
- Shows all entities of that type immediately, filters as the user types.
- Tab or click to insert the full tag.
- Unrecognized names prompt "Create new entity?" inline.

**Rendering:**
- Entity tags render as **colored inline chips** with small type icons.
  - PC: blue chip, shield icon.
  - NPC: green chip, user icon.
  - Enemy: red chip, skull icon.
  - Object: amber chip, package icon.
  - Location: purple chip, map-pin icon.
  - Secret: gray chip, eye-off icon.
- Present (`@`) tags: solid chip background.
- Mentioned (`#`) tags: outlined/ghost chip.
- Chips are clickable (opens entity profile in sidebar).
- Hover shows tooltip with entity description.

**Search and filtering:**
- Search by entity name across all nodes.
- Filter graph to highlight nodes where a specific entity appears.
- "Entity path" view: highlight the subgraph of nodes involving a selected entity, distinguishing present vs. mentioned.
- Filter by entity type.

**Floating legend/cheatsheet:**
- Toggleable floating panel showing all tag prefixes, symbols, status marker syntax, and color coding.
- Accessible via keyboard shortcut (`Ctrl+/` or `?`).

### 3.6 Save / Load / Export

**File operations:**
- Save campaign to local `.json` file (full campaign state including graph, entities, playthroughs, settings, embedded images as base64).
- Load campaign from `.json` file.
- Auto-save toggle with configurable interval (default: 60s) using File System Access API where available.
- Export session log as `.md` (markdown journal).
- Export entity registry as `.md` (campaign codex).
- Import/export individual subgraphs (copy a branch to another campaign).

**File format:**
- Single `.json` file containing the full `Campaign` object.
- Human-readable when pretty-printed.
- Schema version field for forward-compatible migrations.

### 3.7 Theming

- Light and dark mode, toggleable via UI button and keyboard shortcut.
- Theme persists in campaign settings and in browser preferences as a default.
- Entity chip colors, node shape fills, and overlay backdrops adjust for contrast in both themes.

---

## 4. UI Layout

### 4.1 Tree View (Default State)

```
┌──────────────────────────────────────────────────────────┐
│ Toolbar: [New Node] [Undo/Redo] [Search] [Entities]      │
│          [Save] [Load] [Export] [Legend (?)] [Theme 🌙]   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│           Graph Canvas (pan / zoom / minimap)              │
│                                                            │
│      ○ ──────▶ □ ──────▶ □ ──────▶ △                     │
│     Event     Narr.     Narr.     Combat                  │
│                │                                           │
│                ▼                                           │
│               ◇ ──────▶ ⬡                                │
│             Social     Invest.                             │
│                                                            │
│  Nodes show: shape (scene type), label, arc label,        │
│  playthrough status color, entity type icon summary        │
│                                                            │
├──────────────────────────────────────────────────────────┤
│ Status: 12 nodes | 4 entities | Session: "Session 3"       │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Tier 2: Radial Subnodes (Hold or Alt+Click a Node)

```
┌──────────────────────────────────────────────────────────┐
│ Toolbar                                                    │
├──────────────────────────────────────────────────────────┤
│                                                            │
│                    🎵 Soundtrack                           │
│              📝 Notes    ⚔️ Combat                        │
│                                                            │
│            💬 Dialogue ─[ □ ]─ ⚡ Events                  │
│                        Node                                │
│              🎤 Script    🎲 Dice                          │
│                    🌫️ Vibe                                │
│             👥 Characters   🔒 Secrets                     │
│                                                            │
│  Populated subnodes: full opacity                          │
│  Empty subnodes: dimmed                                    │
│  Click any subnode → opens field panel (see 4.3)           │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### 4.3 Tier 2: Single Field Panel Overlay

```
┌──────────────────────────────────────────────────────────┐
│                                                            │
│  ┌──────────────────────┐                                 │
│  │ 🎤 Script            │    ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  │                      │    ░░░░░ (blurred graph) ░░░░  │
│  │  The team enters     │    ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  │  the lower district. │    ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  │  The air grows       │    ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  │  thick with dust     │    ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  │  and traces...       │    ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  │                      │    ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  │  @Alfa notices the   │    ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  │  markings on the     │    ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  │  wall first...       │    ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  │                      │    ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  └──────────────────────┘                                 │
│                                                            │
│  [Esc] or click background to dismiss                      │
└──────────────────────────────────────────────────────────┘
```

### 4.4 Tier 3: Full Cockpit Overlay (Double-Click)

```
┌──────────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░ (blurred graph background) ░░░░░░░░░░░░  │
│  ┌───────────────┬───────────────┬───────────────────┐   │
│  │ 🎤 Script     │ 💬 Dialogue   │ ⚔️ Combat         │   │
│  │               │               │                   │   │
│  │ The team      │ !@Voss:       │ Encounter:        │   │
│  │ descends into │ "Report,      │ 2x hostiles       │   │
│  │ the lower     │  squad."      │ Surprise round if  │   │
│  │ district...   │               │ Perception fails   │   │
│  │               │ @Alfa:        │                   │   │
│  │               │ "Contact.     │                   │   │
│  │               │  Hostile."    │                   │   │
│  ├───────────────┼───────────────┼───────────────────┤   │
│  │ 🌫️ Vibe       │ 🎵 Soundtrack │ 📝 GM Notes       │   │
│  │               │               │                   │   │
│  │ Oppressive.   │ "Dark Descent" │ If players took   │   │
│  │ Claustro-     │ — start on    │ the south tunnel,  │   │
│  │ phobic. Drip- │ entry.        │ &@Hidden Threat   │   │
│  │ ping sounds.  │               │ already behind     │   │
│  │               │ Switch to     │ them.              │   │
│  │               │ "Combat II"   │                   │   │
│  │               │ on contact.   │                   │   │
│  ├───────────────┼───────────────┼───────────────────┤   │
│  │ 👥 Characters │ 🎲 Dice Rolls │ 🔒 Secrets        │   │
│  │               │               │                   │   │
│  │ @Alfa (lead)  │ Perception vs │ Hidden alcove:     │   │
│  │ @Bravo        │ 45 — detect   │ $@Document with  │   │
│  │ @Charlie      │ ambush        │ coordinates to     │   │
│  │ !@Voss        │               │ ~#Sector 7   │   │
│  │               │ Awareness vs  │                   │   │
│  │ %@Target      │ 30 — notice   │                   │   │
│  │ (x2, hidden)  │ trail         │                   │   │
│  └───────────────┴───────────────┴───────────────────┘   │
│                                                            │
│  [Esc] or click background to dismiss                      │
└──────────────────────────────────────────────────────────┘
```

### 4.5 Playthrough Diff View

```
┌──────────────────────────────────────────────────────────┐
│ Toolbar: [Session Selector ▼] [Toggle Diff Overlay]       │
├────────────────────────────────────┬─────────────────────┤
│                                    │                     │
│   Graph Canvas with color overlay  │  Session Timeline   │
│                                    │                     │
│   🟢 ○ Event (played as planned)  │  1. Briefing ✅     │
│      │                             │  2. Descent ✅      │
│      ▼                             │  3. Ambush 🔵       │
│   🟢 □ Narration                  │     "Players split  │
│      │         │                   │      the team"      │
│      ▼         ▼                   │  4. Discovery ✅    │
│   🔴 △       🔵 ◇                │                     │
│   Combat     Social                │                     │
│   (skipped)  (modified)            │                     │
│                │                   │                     │
│                ▼                   │                     │
│            🟢 ⬡ Invest.          │                     │
│                                    │                     │
└────────────────────────────────────┴─────────────────────┘
```

---

## 5. Development Phases

### Phase 1 — Foundation (MVP)

Core graph editor with custom node shapes and three-tier interaction.

- React + TypeScript + Vite project setup.
- React Flow integration with custom node shapes (circle, square, triangle, diamond, hexagon).
- Scene type selection per node (determines shape).
- Basic node data model with all 11 fields (plain textarea initially).
- Three-tier interaction: single click (select), hold/Alt+click (radial subnodes), double-click (full cockpit).
- Radial subnode display with icons and labels, populated/empty dimming.
- Single-field panel overlay (Tier 2) with blurred background.
- Full cockpit overlay (Tier 3) with blurred background.
- Save/load campaign as JSON (download/upload).
- Light/dark mode toggle.
- Vertical and horizontal scroll direction toggle.

**Exit criteria:** Can create a branching story graph with shaped nodes, drill into node content via the three-tier system, save and reload.

### Phase 2 — Entity System

- Entity registry (CRUD for PCs, NPCs, enemies, objects, locations, secrets).
- TipTap rich text editor replacing plain textareas.
- Entity tag parsing and autocomplete in all text fields.
- Inline entity chip rendering (colored, typed, clickable).
- Entity search: filter graph by entity, highlight nodes.
- Floating legend/cheatsheet panel.
- Full-text search across all node fields.

**Exit criteria:** Can tag entities in scene text, autocomplete works, can filter graph by entity, legend is accessible.

### Phase 3 — Playthrough Tracking & Diff

- Right-click context menu for playthrough status on nodes.
- Playthrough notes field for "modified" nodes.
- Session log data model and UI.
- Diff overlay view with color-coded graph.
- Session timeline sidebar.
- Export session log as markdown.
- Status change markers on entities (+wounded, +dead, etc.).
- Entity status history tracking across nodes.

**Exit criteria:** Can mark nodes during play, view a post-session diff, export a session journal.

### Phase 4 — Advanced Graph Operations

- Drag-and-drop node reordering.
- Multi-select with lasso and Shift+click.
- Cut/copy/paste nodes and branches.
- Subgraph grouping (collapsible named groups).
- Node rewiring / rebase (detach and reattach).
- Arc labels on nodes.
- Edge styling (default, conditional, secret).
- Undo/redo history.

**Exit criteria:** Can freely restructure the story graph with professional-grade editing tools.

### Phase 5 — Polish & Power Features

- Custom field templates (campaign-wide + per-node ad-hoc).
- Image/attachment support in node fields.
- Auto-save with File System Access API.
- PWA configuration for offline use.
- Keyboard shortcuts for all major operations.
- Import/export individual subgraphs between campaigns.
- Export entity registry as markdown codex.
- Performance optimization for large graphs (100+ nodes).

**Exit criteria:** Full feature set as specified, production-quality UX.

---

## 6. Non-Goals (Explicitly Out of Scope)

- **Player-facing view.** GM-only tool. No shared/broadcast mode.
- **Built-in VTT features.** No maps, tokens, or combat grids. Combat and soundtrack are managed in other programs.
- **Character stat sheets.** Entity profiles are narrative-focused, not mechanical.
- **Cloud sync or multi-user.** Single-user, local-first. JSON export covers backup.
- **Dice rolling engine.** The dice roll field stores planned rolls as text, not an interactive roller.
- **Mobile-first design.** Optimized for laptop/desktop with large screens. Not broken on tablet, but not a primary target.

---

## 7. Open Questions

1. **Subgraph collapsing:** Should multi-node branches be collapsible into a single "group" node in prep mode? (Recommended: yes, Phase 4.)
2. **Template nodes:** Pre-built node templates for common scene types (combat encounter, social encounter, investigation)? Would save setup time since scene type already determines shape.
3. **Keyboard-first navigation:** How aggressively should we support keyboard-only operation? (Recommended: full arrow-key navigation + hotkeys for all tiers.)
4. **Export formats:** PDF export of the full story graph? Printable session prep sheets?
5. **Cockpit panel arrangement:** Should the Tier 3 mosaic layout be configurable (drag to rearrange panels), or is a fixed grid sufficient?
6. **Subnode field ordering:** Should the radial positions of field subnodes be consistent across all nodes, or adjustable?

---

*This spec is a living document. Update it as development decisions are made, and log those decisions in `docs/decisions-log.md`.*

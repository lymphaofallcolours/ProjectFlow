import type { GraphTemplate, SceneType, StoryNode, StoryEdge } from './types'
import { createNode, createEdge } from './graph-operations'

type TemplateBlueprint = {
  id: string
  name: string
  description: string
  steps: Array<{
    sceneType: SceneType
    label: string
    offsetX: number
    offsetY: number
  }>
  connections: Array<[number, number]>
}

const BUILTIN_BLUEPRINTS: TemplateBlueprint[] = [
  {
    id: 'linear-adventure',
    name: 'Linear Adventure',
    description: 'Narration → Investigation → Combat → Resolution chain',
    steps: [
      { sceneType: 'narration', label: 'Opening', offsetX: 0, offsetY: 0 },
      { sceneType: 'investigation', label: 'Exploration', offsetX: 250, offsetY: 0 },
      { sceneType: 'combat', label: 'Encounter', offsetX: 500, offsetY: 0 },
      { sceneType: 'social', label: 'Resolution', offsetX: 750, offsetY: 0 },
    ],
    connections: [[0, 1], [1, 2], [2, 3]],
  },
  {
    id: 'branching-choice',
    name: 'Branching Choice',
    description: 'Decision point splitting into two paths that reconverge',
    steps: [
      { sceneType: 'narration', label: 'Setup', offsetX: 0, offsetY: 0 },
      { sceneType: 'social', label: 'Decision', offsetX: 250, offsetY: 0 },
      { sceneType: 'event', label: 'Path A', offsetX: 500, offsetY: -120 },
      { sceneType: 'event', label: 'Path B', offsetX: 500, offsetY: 120 },
      { sceneType: 'narration', label: 'Convergence', offsetX: 750, offsetY: 0 },
    ],
    connections: [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4]],
  },
  {
    id: 'combat-encounter',
    name: 'Combat Encounter',
    description: 'Pre-combat setup, the fight, and aftermath',
    steps: [
      { sceneType: 'narration', label: 'Approach', offsetX: 0, offsetY: 0 },
      { sceneType: 'investigation', label: 'Scouting', offsetX: 250, offsetY: -80 },
      { sceneType: 'combat', label: 'Battle', offsetX: 250, offsetY: 80 },
      { sceneType: 'event', label: 'Aftermath', offsetX: 500, offsetY: 0 },
    ],
    connections: [[0, 1], [0, 2], [1, 2], [2, 3], [1, 3]],
  },
  {
    id: 'social-intrigue',
    name: 'Social Intrigue',
    description: 'Investigation leading to a social confrontation',
    steps: [
      { sceneType: 'narration', label: 'Briefing', offsetX: 0, offsetY: 0 },
      { sceneType: 'investigation', label: 'Clue Gathering', offsetX: 250, offsetY: -80 },
      { sceneType: 'investigation', label: 'Interrogation', offsetX: 250, offsetY: 80 },
      { sceneType: 'social', label: 'Confrontation', offsetX: 500, offsetY: 0 },
      { sceneType: 'event', label: 'Outcome', offsetX: 750, offsetY: 0 },
    ],
    connections: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]],
  },
]

export function buildTemplateFromBlueprint(bp: TemplateBlueprint): GraphTemplate {
  const nodes: StoryNode[] = bp.steps.map((step) =>
    createNode(step.sceneType, { x: step.offsetX, y: step.offsetY }, step.label),
  )
  const edges: StoryEdge[] = bp.connections.map(([from, to]) =>
    createEdge(nodes[from].id, nodes[to].id),
  )
  return {
    id: bp.id,
    name: bp.name,
    description: bp.description,
    category: 'builtin',
    nodes,
    edges,
    createdAt: new Date().toISOString(),
  }
}

export function getBuiltinTemplates(): GraphTemplate[] {
  return BUILTIN_BLUEPRINTS.map(buildTemplateFromBlueprint)
}

export function createCustomTemplate(
  name: string,
  description: string,
  nodes: StoryNode[],
  edges: StoryEdge[],
): GraphTemplate {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    category: 'custom',
    nodes,
    edges,
    createdAt: new Date().toISOString(),
  }
}

import { describe, it, expect } from 'vitest'
import { getBuiltinTemplates, buildTemplateFromBlueprint, createCustomTemplate } from './graph-templates'
import { createNode, createEdge } from './graph-operations'

describe('graph-templates', () => {
  describe('getBuiltinTemplates', () => {
    it('returns 4 built-in templates', () => {
      const templates = getBuiltinTemplates()
      expect(templates).toHaveLength(4)
    })

    it('each template has required fields', () => {
      for (const t of getBuiltinTemplates()) {
        expect(t.id).toBeTruthy()
        expect(t.name).toBeTruthy()
        expect(t.description).toBeTruthy()
        expect(t.category).toBe('builtin')
        expect(t.nodes.length).toBeGreaterThanOrEqual(3)
        expect(t.edges.length).toBeGreaterThanOrEqual(2)
        expect(t.createdAt).toBeTruthy()
      }
    })

    it('all edges reference valid node IDs', () => {
      for (const t of getBuiltinTemplates()) {
        const nodeIds = new Set(t.nodes.map((n) => n.id))
        for (const edge of t.edges) {
          expect(nodeIds.has(edge.source)).toBe(true)
          expect(nodeIds.has(edge.target)).toBe(true)
        }
      }
    })

    it('generates unique node IDs across calls', () => {
      const a = getBuiltinTemplates()
      const b = getBuiltinTemplates()
      const idsA = a.flatMap((t) => t.nodes.map((n) => n.id))
      const idsB = b.flatMap((t) => t.nodes.map((n) => n.id))
      // No overlap between calls
      const overlap = idsA.filter((id) => idsB.includes(id))
      expect(overlap).toHaveLength(0)
    })
  })

  describe('buildTemplateFromBlueprint', () => {
    it('creates nodes with correct positions and labels', () => {
      const t = buildTemplateFromBlueprint({
        id: 'test',
        name: 'Test',
        description: 'A test template',
        steps: [
          { sceneType: 'event', label: 'Start', offsetX: 0, offsetY: 0 },
          { sceneType: 'combat', label: 'Fight', offsetX: 200, offsetY: 0 },
        ],
        connections: [[0, 1]],
      })
      expect(t.nodes).toHaveLength(2)
      expect(t.nodes[0].label).toBe('Start')
      expect(t.nodes[0].sceneType).toBe('event')
      expect(t.nodes[0].position).toEqual({ x: 0, y: 0 })
      expect(t.nodes[1].label).toBe('Fight')
      expect(t.nodes[1].position).toEqual({ x: 200, y: 0 })
      expect(t.edges).toHaveLength(1)
      expect(t.edges[0].source).toBe(t.nodes[0].id)
      expect(t.edges[0].target).toBe(t.nodes[1].id)
    })
  })

  describe('createCustomTemplate', () => {
    it('creates a custom template with unique ID', () => {
      const nodes = [createNode('event', { x: 0, y: 0 }, 'A')]
      const edges = [createEdge(nodes[0].id, nodes[0].id)]
      const t = createCustomTemplate('My Template', 'A custom one', nodes, edges)
      expect(t.id).toBeTruthy()
      expect(t.name).toBe('My Template')
      expect(t.description).toBe('A custom one')
      expect(t.category).toBe('custom')
      expect(t.nodes).toBe(nodes)
      expect(t.edges).toBe(edges)
    })
  })
})

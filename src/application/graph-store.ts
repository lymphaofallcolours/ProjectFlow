import { create } from 'zustand'
import type {
  StoryNode,
  StoryEdge,
  SceneType,
  Position2D,
  ViewportState,
  ScrollDirection,
  NodeFields,
  FieldKey,
  PlaythroughStatus,
} from '@/domain/types'
import {
  createNode,
  createEdge,
  removeNode as removeNodeOp,
  removeEdge as removeEdgeOp,
  updateNodePosition,
  updateNodeLabel,
  updateNodeSceneType,
  updateNodeField,
  duplicateNode,
} from '@/domain/graph-operations'
import {
  setNodePlaythroughStatus as setPlaythroughOp,
  clearNodePlaythroughStatus as clearPlaythroughOp,
} from '@/domain/playthrough-operations'

type GraphState = {
  nodes: Record<string, StoryNode>
  edges: Record<string, StoryEdge>
  viewport: ViewportState
  scrollDirection: ScrollDirection
  selectedNodeId: string | null

  addNode: (sceneType: SceneType, position: Position2D, label?: string) => string
  deleteNode: (id: string) => void
  connectNodes: (sourceId: string, targetId: string, label?: string) => string
  disconnectEdge: (edgeId: string) => void
  moveNode: (id: string, position: Position2D) => void
  renameNode: (id: string, label: string) => void
  changeSceneType: (id: string, sceneType: SceneType) => void
  updateField: (nodeId: string, fieldKey: FieldKey, value: NodeFields[FieldKey]) => void
  duplicateNode: (id: string) => string | null
  setPlaythroughStatus: (nodeId: string, status: PlaythroughStatus, notes?: string) => void
  clearPlaythroughStatus: (nodeId: string) => void
  setViewport: (viewport: ViewportState) => void
  setScrollDirection: (direction: ScrollDirection) => void
  selectNode: (id: string | null) => void
  loadGraph: (
    nodes: Record<string, StoryNode>,
    edges: Record<string, StoryEdge>,
    viewport: ViewportState,
    scrollDirection: ScrollDirection,
  ) => void
  reset: () => void
}

const initialState = {
  nodes: {} as Record<string, StoryNode>,
  edges: {} as Record<string, StoryEdge>,
  viewport: { x: 0, y: 0, zoom: 1 },
  scrollDirection: 'horizontal' as ScrollDirection,
  selectedNodeId: null as string | null,
}

export const useGraphStore = create<GraphState>((set, get) => ({
  ...initialState,

  addNode: (sceneType, position, label) => {
    const node = createNode(sceneType, position, label)
    set((state) => ({ nodes: { ...state.nodes, [node.id]: node } }))
    return node.id
  },

  deleteNode: (id) => {
    set((state) => {
      const result = removeNodeOp(state.nodes, state.edges, id)
      return {
        ...result,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      }
    })
  },

  connectNodes: (sourceId, targetId, label) => {
    const edge = createEdge(sourceId, targetId, label)
    set((state) => ({ edges: { ...state.edges, [edge.id]: edge } }))
    return edge.id
  },

  disconnectEdge: (edgeId) => {
    set((state) => ({ edges: removeEdgeOp(state.edges, edgeId) }))
  },

  moveNode: (id, position) => {
    set((state) => {
      const node = state.nodes[id]
      if (!node) return state
      return { nodes: { ...state.nodes, [id]: updateNodePosition(node, position) } }
    })
  },

  renameNode: (id, label) => {
    set((state) => {
      const node = state.nodes[id]
      if (!node) return state
      return { nodes: { ...state.nodes, [id]: updateNodeLabel(node, label) } }
    })
  },

  changeSceneType: (id, sceneType) => {
    set((state) => {
      const node = state.nodes[id]
      if (!node) return state
      return { nodes: { ...state.nodes, [id]: updateNodeSceneType(node, sceneType) } }
    })
  },

  updateField: (nodeId, fieldKey, value) => {
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      return { nodes: { ...state.nodes, [nodeId]: updateNodeField(node, fieldKey, value) } }
    })
  },

  duplicateNode: (id) => {
    const node = get().nodes[id]
    if (!node) return null
    const offset = 50
    const copy = duplicateNode(node, {
      x: node.position.x + offset,
      y: node.position.y + offset,
    })
    set((state) => ({ nodes: { ...state.nodes, [copy.id]: copy } }))
    return copy.id
  },

  setPlaythroughStatus: (nodeId, status, notes) => {
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      return { nodes: { ...state.nodes, [nodeId]: setPlaythroughOp(node, status, notes) } }
    })
  },

  clearPlaythroughStatus: (nodeId) => {
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      return { nodes: { ...state.nodes, [nodeId]: clearPlaythroughOp(node) } }
    })
  },

  setViewport: (viewport) => set({ viewport }),
  setScrollDirection: (scrollDirection) => set({ scrollDirection }),
  selectNode: (id) => set({ selectedNodeId: id }),

  loadGraph: (nodes, edges, viewport, scrollDirection) => {
    set({ nodes, edges, viewport, scrollDirection, selectedNodeId: null })
  },

  reset: () => set(initialState),
}))

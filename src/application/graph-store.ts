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
  removeNodes as removeNodesOp,
  removeEdge as removeEdgeOp,
  updateNodePosition,
  updateNodeLabel,
  updateNodeSceneType,
  updateNodeField,
  duplicateNode,
  duplicateNodes as duplicateNodesOp,
  extractSubgraph,
  pasteSubgraph,
  updateEdgeStyle as updateEdgeStyleOp,
  updateEdgeLabel as updateEdgeLabelOp,
  updateNodeArcLabel as updateArcLabelOp,
  updateNodeTags as updateNodeTagsOp,
  rewireEdge as rewireEdgeOp,
  transposeNodePositions,
} from '@/domain/graph-operations'
import {
  setNodePlaythroughStatus as setPlaythroughOp,
  clearNodePlaythroughStatus as clearPlaythroughOp,
} from '@/domain/playthrough-operations'
import {
  createGroupNode as createGroupNodeOp,
  addNodesToGroup as addNodesToGroupOp,
  removeNodesFromGroup as removeNodesFromGroupOp,
  deleteGroupKeepChildren as deleteGroupKeepChildrenOp,
  deleteGroupWithChildren as deleteGroupWithChildrenOp,
  toggleGroupCollapsed as toggleGroupCollapsedOp,
  getGroupChildIds,
} from '@/domain/group-operations'
import { createSnapshot } from '@/domain/history-operations'
import { useHistoryStore } from './history-store'
import { useUIStore } from './ui-store'

type GraphState = {
  nodes: Record<string, StoryNode>
  edges: Record<string, StoryEdge>
  viewport: ViewportState
  scrollDirection: ScrollDirection
  selectedNodeIds: Set<string>
  clipboard: { nodes: StoryNode[]; edges: StoryEdge[] } | null

  addNode: (sceneType: SceneType, position: Position2D, label?: string) => string
  deleteNode: (id: string) => void
  deleteSelectedNodes: () => void
  connectNodes: (sourceId: string, targetId: string, label?: string) => string
  disconnectEdge: (edgeId: string) => void
  moveNode: (id: string, position: Position2D) => void
  renameNode: (id: string, label: string) => void
  changeSceneType: (id: string, sceneType: SceneType) => void
  updateField: (nodeId: string, fieldKey: FieldKey, value: NodeFields[FieldKey]) => void
  duplicateNode: (id: string) => string | null
  duplicateSelectedNodes: () => string[]
  setPlaythroughStatus: (nodeId: string, status: PlaythroughStatus, notes?: string) => void
  clearPlaythroughStatus: (nodeId: string) => void
  setViewport: (viewport: ViewportState) => void
  setScrollDirection: (direction: ScrollDirection) => void
  selectNodes: (ids: string[]) => void
  toggleNodeSelection: (id: string) => void
  clearSelection: () => void
  copySelectedNodes: () => void
  cutSelectedNodes: () => void
  pasteClipboard: (offset?: Position2D) => void
  setEdgeStyle: (edgeId: string, style: StoryEdge['style']) => void
  setEdgeLabel: (edgeId: string, label: string | undefined) => void
  setArcLabel: (nodeId: string, arcLabel: string | undefined) => void
  setNodeTags: (nodeId: string, tags: string[]) => void
  rewireEdge: (edgeId: string, newSource?: string, newTarget?: string) => void
  importSubgraph: (nodes: StoryNode[], edges: StoryEdge[]) => void
  createGroup: (sceneType: SceneType, position: Position2D, label?: string) => string
  addToGroup: (groupId: string, nodeIds: string[]) => void
  removeFromGroup: (nodeIds: string[]) => void
  deleteGroup: (groupId: string, cascade: boolean) => void
  toggleGroupCollapsed: (groupId: string) => void
  undo: () => void
  redo: () => void
  pushHistory: () => void
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
  selectedNodeIds: new Set<string>(),
  clipboard: null as { nodes: StoryNode[]; edges: StoryEdge[] } | null,
}

function saveHistory() {
  const { nodes, edges } = useGraphStore.getState()
  useHistoryStore.getState().pushSnapshot(createSnapshot(nodes, edges))
}

export const useGraphStore = create<GraphState>((set, get) => ({
  ...initialState,

  addNode: (sceneType, position, label) => {
    saveHistory()
    const node = createNode(sceneType, position, label)
    set((state) => ({ nodes: { ...state.nodes, [node.id]: node } }))
    return node.id
  },

  deleteNode: (id) => {
    if (!get().nodes[id]) return
    saveHistory()
    if (useUIStore.getState().radialNodeId === id) {
      useUIStore.getState().hideRadialSubnodes()
    }
    set((state) => {
      const result = removeNodeOp(state.nodes, state.edges, id)
      const nextSelected = new Set(state.selectedNodeIds)
      nextSelected.delete(id)
      return { ...result, selectedNodeIds: nextSelected }
    })
  },

  deleteSelectedNodes: () => {
    const ids = Array.from(get().selectedNodeIds)
    if (ids.length === 0) return
    saveHistory()
    const currentRadialId = useUIStore.getState().radialNodeId
    if (currentRadialId && ids.includes(currentRadialId)) {
      useUIStore.getState().hideRadialSubnodes()
    }
    set((state) => {
      const result = removeNodesOp(state.nodes, state.edges, ids)
      return { ...result, selectedNodeIds: new Set<string>() }
    })
  },

  connectNodes: (sourceId, targetId, label) => {
    saveHistory()
    const edge = createEdge(sourceId, targetId, label)
    set((state) => ({ edges: { ...state.edges, [edge.id]: edge } }))
    return edge.id
  },

  disconnectEdge: (edgeId) => {
    if (!get().edges[edgeId]) return
    saveHistory()
    set((state) => ({ edges: removeEdgeOp(state.edges, edgeId) }))
  },

  // moveNode does NOT save history — canvas calls pushHistory() on drag start
  moveNode: (id, position) => {
    set((state) => {
      const node = state.nodes[id]
      if (!node) return state
      const updatedNodes = { ...state.nodes, [id]: updateNodePosition(node, position) }

      // If moving a group, translate all children by the same delta
      if (node.isGroup) {
        const dx = position.x - node.position.x
        const dy = position.y - node.position.y
        const childIds = getGroupChildIds(state.nodes, id)
        for (const childId of childIds) {
          const child = updatedNodes[childId]
          if (child) {
            updatedNodes[childId] = updateNodePosition(child, {
              x: child.position.x + dx,
              y: child.position.y + dy,
            })
          }
        }
      }

      return { nodes: updatedNodes }
    })
  },

  renameNode: (id, label) => {
    if (!get().nodes[id]) return
    saveHistory()
    set((state) => {
      const node = state.nodes[id]
      if (!node) return state
      return { nodes: { ...state.nodes, [id]: updateNodeLabel(node, label) } }
    })
  },

  changeSceneType: (id, sceneType) => {
    if (!get().nodes[id]) return
    saveHistory()
    set((state) => {
      const node = state.nodes[id]
      if (!node) return state
      return { nodes: { ...state.nodes, [id]: updateNodeSceneType(node, sceneType) } }
    })
  },

  updateField: (nodeId, fieldKey, value) => {
    if (!get().nodes[nodeId]) return
    saveHistory()
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      return { nodes: { ...state.nodes, [nodeId]: updateNodeField(node, fieldKey, value) } }
    })
  },

  duplicateNode: (id) => {
    const node = get().nodes[id]
    if (!node) return null
    saveHistory()
    const offset = 50
    const copy = duplicateNode(node, {
      x: node.position.x + offset,
      y: node.position.y + offset,
    })
    set((state) => ({ nodes: { ...state.nodes, [copy.id]: copy } }))
    return copy.id
  },

  duplicateSelectedNodes: () => {
    const state = get()
    const ids = Array.from(state.selectedNodeIds)
    if (ids.length === 0) return []
    saveHistory()
    const { nodes: newNodes, edges: newEdges, idMap } = duplicateNodesOp(
      state.nodes,
      state.edges,
      ids,
      { x: 50, y: 50 },
    )
    const newIds = Object.values(idMap)
    set((s) => ({
      nodes: { ...s.nodes, ...newNodes },
      edges: { ...s.edges, ...newEdges },
      selectedNodeIds: new Set(newIds),
    }))
    return newIds
  },

  setPlaythroughStatus: (nodeId, status, notes) => {
    if (!get().nodes[nodeId]) return
    saveHistory()
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      return { nodes: { ...state.nodes, [nodeId]: setPlaythroughOp(node, status, notes) } }
    })
  },

  clearPlaythroughStatus: (nodeId) => {
    if (!get().nodes[nodeId]) return
    saveHistory()
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      return { nodes: { ...state.nodes, [nodeId]: clearPlaythroughOp(node) } }
    })
  },

  setViewport: (viewport) => set({ viewport }),
  setScrollDirection: (scrollDirection) => {
    const current = get().scrollDirection
    if (current === scrollDirection) return
    saveHistory()
    set((state) => ({
      scrollDirection,
      nodes: transposeNodePositions(state.nodes),
    }))
  },

  selectNodes: (ids) => set({ selectedNodeIds: new Set(ids) }),

  toggleNodeSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedNodeIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedNodeIds: next }
    }),

  clearSelection: () => set({ selectedNodeIds: new Set<string>() }),

  copySelectedNodes: () => {
    const state = get()
    const ids = Array.from(state.selectedNodeIds)
    if (ids.length === 0) return
    const subgraph = extractSubgraph(state.nodes, state.edges, ids)
    set({ clipboard: subgraph })
  },

  cutSelectedNodes: () => {
    const store = get()
    store.copySelectedNodes()
    // deleteSelectedNodes saves history before deleting
    store.deleteSelectedNodes()
  },

  pasteClipboard: (offset) => {
    const { clipboard } = get()
    if (!clipboard || clipboard.nodes.length === 0) return
    saveHistory()
    const pasteOffset = offset ?? { x: 50, y: 50 }
    const { nodes: newNodes, edges: newEdges } = pasteSubgraph(
      clipboard.nodes,
      clipboard.edges,
      pasteOffset,
    )
    const newIds = Object.keys(newNodes)
    set((state) => ({
      nodes: { ...state.nodes, ...newNodes },
      edges: { ...state.edges, ...newEdges },
      selectedNodeIds: new Set(newIds),
    }))
  },

  setEdgeStyle: (edgeId, style) => {
    if (!get().edges[edgeId]) return
    saveHistory()
    set((state) => {
      const edge = state.edges[edgeId]
      if (!edge) return state
      return { edges: { ...state.edges, [edgeId]: updateEdgeStyleOp(edge, style) } }
    })
  },

  setEdgeLabel: (edgeId, label) => {
    if (!get().edges[edgeId]) return
    saveHistory()
    set((state) => {
      const edge = state.edges[edgeId]
      if (!edge) return state
      return { edges: { ...state.edges, [edgeId]: updateEdgeLabelOp(edge, label) } }
    })
  },

  setArcLabel: (nodeId, arcLabel) => {
    if (!get().nodes[nodeId]) return
    saveHistory()
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      return { nodes: { ...state.nodes, [nodeId]: updateArcLabelOp(node, arcLabel) } }
    })
  },

  setNodeTags: (nodeId, tags) => {
    if (!get().nodes[nodeId]) return
    saveHistory()
    set((state) => {
      const node = state.nodes[nodeId]
      if (!node) return state
      return { nodes: { ...state.nodes, [nodeId]: updateNodeTagsOp(node, tags) } }
    })
  },

  rewireEdge: (edgeId, newSource, newTarget) => {
    if (!get().edges[edgeId]) return
    saveHistory()
    set((state) => ({
      edges: rewireEdgeOp(state.edges, edgeId, newSource, newTarget),
    }))
  },

  importSubgraph: (importedNodes, importedEdges) => {
    saveHistory()
    const pasted = pasteSubgraph(importedNodes, importedEdges, { x: 50, y: 50 })
    set((state) => ({
      nodes: { ...state.nodes, ...pasted.nodes },
      edges: { ...state.edges, ...pasted.edges },
      selectedNodeIds: new Set(Object.keys(pasted.nodes)),
    }))
  },

  createGroup: (sceneType, position, label) => {
    saveHistory()
    const group = createGroupNodeOp(sceneType, position, label)
    set((state) => ({ nodes: { ...state.nodes, [group.id]: group } }))
    return group.id
  },

  addToGroup: (groupId, nodeIds) => {
    saveHistory()
    set((state) => ({ nodes: addNodesToGroupOp(state.nodes, groupId, nodeIds) }))
  },

  removeFromGroup: (nodeIds) => {
    saveHistory()
    set((state) => ({ nodes: removeNodesFromGroupOp(state.nodes, nodeIds) }))
  },

  deleteGroup: (groupId, cascade) => {
    if (!get().nodes[groupId]) return
    saveHistory()
    const currentRadialId = useUIStore.getState().radialNodeId
    if (currentRadialId) {
      if (currentRadialId === groupId) {
        useUIStore.getState().hideRadialSubnodes()
      } else if (cascade) {
        const childIds = getGroupChildIds(get().nodes, groupId)
        if (childIds.includes(currentRadialId)) {
          useUIStore.getState().hideRadialSubnodes()
        }
      }
    }
    if (cascade) {
      set((state) => deleteGroupWithChildrenOp(state.nodes, state.edges, groupId))
    } else {
      set((state) => deleteGroupKeepChildrenOp(state.nodes, state.edges, groupId))
    }
  },

  toggleGroupCollapsed: (groupId) => {
    const node = get().nodes[groupId]
    if (!node?.isGroup) return
    set((state) => ({
      nodes: { ...state.nodes, [groupId]: toggleGroupCollapsedOp(node) },
    }))
  },

  undo: () => {
    const { nodes, edges } = get()
    const snapshot = useHistoryStore.getState().popUndo(createSnapshot(nodes, edges))
    if (!snapshot) return
    set({ nodes: snapshot.nodes, edges: snapshot.edges, selectedNodeIds: new Set<string>() })
  },

  redo: () => {
    const { nodes, edges } = get()
    const snapshot = useHistoryStore.getState().popRedo(createSnapshot(nodes, edges))
    if (!snapshot) return
    set({ nodes: snapshot.nodes, edges: snapshot.edges, selectedNodeIds: new Set<string>() })
  },

  pushHistory: () => {
    saveHistory()
  },

  loadGraph: (nodes, edges, viewport, scrollDirection) => {
    set({ nodes, edges, viewport, scrollDirection, selectedNodeIds: new Set<string>() })
  },

  reset: () => set({ ...initialState, selectedNodeIds: new Set<string>() }),
}))

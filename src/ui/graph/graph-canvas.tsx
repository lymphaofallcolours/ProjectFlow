import { useState, useCallback, useRef, useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  SelectionMode,
  useReactFlow,
} from '@xyflow/react'
import type {
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
  NodeMouseHandler,
  OnSelectionChangeFunc,
  EdgeMouseHandler,
} from '@xyflow/react'
import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { StoryNodeComponent } from './story-node'
import { StoryEdgeComponent } from './story-edge'
import { useFlowNodes } from './use-flow-nodes'
import { NodeContextMenu } from './context-menu'
import { EdgeContextMenu } from './edge-context-menu'
import { CanvasContextMenu } from './canvas-context-menu'
import { RadialSubnodes } from '@/ui/overlays/radial-subnodes'
import { HighlightContext } from './highlight-context'
import { useEntityHighlight } from '@/ui/hooks/use-entity-highlight'

// MUST be defined at module level — prevents re-registration on re-render
const nodeTypes = { story: StoryNodeComponent }
const edgeTypes = { story: StoryEdgeComponent }

type ContextMenuState =
  | { type: 'node'; nodeId: string; position: { x: number; y: number } }
  | { type: 'edge'; edgeId: string; position: { x: number; y: number } }
  | { type: 'canvas'; position: { x: number; y: number }; flowPosition: { x: number; y: number } }
  | null

/** Outer wrapper providing the ReactFlow context */
export function GraphCanvas() {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <GraphCanvasInner />
      </ReactFlowProvider>
    </div>
  )
}

/** Inner canvas with access to useReactFlow() */
function GraphCanvasInner() {
  const { flowNodes: storeNodes, flowEdges } = useFlowNodes()
  const { screenToFlowPosition } = useReactFlow()
  const moveNode = useGraphStore((s) => s.moveNode)
  const pushHistory = useGraphStore((s) => s.pushHistory)
  const selectNodes = useGraphStore((s) => s.selectNodes)
  const clearSelection = useGraphStore((s) => s.clearSelection)
  const connectNodes = useGraphStore((s) => s.connectNodes)
  const setViewport = useGraphStore((s) => s.setViewport)
  const hideRadialSubnodes = useUIStore((s) => s.hideRadialSubnodes)
  const showRadialSubnodes = useUIStore((s) => s.showRadialSubnodes)
  const radialNodeId = useUIStore((s) => s.radialNodeId)
  const canvasBackground = useUIStore((s) => s.canvasBackground)
  const openCockpit = useUIStore((s) => s.openCockpit)
  const radialNodeExists = useGraphStore((s) => radialNodeId ? !!s.nodes[radialNodeId] : false)

  // Compute entity highlight set once for all nodes
  const highlightSet = useEntityHighlight()

  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)

  // Drag position overrides — only populated while actively dragging.
  // Merged with store nodes via useMemo to give React Flow smooth visual updates.
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({})
  const isDraggingRef = useRef(false)

  // Merge store nodes with in-flight drag positions for smooth rendering.
  // Skip stale overrides (store already has final position) to prevent blink on drag end.
  const displayNodes = useMemo(() => {
    const keys = Object.keys(dragPositions)
    if (keys.length === 0) return storeNodes
    return storeNodes.map((node) => {
      const dragPos = dragPositions[node.id]
      if (!dragPos) return node
      if (node.position.x === dragPos.x && node.position.y === dragPos.y) return node
      return { ...node, position: dragPos }
    })
  }, [storeNodes, dragPositions])

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      // Handle selection changes — required in controlled mode for the `selected`
      // class to be applied by React Flow's NodeWrapper.
      const selectChanges = changes.filter((c) => c.type === 'select')
      if (selectChanges.length > 0) {
        const current = new Set(useGraphStore.getState().selectedNodeIds)
        for (const change of selectChanges) {
          if (change.type === 'select') {
            if (change.selected) current.add(change.id)
            else current.delete(change.id)
          }
        }
        selectNodes(Array.from(current))
      }

      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          if (change.dragging) {
            // During drag: update local override for smooth visual movement
            setDragPositions((prev) => ({ ...prev, [change.id]: change.position! }))
            if (!isDraggingRef.current) {
              isDraggingRef.current = true
              pushHistory()
            }
          } else if (isDraggingRef.current) {
            // Drag ended: persist to Zustand first, defer clearing overrides
            // to avoid a blink frame where store hasn't updated yet.
            isDraggingRef.current = false
            moveNode(change.id, change.position)
            requestAnimationFrame(() => setDragPositions({}))
          }
        }
      }
    },
    [moveNode, pushHistory, selectNodes],
  )

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes }) => {
      const ids = nodes.map((n) => n.id)
      selectNodes(ids)
      const currentRadialId = useUIStore.getState().radialNodeId
      if (currentRadialId && !ids.includes(currentRadialId)) {
        hideRadialSubnodes()
      }
    },
    [selectNodes, hideRadialSubnodes],
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    () => {},
    [],
  )

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        connectNodes(connection.source, connection.target)
      }
    },
    [connectNodes],
  )

  const onPaneClick = useCallback(() => {
    clearSelection()
    setContextMenu(null)
    hideRadialSubnodes()
  }, [clearSelection, hideRadialSubnodes])

  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault()
      setContextMenu({
        type: 'node',
        nodeId: node.id,
        position: { x: event.clientX, y: event.clientY },
      })
    },
    [],
  )

  const onEdgeContextMenu: EdgeMouseHandler = useCallback(
    (event, edge) => {
      event.preventDefault()
      setContextMenu({
        type: 'edge',
        edgeId: edge.id,
        position: { x: event.clientX, y: event.clientY },
      })
    },
    [],
  )

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault()
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      setContextMenu({
        type: 'canvas',
        position: { x: event.clientX, y: event.clientY },
        flowPosition: flowPos,
      })
    },
    [screenToFlowPosition],
  )

  const onNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      if (event.shiftKey) {
        showRadialSubnodes(node.id)
      } else {
        const currentRadialId = useUIStore.getState().radialNodeId
        if (currentRadialId && currentRadialId !== node.id) {
          hideRadialSubnodes()
        }
      }
    },
    [showRadialSubnodes, hideRadialSubnodes],
  )

  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      hideRadialSubnodes()
      openCockpit(node.id)
    },
    [hideRadialSubnodes, openCockpit],
  )

  return (
    <HighlightContext.Provider value={highlightSet}>
      <ReactFlow
        nodes={displayNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onNodeDoubleClick={onNodeDoubleClick}
        onMoveEnd={(_event, viewport) => setViewport(viewport)}
        selectionKeyCode={null}
        multiSelectionKeyCode="Control"
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        panOnScroll
        deleteKeyCode={null}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'story',
          markerEnd: { type: 'arrowclosed' as const, color: 'var(--color-border)' },
        }}
        className="bg-canvas"
      >
        {canvasBackground !== 'none' && (
          <Background
            variant={canvasBackground === 'grid' ? BackgroundVariant.Lines : BackgroundVariant.Dots}
            gap={24}
            size={canvasBackground === 'grid' ? 1 : 2.5}
            color="var(--color-text-muted)"
          />
        )}
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={() => 'var(--color-surface-glass-border)'}
          maskColor="var(--color-surface-overlay)"
          pannable
          zoomable
        />
        {/* Shared SVG defs — filters used by all nodes */}
        <svg>
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-edge)" />
            </marker>

            {/* Glass reflection highlight */}
            <linearGradient id="highlight-sheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="50%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* Glow filter for selection/diff rings */}
            <filter id="node-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </ReactFlow>

      {/* Context menus (rendered outside ReactFlow to avoid z-index issues) */}
      {contextMenu?.type === 'node' && (
        <NodeContextMenu
          nodeId={contextMenu.nodeId}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}
      {contextMenu?.type === 'edge' && (
        <EdgeContextMenu
          edgeId={contextMenu.edgeId}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}
      {contextMenu?.type === 'canvas' && (
        <CanvasContextMenu
          position={contextMenu.position}
          flowPosition={contextMenu.flowPosition}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Radial subnodes — rendered here for React Flow context access */}
      {radialNodeId && radialNodeExists && <RadialSubnodes nodeId={radialNodeId} />}
    </HighlightContext.Provider>
  )
}

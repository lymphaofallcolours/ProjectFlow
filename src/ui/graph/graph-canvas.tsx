import { useState, useCallback, useRef } from 'react'
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
  NodeChange,
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
  const { flowNodes, flowEdges } = useFlowNodes()
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
  const openCockpit = useUIStore((s) => s.openCockpit)

  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)

  // Track whether we're in a drag to avoid duplicate snapshots
  const isDraggingRef = useRef(false)

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          if (change.dragging && !isDraggingRef.current) {
            isDraggingRef.current = true
          }
          if (!change.dragging && isDraggingRef.current) {
            isDraggingRef.current = false
            pushHistory()
            moveNode(change.id, change.position)
          }
        }
      }
    },
    [moveNode, pushHistory],
  )

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes }) => {
      const ids = nodes.map((n) => n.id)
      selectNodes(ids)
    },
    [selectNodes],
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
      if (event.altKey) {
        showRadialSubnodes(node.id)
      }
    },
    [showRadialSubnodes],
  )

  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      hideRadialSubnodes()
      openCockpit(node.id)
    },
    [hideRadialSubnodes, openCockpit],
  )

  return (
    <>
      <ReactFlow
        nodes={flowNodes}
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
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        deleteKeyCode={null}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'story',
          markerEnd: { type: 'arrowclosed' as const, color: 'var(--color-border)' },
        }}
        className="bg-canvas"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--color-border)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={() => 'var(--color-surface-glass-border)'}
          maskColor="var(--color-surface-overlay)"
          pannable
          zoomable
        />
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
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-muted)" />
            </marker>
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
      {radialNodeId && <RadialSubnodes nodeId={radialNodeId} />}
    </>
  )
}

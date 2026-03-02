import { useState, useCallback } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
} from '@xyflow/react'
import type {
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeChange,
  EdgeChange,
  Connection,
  NodeMouseHandler,
} from '@xyflow/react'
import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { StoryNodeComponent } from './story-node'
import { StoryEdgeComponent } from './story-edge'
import { useFlowNodes } from './use-flow-nodes'
import { NodeContextMenu } from './context-menu'
import { CanvasContextMenu } from './canvas-context-menu'

// MUST be defined at module level — prevents re-registration on re-render
const nodeTypes = { story: StoryNodeComponent }
const edgeTypes = { story: StoryEdgeComponent }

type ContextMenuState =
  | { type: 'node'; nodeId: string; position: { x: number; y: number } }
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
  const selectNode = useGraphStore((s) => s.selectNode)
  const connectNodes = useGraphStore((s) => s.connectNodes)
  const setViewport = useGraphStore((s) => s.setViewport)
  const hideRadialSubnodes = useUIStore((s) => s.hideRadialSubnodes)
  const openCockpit = useUIStore((s) => s.openCockpit)

  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          moveNode(change.id, change.position)
        }
        if (change.type === 'select' && change.selected) {
          selectNode(change.id)
        }
      }
    },
    [moveNode, selectNode],
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (_changes: EdgeChange[]) => {},
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
    selectNode(null)
    setContextMenu(null)
    hideRadialSubnodes()
  }, [selectNode, hideRadialSubnodes])

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
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onNodeDoubleClick={onNodeDoubleClick}
        onMoveEnd={(_event, viewport) => setViewport(viewport)}
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
      {contextMenu?.type === 'canvas' && (
        <CanvasContextMenu
          position={contextMenu.position}
          flowPosition={contextMenu.flowPosition}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}

import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from '@xyflow/react'
import type { OnNodesChange, OnEdgesChange, OnConnect, NodeChange, EdgeChange, Connection } from '@xyflow/react'
import { useGraphStore } from '@/application/graph-store'
import { StoryNodeComponent } from './story-node'
import { StoryEdgeComponent } from './story-edge'
import { useFlowNodes } from './use-flow-nodes'

// MUST be defined at module level — prevents re-registration on re-render
const nodeTypes = { story: StoryNodeComponent }
const edgeTypes = { story: StoryEdgeComponent }

export function GraphCanvas() {
  const { flowNodes, flowEdges } = useFlowNodes()
  const moveNode = useGraphStore((s) => s.moveNode)
  const selectNode = useGraphStore((s) => s.selectNode)
  const connectNodes = useGraphStore((s) => s.connectNodes)
  const setViewport = useGraphStore((s) => s.setViewport)

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging) {
          moveNode(change.id, change.position)
        }
        if (change.type === 'select') {
          if (change.selected) {
            selectNode(change.id)
          }
        }
      }
    },
    [moveNode, selectNode],
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (_changes: EdgeChange[]) => {
      // Edge changes handled via context menu in later commits
    },
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
  }, [selectNode])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
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

        {/* Custom arrow marker for edges */}
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
    </div>
  )
}

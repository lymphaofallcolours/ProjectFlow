import type { ReactNode } from 'react'
import type {
  StoryNode,
  FieldKey,
  RichContent,
  DialogueEntry,
  SoundtrackCue,
  DiceRollEntry,
  ConditionEntry,
  CustomField,
} from '@/domain/types'
import { FIELD_DEFINITIONS } from '@/domain/types'
import { useGraphStore } from '@/application/graph-store'
import { FieldIcon } from './field-icon'

type FieldReadViewProps = {
  node: StoryNode
  fieldKey: FieldKey
}

/** Read-only rendered view for all field types. Lightweight — no TipTap instantiation. */
export function FieldReadView({ node, fieldKey }: FieldReadViewProps) {
  switch (fieldKey) {
    case 'script':
    case 'gmNotes':
    case 'vibe':
    case 'events':
    case 'combat':
    case 'characters':
    case 'secrets':
      return <RichContentReadView value={node.fields[fieldKey]} />
    case 'dialogues':
      return <DialogueReadView value={node.fields.dialogues} />
    case 'soundtrack':
      return <SoundtrackReadView value={node.fields.soundtrack} />
    case 'diceRolls':
      return <DiceRollReadView value={node.fields.diceRolls} />
    case 'conditions':
      return <ConditionsReadView value={node.fields.conditions} nodeId={node.id} />
    case 'custom':
      return <CustomFieldReadView value={node.fields.custom} />
  }
}

const FIELD_LINK_REGEX = /\/\?([A-Za-z][A-Za-z ]*)/g

function renderFieldLinks(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const regex = new RegExp(FIELD_LINK_REGEX.source, FIELD_LINK_REGEX.flags)

  while ((match = regex.exec(text)) !== null) {
    const label = match[1].trim()
    const fieldDef = FIELD_DEFINITIONS.find(
      (f) => f.label.toLowerCase() === label.toLowerCase(),
    )
    if (!fieldDef) continue

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <span
        key={match.index}
        className="inline-flex items-center gap-0.5 px-1 py-0 rounded"
        style={{
          background: `color-mix(in srgb, ${fieldDef.color} 15%, transparent)`,
          color: fieldDef.color,
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          verticalAlign: 'baseline',
        }}
      >
        <FieldIcon name={fieldDef.icon} size={10} />
        {fieldDef.label}
      </span>,
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts.length > 0 ? parts : [text]
}

function RichContentReadView({ value }: { value: RichContent }) {
  if (!value.markdown.trim()) {
    return <span className="text-xs text-text-muted italic">Empty</span>
  }

  return (
    <div
      className="text-[13px] leading-[1.65] text-text-primary whitespace-pre-wrap break-words"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {renderFieldLinks(value.markdown)}
    </div>
  )
}

function DialogueReadView({ value }: { value: DialogueEntry[] }) {
  return (
    <div className="space-y-2">
      {value.map((entry, i) => (
        <div key={i} className="flex gap-2 items-start">
          {entry.entityRef && (
            <span
              className="shrink-0 text-[10px] font-bold tracking-wide uppercase
                px-1.5 py-0.5 rounded-md mt-0.5"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-entity-npc)',
                background: 'color-mix(in srgb, var(--color-entity-npc) 10%, transparent)',
              }}
            >
              {entry.entityRef}
            </span>
          )}
          <div className="flex-1">
            <span className="text-[13px] text-text-primary leading-snug">{entry.line}</span>
            {entry.direction && (
              <span className="text-[11px] text-text-muted italic ml-1.5">
                ({entry.direction})
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function SoundtrackReadView({ value }: { value: SoundtrackCue[] }) {
  return (
    <div className="space-y-2">
      {value.map((cue, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span
            className="w-1 h-1 rounded-full shrink-0 mt-[7px]"
            style={{ background: 'var(--color-text-muted)' }}
          />
          <div className="min-w-0">
            <div
              className="text-[13px] text-text-primary font-medium"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {cue.trackName}
            </div>
            {cue.note && (
              <div className="text-[11px] text-text-muted leading-snug mt-0.5">
                {cue.note}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function DiceRollReadView({ value }: { value: DiceRollEntry[] }) {
  return (
    <div className="space-y-1.5">
      {value.map((roll, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] text-text-primary">{roll.description}</span>
          {roll.formula && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md
                text-text-secondary bg-surface-alt"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {roll.formula}
            </span>
          )}
          {roll.result && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{
                color: 'var(--color-status-played)',
                background: 'color-mix(in srgb, var(--color-status-played) 12%, transparent)',
              }}
            >
              {roll.result}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function ConditionsReadView({ value, nodeId }: { value: ConditionEntry[]; nodeId: string }) {
  const edges = useGraphStore((s) => s.edges)
  const nodes = useGraphStore((s) => s.nodes)

  return (
    <div className="space-y-1.5">
      {value.map((cond, i) => {
        const targetEdge = cond.targetEdgeId ? edges[cond.targetEdgeId] : undefined
        const targetNode = targetEdge ? nodes[targetEdge.target === nodeId ? targetEdge.source : targetEdge.target] : undefined

        return (
          <div key={i}>
            <div className="flex items-center gap-2">
              <span
                className="text-[13px] shrink-0"
                title={cond.status}
              >
                {cond.status === 'met' ? '●' : cond.status === 'unmet' ? '○' : '?'}
              </span>
              <span
                className="text-[13px] text-text-primary"
                style={{
                  color: cond.status === 'met'
                    ? 'var(--color-status-played)'
                    : cond.status === 'unknown'
                      ? '#d97706'
                      : undefined,
                }}
              >
                {cond.description}
              </span>
              {targetNode && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0"
                  style={{
                    color: 'var(--color-text-secondary)',
                    background: 'color-mix(in srgb, var(--color-border) 40%, transparent)',
                  }}
                >
                  → {targetNode.label}
                </span>
              )}
            </div>
            {cond.notes && (
              <div className="text-[11px] text-text-muted leading-snug mt-0.5 ml-5">
                {cond.notes}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CustomFieldReadView({ value }: { value: CustomField[] }) {
  return (
    <div className="space-y-2.5">
      {value.map((field, i) => (
        <div key={i}>
          <div
            className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {field.label}
          </div>
          <RichContentReadView value={field.content} />
        </div>
      ))}
    </div>
  )
}

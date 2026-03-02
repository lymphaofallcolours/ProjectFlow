import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
} from 'react'
import type { Entity, EntityType } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'

type SuggestionItem = {
  id: string
  name: string
  type: EntityType
  isCreate?: boolean
}

type EntitySuggestionListProps = {
  items: SuggestionItem[]
  command: (item: SuggestionItem) => void
}

export type EntitySuggestionListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const EntitySuggestionList = forwardRef<
  EntitySuggestionListRef,
  EntitySuggestionListProps
>(function EntitySuggestionList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index]
      if (item) command(item)
    },
    [items, command],
  )

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + items.length - 1) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  if (items.length === 0) return null

  return (
    <div
      className="glass-panel rounded-lg shadow-lg overflow-hidden min-w-[180px] max-h-[200px]
        overflow-y-auto text-xs"
    >
      {items.map((item, index) => {
        const config = ENTITY_TYPE_CONFIGS.find((c) => c.type === item.type)
        const isSelected = index === selectedIndex

        return (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-left cursor-pointer
              transition-colors duration-75
              ${isSelected ? 'bg-surface-overlay text-text-primary' : 'text-text-secondary hover:bg-surface-glass'}`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: config?.color }}
            />
            <span className="truncate">
              {item.isCreate ? `Create "${item.name}"` : item.name}
            </span>
            {item.isCreate && (
              <span className="ml-auto text-text-muted text-[10px]">
                {config?.label}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
})

export function buildSuggestionItems(
  query: string,
  entities: Entity[],
  entityType: EntityType,
): SuggestionItem[] {
  const lowerQuery = query.toLowerCase()
  const filtered: SuggestionItem[] = entities
    .filter(
      (e) =>
        e.type === entityType &&
        e.name.toLowerCase().includes(lowerQuery),
    )
    .map((e) => ({ id: e.id, name: e.name, type: e.type }))

  // Add "create new" option if no exact match
  if (
    query.length > 0 &&
    !filtered.some((e) => e.name.toLowerCase() === lowerQuery)
  ) {
    filtered.push({
      id: `create-${query}`,
      name: query,
      type: entityType,
      isCreate: true,
    })
  }

  return filtered
}

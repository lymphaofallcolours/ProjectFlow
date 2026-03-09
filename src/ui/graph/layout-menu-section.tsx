import {
  LayoutGrid,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  GripHorizontal,
  GripVertical,
} from 'lucide-react'
import type { Alignment, DistributeDirection } from '@/domain/align-distribute'
import { MenuItem } from './context-menu'

type LayoutMenuSectionProps = {
  selectedCount: number
  onAutoArrange: () => void
  onAlign: (alignment: Alignment) => void
  onDistribute: (direction: DistributeDirection) => void
  onClose: () => void
}

export function LayoutMenuSection({
  selectedCount,
  onAutoArrange,
  onAlign,
  onDistribute,
  onClose,
}: LayoutMenuSectionProps) {
  return (
    <>
      <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
        Layout
      </div>
      <MenuItem
        icon={<LayoutGrid size={14} className="text-text-muted" />}
        label="Auto-Arrange"
        onClick={() => { onAutoArrange(); onClose() }}
      />

      <MenuItem
        icon={<AlignStartVertical size={14} className="text-text-muted" />}
        label="Align Left"
        onClick={() => { onAlign('left'); onClose() }}
      />
      <MenuItem
        icon={<AlignCenterVertical size={14} className="text-text-muted" />}
        label="Align Center"
        onClick={() => { onAlign('center'); onClose() }}
      />
      <MenuItem
        icon={<AlignEndVertical size={14} className="text-text-muted" />}
        label="Align Right"
        onClick={() => { onAlign('right'); onClose() }}
      />
      <MenuItem
        icon={<AlignStartHorizontal size={14} className="text-text-muted" />}
        label="Align Top"
        onClick={() => { onAlign('top'); onClose() }}
      />
      <MenuItem
        icon={<AlignCenterHorizontal size={14} className="text-text-muted" />}
        label="Align Middle"
        onClick={() => { onAlign('middle'); onClose() }}
      />
      <MenuItem
        icon={<AlignEndHorizontal size={14} className="text-text-muted" />}
        label="Align Bottom"
        onClick={() => { onAlign('bottom'); onClose() }}
      />

      {selectedCount >= 3 && (
        <>
          <MenuItem
            icon={<GripHorizontal size={14} className="text-text-muted" />}
            label="Distribute Horizontal"
            onClick={() => { onDistribute('horizontal'); onClose() }}
          />
          <MenuItem
            icon={<GripVertical size={14} className="text-text-muted" />}
            label="Distribute Vertical"
            onClick={() => { onDistribute('vertical'); onClose() }}
          />
        </>
      )}
    </>
  )
}

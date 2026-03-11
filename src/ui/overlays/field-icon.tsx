import type { LucideProps } from 'lucide-react'
import {
  Mic,
  MessageSquare,
  StickyNote,
  Cloud,
  Music,
  Zap,
  Swords,
  Users,
  Dice5,
  Lock,
  Sparkles,
  BookOpen,
  Star,
  Heart,
  Shield,
  Flag,
  MapPin,
  Clock,
  Eye,
  Scroll,
  Flame,
  LayoutTemplate,
  GitBranch,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Mic,
  MessageSquare,
  StickyNote,
  Cloud,
  Music,
  Zap,
  Swords,
  Users,
  Dice5,
  Lock,
  Sparkles,
  BookOpen,
  Star,
  Heart,
  Shield,
  Flag,
  MapPin,
  Clock,
  Eye,
  Scroll,
  Flame,
  LayoutTemplate,
  GitBranch,
}

export function FieldIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICON_MAP[name]
  if (!Icon) return null
  return <Icon {...props} />
}

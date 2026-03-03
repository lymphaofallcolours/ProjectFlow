import { createContext } from 'react'

/**
 * Provides a set of node IDs that match the current entity highlight filter.
 * null = no filter active (all nodes normal), Set<string> = highlighted node IDs.
 */
export const HighlightContext = createContext<Set<string> | null>(null)

import { create } from 'zustand'
import type { Campaign } from '@/domain/types'

type CampaignState = {
  id: string | null
  name: string
  description: string
  createdAt: string | null
  updatedAt: string | null
  schemaVersion: number

  setName: (name: string) => void
  setDescription: (description: string) => void
  loadCampaign: (campaign: Campaign) => void
  reset: () => void
}

const initialState = {
  id: null as string | null,
  name: 'Untitled Campaign',
  description: '',
  createdAt: null as string | null,
  updatedAt: null as string | null,
  schemaVersion: 1,
}

export const useCampaignStore = create<CampaignState>((set) => ({
  ...initialState,

  setName: (name) => set({ name, updatedAt: new Date().toISOString() }),
  setDescription: (description) => set({ description, updatedAt: new Date().toISOString() }),

  loadCampaign: (campaign) => set({
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    schemaVersion: campaign.schemaVersion,
  }),

  reset: () => set(initialState),
}))

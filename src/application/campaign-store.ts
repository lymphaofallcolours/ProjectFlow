import { create } from 'zustand'
import type { Campaign, CustomFieldTemplate } from '@/domain/types'
import {
  createTemplate as domainCreateTemplate,
  updateTemplate as domainUpdateTemplate,
  deleteTemplate as domainDeleteTemplate,
} from '@/domain/template-operations'

type CampaignState = {
  id: string | null
  name: string
  description: string
  createdAt: string | null
  updatedAt: string | null
  schemaVersion: number
  customFieldTemplates: CustomFieldTemplate[]

  setName: (name: string) => void
  setDescription: (description: string) => void
  loadCampaign: (campaign: Campaign) => void
  loadTemplates: (templates: CustomFieldTemplate[]) => void
  addTemplate: (label: string, icon: string, description?: string) => string
  updateTemplate: (id: string, updates: Partial<Pick<CustomFieldTemplate, 'label' | 'icon' | 'description'>>) => void
  removeTemplate: (id: string) => void
  reset: () => void
}

const initialState = {
  id: null as string | null,
  name: 'Untitled Campaign',
  description: '',
  createdAt: null as string | null,
  updatedAt: null as string | null,
  schemaVersion: 1,
  customFieldTemplates: [] as CustomFieldTemplate[],
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
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
    customFieldTemplates: campaign.customFieldTemplates ?? [],
  }),

  loadTemplates: (templates) => set({ customFieldTemplates: templates }),

  addTemplate: (label, icon, description) => {
    const template = domainCreateTemplate(label, icon, description)
    set({ customFieldTemplates: [...get().customFieldTemplates, template] })
    return template.id
  },

  updateTemplate: (id, updates) => {
    set({
      customFieldTemplates: get().customFieldTemplates.map((t) =>
        t.id === id ? domainUpdateTemplate(t, updates) : t,
      ),
    })
  },

  removeTemplate: (id) => {
    set({
      customFieldTemplates: domainDeleteTemplate(get().customFieldTemplates, id),
    })
  },

  reset: () => set(initialState),
}))

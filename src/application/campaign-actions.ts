import type { Campaign } from '@/domain/types'
import { createCampaign } from '@/domain/campaign-operations'
import { serializeCampaign, deserializeCampaign } from '@/infrastructure/serialization'
import { saveToFile, loadFromFile } from '@/infrastructure/file-io'
import { useGraphStore } from './graph-store'
import { useCampaignStore } from './campaign-store'

export function assembleCampaign(): Campaign {
  const graph = useGraphStore.getState()
  const campaign = useCampaignStore.getState()

  const base = createCampaign(campaign.name)
  return {
    ...base,
    id: campaign.id ?? base.id,
    description: campaign.description,
    createdAt: campaign.createdAt ?? base.createdAt,
    updatedAt: new Date().toISOString(),
    graph: {
      nodes: graph.nodes,
      edges: graph.edges,
      viewport: graph.viewport,
      scrollDirection: graph.scrollDirection,
    },
    schemaVersion: campaign.schemaVersion,
  }
}

export function hydrateCampaign(campaign: Campaign): void {
  useGraphStore.getState().loadGraph(
    campaign.graph.nodes,
    campaign.graph.edges,
    campaign.graph.viewport,
    campaign.graph.scrollDirection,
  )
  useCampaignStore.getState().loadCampaign(campaign)
}

export async function saveCampaignAction(): Promise<void> {
  const campaign = assembleCampaign()
  const json = serializeCampaign(campaign)
  const filename = `${campaign.name.replace(/[^a-zA-Z0-9-_ ]/g, '')}.json`
  await saveToFile(json, filename)
}

export async function loadCampaignAction(): Promise<boolean> {
  const json = await loadFromFile()
  if (!json) return false

  const campaign = deserializeCampaign(json)
  hydrateCampaign(campaign)
  return true
}

export function newCampaignAction(name: string): void {
  useGraphStore.getState().reset()
  useCampaignStore.getState().reset()
  useCampaignStore.getState().setName(name)
}

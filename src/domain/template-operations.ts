// Pure template operations — ZERO framework imports
import type { CustomFieldTemplate, CustomField } from './types'
import { createEmptyRichContent } from './graph-operations'

export function createTemplate(
  label: string,
  icon: string,
  description?: string,
): CustomFieldTemplate {
  return {
    id: crypto.randomUUID(),
    label,
    icon,
    description,
  }
}

export function updateTemplate(
  template: CustomFieldTemplate,
  updates: Partial<Pick<CustomFieldTemplate, 'label' | 'icon' | 'description'>>,
): CustomFieldTemplate {
  return { ...template, ...updates }
}

export function deleteTemplate(
  templates: CustomFieldTemplate[],
  templateId: string,
): CustomFieldTemplate[] {
  return templates.filter((t) => t.id !== templateId)
}

export function instantiateTemplate(template: CustomFieldTemplate): CustomField {
  return {
    label: template.label,
    content: createEmptyRichContent(),
    templateId: template.id,
  }
}

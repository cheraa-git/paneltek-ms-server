import { Meta } from './types'

export interface ProcessingOrder {
  meta: Meta
  id: string
  accountId: string
  updated: string
  name: string
  moment: string
  organization: { meta: Meta }
  attributes?: { meta: Meta, id: string, name: string, type: string, value: string }[]
  positions: { meta: Meta }
  quantity: number
  processingPlan: { meta: Meta }
}

import { Attribute, Meta } from './types'
import { Processing } from './processing.types'

export interface ProcessingOrder {
  meta: Meta
  id: string
  accountId: string
  updated: string
  name: string
  moment: string
  organization: { meta: Meta }
  attributes?: Attribute[]
  positions: { meta: Meta }
  quantity: number
  processingPlan: { meta: Meta }
  processings?: Processing[]
}

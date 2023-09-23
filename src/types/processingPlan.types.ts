import { Meta } from './types'

export interface ProcessingPlan {
  meta: Meta
  id: string
  accountId: string
  updated: string
  name: string
  description: string
  archived: boolean,
  pathName: string
  cost: number
  materials: {
    meta: Meta
  },
  products: {
    meta: Meta
  }
}

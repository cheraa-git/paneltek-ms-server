import { Meta } from './types'

export type PanelType = 'кровельная ППС' | 'кровельная МВ' | 'стеновая ППС' | 'стеновая МВ'

export type ProductType = PanelType | 'фасонное изделие'

export type PanelWidth = '1200' | '1000'

export type FacingLength = '2000' | '2500' | '3000'

export interface Modification {
  meta: Meta
  id: string
  accountId: string
  updated: string
  name: string
  code: string
  archived: boolean,
  characteristics: { meta: Meta, id: string, name: string, value: string }[]
  product: { meta: Meta }
}

export interface OrderPositionWithAssortment {
  meta: Meta,
  id: string
  accountId: string
  quantity: number
  price: number
  discount: number
  vat: number
  vatEnabled: boolean
  assortment: Modification
  shipped: number
  reserve: number
}

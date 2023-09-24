import { Attribute, Meta } from './types'

export interface OrderPositionsMeta {
  'href': string
  'type': string
  'mediaType': 'application/json',
  'size': number
  'limit': number
  'offset': number
}

export type OrderStateName =
  'Выставлен счёт'
  | 'Запуск в производство'
  | 'Принят в работу'
  | 'В производстве'
  | 'Готов к выдаче'
  | 'Частично готово'
  | 'Частично отгружено'
  | 'Отгружен'
  | 'Резерв'
  | 'Возврат'
  | 'Отменен'
  | 'Рекламация'

export interface OrderState {
  meta: Meta
  id: string
  accountId: string
  name: OrderStateName
  color: number,
  stateType: 'Regular' | 'Successful' | 'Unsuccessful',
  entityType: 'customerorder'
}

export interface OrderOwner {
  meta: Meta
}

export interface OrderStore {
  meta: Meta
}

export interface OrderProject {
  meta: Meta
}

export interface OrderAgent {
  meta: Meta
}

export interface OrderOrganization {
  meta: Meta
}


export interface Order {
  'meta': Meta
  'id': string
  'accountId': string
  'owner': Pick<OrderOwner, 'meta'>
  'shared': boolean,
  'updated': string
  'name': string
  'moment': string
  'sum': number
  'store': Pick<OrderStore, 'meta'>
  'project'?: Pick<OrderProject, 'meta'>
  'agent': Pick<OrderAgent, 'meta'>
  'organization': Pick<OrderOrganization, 'meta'>
  'state': Pick<OrderState, 'meta'>
  'created': string
  'printed': boolean
  'published': boolean
  'positions': {
    'meta': OrderPositionsMeta
  },
  'shipmentAddress': string
  attributes?: Attribute[]
  deliveryPlannedMoment?: string
}



export type ServiceResponse<DataType = any> = Promise<{ data?: DataType, error?: { message: string, data: any } }>

export interface Meta {
  href: string
  metadataHref: string
  type: string
  mediaType: string
}

export interface Attribute {
  meta: Meta
  id: string
  name: string
  type: string
  value: string
}



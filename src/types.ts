export type IReportType = 'processing_order'

export interface IReport {
  id: string
  title: string
  status: 'pending' | 'cancelled' | 'completed'
  type: IReportType
  url?: string
  createdAt: number
  completedAt?: number
  length?: number
}


export type ServiceResponse<DataType = any> = Promise<{ data?: DataType, error?: { message: string, data: any } }>


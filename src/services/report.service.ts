import { firebaseHttp } from './http.service'
import { IReport } from '../types'

export const reportService = {
  get: async (): Promise<IReport[]> => {
    const { data } = await firebaseHttp.get('/reports')
    return data
  },
  create: async (report: IReport): Promise<IReport> => {
    const { data } = await firebaseHttp.put(`/reports/${report.id}`, report)
    return data
  },
  complete: async (reportId: string, url: string): Promise<IReport> => {
    const { data } = await firebaseHttp.patch(`/reports/${reportId}`, {
      id: reportId,
      completedAt: Date.now(),
      status: 'completed',
      url
    })
    return data
  }
}

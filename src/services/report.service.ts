import { firebaseHttp } from './http.service'
import { ServiceResponse } from '../types/types'
import { IReport } from '../types/report.types'

export const reportService = {
  get: async (): ServiceResponse<IReport[]> => {
    try {
      const { data } = await firebaseHttp.get('/reports')
      return { data: Object.values(data) }
    } catch (error) {
      return { error: { message: 'reportService.get error', data: error } }
    }

  },
  create: async (report: IReport): ServiceResponse<IReport> => {
    try {
      const { data } = await firebaseHttp.put(`/reports/${report.id}`, report)
      return { data }
    } catch (error) {
      return { error: { message: 'reportService.create error', data: error } }
    }
  },
  complete: async (reportId: string, url: string): ServiceResponse<IReport> => {
    try {
      const { data } = await firebaseHttp.patch(`/reports/${reportId}`, {
        id: reportId,
        completedAt: Date.now(),
        status: 'completed',
        url
      })
      return { data }
    } catch (error) {
      return { error: { message: 'reportService.complete error', data: error } }
    }
  },
  cancel: async (reportId: string): ServiceResponse<string> => {
    try {
      await firebaseHttp.patch(`/reports/${reportId}`, { status: 'cancelled', completedAt: Date.now() })
      return { data: reportId }
    } catch (error) {
      return { error: { message: 'reportService.cancel error', data: error } }
    }
  }
}

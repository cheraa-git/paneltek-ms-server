import { Request, Response } from 'express'
import { reportService } from '../../services/report.service'

export class ReportController {
  getReports = async (req: Request, res: Response) => {
    const reportsRes = await reportService.get()
    if (reportsRes.error || !reportsRes.data) return res.status(500).send(reportsRes.error)
    res.send(reportsRes.data)
  }
}

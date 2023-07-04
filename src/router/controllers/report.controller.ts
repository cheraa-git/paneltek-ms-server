import { Request, Response } from 'express'
import { reportService } from '../../services/report.service'

export class ReportController {
  getReports = async (req: Request, res: Response) => {
    try {
      const reports = (await reportService.get())
      res.send(Object.values(reports))
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: 'ReportController: getReports error', data: error })
    }
  }
}

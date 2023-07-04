import { Router } from 'express'
import { ReportController } from '../controllers/report.controller'

const controller = new ReportController()
export const reportRouter = Router()

reportRouter.get('/', controller.getReports)

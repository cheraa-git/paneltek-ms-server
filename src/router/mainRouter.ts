import { Express } from 'express'
import { reportRouter } from './routes/report.route'
import { templateRouter } from './routes/template.route'

export class MainRouter {
  constructor(private app: Express) {
  }

  useRoutes() {
    this.app.use('/reports', reportRouter)
    this.app.use('/template', templateRouter)
  }
}

import { Express } from 'express'
import { reportRouter } from './routes/report.route'
import { templateRouter } from './routes/template.route'
import { customerOrderRouter } from './routes/customerOrder.route'
import { fileRouter } from './routes/file.route'

export class MainRouter {
  constructor(private app: Express) {
  }

  useRoutes() {
    this.app.use('/reports', reportRouter)
    this.app.use('/template', templateRouter)
    this.app.use('/customer_order', customerOrderRouter)
    this.app.use('/file', fileRouter)
  }
}

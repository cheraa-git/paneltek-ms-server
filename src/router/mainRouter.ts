import { Express } from 'express'
import { customerOrderRouter } from './customerOrder/customerOrder.route'
import { processingPlanRouter } from './processingPlan/processingPlan.route'
import { productRouter } from './product/product.route'

export class MainRouter {
  constructor(private app: Express) {
  }

  useRoutes() {
    this.app.use('/customer_order', customerOrderRouter)
    this.app.use('/processing_plan', processingPlanRouter)
    this.app.use('/product', productRouter)
  }
}

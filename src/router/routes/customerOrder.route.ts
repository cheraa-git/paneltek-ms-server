import { CustomerOrderController } from '../controllers/customerOrder.controller'
import { Router } from 'express'

const controller = new CustomerOrderController()
export const customerOrderRouter = Router()

customerOrderRouter.get('/current_orders', controller.getCurrentOrders)

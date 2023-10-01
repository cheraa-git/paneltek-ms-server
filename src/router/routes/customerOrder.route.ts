import { CustomerOrderController } from '../controllers/customerOrder.controller'
import { Router } from 'express'

const controller = new CustomerOrderController()
export const customerOrderRouter = Router()

customerOrderRouter.post('/current_orders', controller.getCurrentOrders)
customerOrderRouter.post('/state', controller.setOrderState)
customerOrderRouter.post('/produce', controller.produceOrder)
customerOrderRouter.post('/lock', controller.lockOrder)
customerOrderRouter.get('/:orderId', controller.getOrderById)

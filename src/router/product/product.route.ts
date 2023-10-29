import { Router } from 'express'
import { ProductController } from './product.controller'

const controller = new ProductController()

export const productRouter = Router()

productRouter.post('/stocks', controller.getStocksByCodes)

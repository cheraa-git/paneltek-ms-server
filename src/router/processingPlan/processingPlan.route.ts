import { ProcessingPlanController } from './processingPlan.controller'
import { Router } from 'express'

const controller = new ProcessingPlanController()

export const processingPlanRouter = Router()

processingPlanRouter.post('/order', controller.createProcessingPlanForOrder)

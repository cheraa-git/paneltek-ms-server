import { Router } from 'express'
import { TemplateController } from '../controllers/template.controller'

const controller = new TemplateController()
export const templateRouter = Router()

templateRouter.get('/', controller.getProcessingOrdersReport)
templateRouter.get('/length', controller.getProcessingOrdersLength)

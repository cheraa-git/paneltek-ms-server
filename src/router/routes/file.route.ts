import { Router } from 'express'
import { FileController } from '../controllers/file.controller'

const controller = new FileController()
export const fileRouter = Router()

fileRouter.post('/', controller.saveFile)



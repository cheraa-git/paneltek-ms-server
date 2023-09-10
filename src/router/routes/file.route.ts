import { Router } from 'express'
import { FileController } from '../controllers/file.controller'
import multer from 'multer'

const controller = new FileController()
const upload = multer()

export const fileRouter = Router()

fileRouter.post('/', upload.single('file'), controller.saveFile)



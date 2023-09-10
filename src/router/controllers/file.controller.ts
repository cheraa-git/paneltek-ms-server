import { Request, Response } from 'express'
import { storageService } from '../../services/storage.service'

export class FileController {
  saveFile = async (req: Request, res: Response) => {
    const { file, storageType, dirName, fileName } = req.body
    if (storageType === 'google') {

    } else if (storageType === 'firebase') {
      const fileUrl = await storageService.save(file, dirName, fileName)
      res.send({url: fileUrl})
    } else {
      return res.status(400).send({ message: 'invalid storage type' })
    }
  }
}

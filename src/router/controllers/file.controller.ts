import { Request, Response } from 'express'
import { storageService } from '../../services/storage.service'

export class FileController {
  saveFile = async (req: Request, res: Response) => {
    const { file } = req.body
    const storageType = 'firebase'
    const dirName = 'test_dir'
    const fileName = 'testF_file_name'
    console.log('FILE', file)
    if (!file) {
      return res.status(400).send('file is undefined')
    }
   if (storageType === 'firebase') {
     const bufferFile = Buffer.from(file)
     const fileUrl = await storageService.save(bufferFile, dirName, fileName)
      res.send({url: fileUrl})
    } else {
      return res.status(400).send({ message: `invalid storage type - ${storageType}` })
    }
  }
}

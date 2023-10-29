import { Request, Response } from 'express'
import { productService } from '../../services/ms/product.service'
import { splitArray } from '../../utils/utils'

export class ProductController {
  getStocksByCodes = async (req: Request, res: Response) => {
    const { codes } = req.body
    if (!codes || !Array.isArray(codes)) {
      return res.status(400).json({ message: 'Param codes (array) is required' })
    }
    const result: { code: string, stock: number }[] = []
    const groupedCodes = splitArray(codes, 4)
    for (let codesGroup of groupedCodes) {
      const assortmentsGroupPromises = codesGroup.map(code => productService.getAssortmentByCode(code))
      const assortmentsGroup = await Promise.all(assortmentsGroupPromises)
      assortmentsGroup.forEach((assortment, index) => result.push({
        code: codesGroup[index],
        stock: assortment?.stock || 0
      }))
    }

    res.json(result)
  }
}

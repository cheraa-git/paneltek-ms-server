import { Request, Response } from 'express'
import { orderService } from '../../services/ms/customerOrder.service'
import { Panel } from '../../utils/panel'
import { processingPlanService } from '../../services/ms/processingPlan.service'
import { Facing } from '../../utils/facing'
import { isAxiosError } from 'axios'

export class ProcessingPlanController {
  createProcessingPlanForOrder = async (req: Request, res: Response) => {
    const orderId = req.body.orderId
    if (!orderId) {
      return res.status(400).json({ message: 'Request body must contain the field "orderId"' })
    }
    try {
      const result = []
      const orderPositions = await orderService.getOrderAssortments(orderId)
      for (let orderPosition of orderPositions) {
        if (Panel.isPanel(orderPosition.assortment.name)) {
          const panelRes = await processingPlanService.createPanelProcessingPlan(orderPosition.assortment)
          result.push(panelRes)
        } else if (Facing.isFacing(orderPosition.assortment.name)) {
          const facingRes = await processingPlanService.createFacingProcessingPlan(orderPosition.assortment)
          result.push(facingRes)
        }
      }
      res.json(result)
    } catch (error) {

      if (isAxiosError(error)) {
        console.log(error.response?.data)
      } else {
        console.log(error)
      }
      res.status(500).json(error)
    }
  }
}

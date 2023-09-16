import { Request, Response } from 'express'
import { orderService } from '../../services/ms/customerOrder.service'
import { Panel } from '../../utils/panel'
import { processingPlanService } from '../../services/ms/processingPlan.service'
import { Facing } from '../../utils/facing'

export class ProcessingPlanController {
  createProcessingPlanForOrder = async (req: Request, res: Response) => {
    const orderId = req.body.orderId
    if (!orderId) {
      return res.status(400).json({ message: 'Request body must contain the field "orderId"' })
    }
    try {
      const result = []
      const modifications = await orderService.getOrderAssortments(orderId)
      for (let modification of modifications) {
        if (Panel.isPanel(modification.name)) {
          const panelRes = await processingPlanService.createPanelProcessingPlan(modification)
          result.push(panelRes)
        } else if (Facing.isFacing(modification.name)) {
          const facingRes = await processingPlanService.createFacingProcessingPlan(modification)
          result.push(facingRes)
        }
      }
      res.json(result)
    } catch (error) {
      console.log(error)
      res.status(500).json(error)
    }
  }
}

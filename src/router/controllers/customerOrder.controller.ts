import { Request, Response } from 'express'
import { orderService } from '../../services/ms/customerOrder.service'
import { msApi } from '../../services/http.service'
import { Facing } from '../../utils/facing'
import { Panel } from '../../utils/panel'
import { formatNumber } from '../../utils/utils'
import { ProcessingPlan } from '../../types/processingPlan.types'
import { processingPlanService } from '../../services/ms/processingPlan.service'
import { processingOrderService } from '../../services/ms/processingOrder.service'

export class CustomerOrderController {
  getCurrentOrders = async (req: Request, res: Response) => {
    try {
      if (req.body.existingOrders && !Array.isArray(req.body.existingOrders)) {
        return res.status(500).json({ message: 'invalid params' })
      }
      const existingOrders: number[] = req.body.existingOrders?.map((n: string | number) => Number(n)) || []

      const ordersRes = await orderService.getOrdersByStatus(['Запуск в производство'])
      if (ordersRes.error) return res.status(500).json({ ...ordersRes.error })
      const data = []
      ordersRes.data = ordersRes.data.filter((order: any) => {
        return !existingOrders.includes(Number(order.name)) && order.deliveryPlannedMoment
      })

      for (const i in ordersRes.data) {
        const order = ordersRes.data[i]

        const orderPositions = await orderService.getOrderAssortments(order.id)

        const [walls, roofs, facings]: [any[], any[], any[]] = [[], [], []]
        orderPositions.forEach(({ assortment }) => {
          if (assortment.name.includes('Сэндвич-панель стеновая')) walls.push(assortment)
          else if (assortment.name.includes('Сэндвич-панель кровельная')) roofs.push(assortment)
          else if (assortment.name.includes('Фасонное изделие')) facings.push(assortment)
        })

        const wallsWidth: string[] = []
        const wallsColorAndFiller: string[] = []
        let wallsSquare = 0
        walls.forEach(wall => {
          const width = Panel.getWidth(wall.name)
          let color = wall.characteristics?.find((c: any) => (c.name = 'цвет'))?.value
          if (color.split('/')[1] === '9003') {
            color = color.split('/')[0]
          } else {
            color = `(${color})`
          }
          const wallColorAndFiller = `${color} ${Panel.getFiller(wall.name)}`

          if (!wallsWidth.includes(width)) wallsWidth.push(width)
          if (!wallsColorAndFiller.includes(wallColorAndFiller)) wallsColorAndFiller.push(wallColorAndFiller)
          wallsSquare += Panel.getWeight(wall.name) * wall.quantity
        })

        const roofsColorAndFiller: string[] = []
        let roofsSquare = 0
        roofs.forEach(roof => {
          let color = roof.characteristics?.find((c: any) => (c.name = 'цвет'))?.value
          if (color.split('/')[1] === '9003') {
            color = color.split('/')[0]
          }
          const roofColorAndFiller = `${color} ${Panel.getFiller(roof.name)}`

          if (!roofsColorAndFiller.includes(roofColorAndFiller)) roofsColorAndFiller.push(roofColorAndFiller)
          roofsSquare += Panel.getWeight(roof.name) * roof.quantity
        })

        let facingsSquare = 0
        facings.forEach(facing => {
          facingsSquare += Facing.getWeight(facing.name) * facing.quantity
        })

        const { data: agent } = await msApi.get(order.agent.meta.href)
        const { data: project } = await msApi.get(order.project.meta.href)

        const startDate = order?.attributes?.find((attribute: any) => attribute.name === 'Дата запуска')?.value
        const orderData = {
          '№ заказа': order.name,
          'Дата заказа': order.moment?.split(' ')[0]?.split('-')?.reverse()?.join('.'),
          'Дата запуска': startDate ? startDate.split(' ')[0].split('-').reverse().join('.') : '-',
          'Дата отгрузки': order.deliveryPlannedMoment?.split(' ')[0].split('-').reverse().join('.') || '-',
          'Факт готовности': '',
          'Контрагент': agent?.name || agent?.legalTitle || '-',
          'Текущий статус': '',
          'Стена и ширина': walls.length ? `Стена ${wallsWidth.join('/')}` : '-',
          'Цвет, наполнение, Толщина': wallsColorAndFiller.join('/') || '-',
          'Площадь стен': wallsSquare,
          'Кровля цвет наполнение толщина': roofs.length ? `Кровля ${roofsColorAndFiller.join('/')}` : '-',
          'Площадь кровли': roofsSquare,
          'Площадь фасонки': facingsSquare,
          'Очередь': '',
          'Ориентировочная дата выдачи на линию': '',
          'Проект': project.name || '-',
          'Примечание': ''
        }
        if (wallsSquare || roofsSquare || facingsSquare) {
          data.push(orderData)
        }
        console.log(`${+i + 1}/${ordersRes.data?.length}`)
      }
      console.log(`COMPLETED ${new Date().toLocaleString()}; ADD - ${data.length}`)
      res.json(data)
    } catch (error) {
      res.status(500).json({ message: 'Unexpected error', data: error })
    }

  }

  setOrderState = async (req: Request, res: Response) => {
    try {
      const orderName = formatNumber(Number(req.body.orderName), 5)
      const stateRes = await orderService.getOrderStateDataByName(req.body.stateName)
      if (stateRes.error || !stateRes.data) {
        return res.status(500).json({ ...stateRes.error })
      }
      const state = stateRes.data

      const order = await orderService.getOrderByName(orderName)

      const updatedOrderRes = await orderService.setOrderState(order.id, state)
      if (updatedOrderRes.error) return res.status(500).json({ ...updatedOrderRes.error })
      const updatedOrder = updatedOrderRes.data
      if (!updatedOrder || updatedOrder?.state?.meta?.href !== state.meta.href) {

      }
      res.json(updatedOrder)
    } catch (error: any) {
      return res.status(500).json({ message: error.message })
    }
  }

  runOrder = async (req: Request, res: Response) => {
    try {
      const { orderName } = req.body
      if (!orderName) return res.status(400).json({ message: 'param `orderName` is required' })

      const order = await orderService.getOrderByName(formatNumber(orderName, 5))
      const orderPositions = await orderService.getOrderAssortments(order.id)

      const createdProcessingOrders = []
      for (const position of orderPositions) {
        let processingPlan: ProcessingPlan | undefined
        if (Panel.isPanel(position.assortment.name)) {
          processingPlan = (await processingPlanService.createPanelProcessingPlan(position.assortment)).processingPlan
        } else if (Facing.isFacing(position.assortment.name)) {
          processingPlan = (await processingPlanService.createFacingProcessingPlan(position.assortment)).processingPlan
        }
        if (processingPlan) {
          const newProcessingOrder = await processingOrderService.create(processingPlan, position.quantity, order.name)
          createdProcessingOrders.push(newProcessingOrder)
        }
      }

      res.json(createdProcessingOrders)
    } catch (error: any) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  }
}

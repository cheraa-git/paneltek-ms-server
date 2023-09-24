import { Request, Response } from 'express'
import { orderService } from '../../services/ms/customerOrder.service'
import { msApi } from '../../services/http.service'
import { Facing } from '../../utils/facing'
import { Panel } from '../../utils/panel'
import { formatNumber } from '../../utils/utils'
import { ProcessingPlan } from '../../types/processingPlan.types'
import { processingPlanService } from '../../services/ms/processingPlan.service'
import { processingOrderService } from '../../services/ms/processingOrder.service'
import { OrderPositionWithAssortment } from '../../types/product.types'

export class CustomerOrderController {
  getCurrentOrders = async (req: Request, res: Response) => {
    try {
      if (req.body.existingOrders && !Array.isArray(req.body.existingOrders)) {
        return res.status(500).json({ message: 'invalid params' })
      }
      const existingOrders: number[] = req.body.existingOrders?.map((n: string | number) => Number(n)) || []

      const orders = (await orderService.getOrdersByStatus(['Запуск в производство'])).filter((order) => {
        return !existingOrders.includes(Number(order.name)) && order.deliveryPlannedMoment
      })
      const data = []

      for (const i in orders) {
        const order = orders[i]

        const orderPositions = await orderService.getOrderAssortments(order.id)

        const [walls, roofs, facings]: OrderPositionWithAssortment[][] = [[], [], []]
        orderPositions.forEach((position) => {
          console.log('POSITION', position)
          if (position.assortment.name.includes('Сэндвич-панель стеновая')) walls.push(position)
          else if (position.assortment.name.includes('Сэндвич-панель кровельная')) roofs.push(position)
          else if (position.assortment.name.includes('Фасонное изделие')) facings.push(position)
        })

        const wallsWidth: string[] = []
        const wallsColorAndFiller: string[] = []
        let wallsSquare = 0
        walls.forEach(wall => {
          const width = Panel.getWidth(wall.assortment.name)
          let color = wall.assortment.characteristics?.find(c => (c.name = 'цвет'))?.value
          if (color?.split('/')[1] === '9003') {
            color = color.split('/')[0]
          } else {
            color = `(${color})`
          }
          const wallColorAndFiller = `${color} ${Panel.getFiller(wall.assortment.name)}`

          if (!wallsWidth.includes(width)) wallsWidth.push(width)
          if (!wallsColorAndFiller.includes(wallColorAndFiller)) wallsColorAndFiller.push(wallColorAndFiller)
          console.log('AAAAAA', wall.assortment.name, '----', wall.quantity, '----', Panel.getWeight(wall.assortment.name))
          wallsSquare += Panel.getWeight(wall.assortment.name) * wall.quantity
        })

        const roofsColorAndFiller: string[] = []
        let roofsSquare = 0
        roofs.forEach(roof => {
          let color = roof.assortment.characteristics?.find(c => (c.name = 'цвет'))?.value
          if (color?.split('/')[1] === '9003') {
            color = color.split('/')[0]
          }
          const roofColorAndFiller = `${color} ${Panel.getFiller(roof.assortment.name)}`

          if (!roofsColorAndFiller.includes(roofColorAndFiller)) roofsColorAndFiller.push(roofColorAndFiller)
          roofsSquare += Panel.getWeight(roof.assortment.name) * roof.quantity
        })

        let facingsSquare = 0
        facings.forEach(facing => {
          facingsSquare += Facing.getWeight(facing.assortment.name) * facing.quantity
        })

        const { data: agent } = await msApi.get(order.agent.meta.href)
        const project = order.project ? (await msApi.get(order.project.meta.href)).data : ''

        const startDate = order?.attributes?.find(attribute => attribute.name === 'Дата запуска')?.value
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
        console.log('SQUARE', { wallsSquare, roofsSquare, facingsSquare })
        if (wallsSquare || roofsSquare || facingsSquare) {
          data.push(orderData)
        }
        console.log(`${+i + 1}/${orders?.length}`)
      }
      console.log(`COMPLETED ${new Date().toLocaleString()}; ADD - ${data.length}`)
      res.json(data)
    } catch (error) {
      console.log(error)
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



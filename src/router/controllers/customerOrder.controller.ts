import { Request, Response } from 'express'
import { orderService } from '../../services/ms/customerOrder.service'
import { msApi } from '../../services/http.service'
import { Facing } from '../../utils/facing'
import { Panel } from '../../utils/panel'
import { formatNumber } from '../../utils/utils'
import { processingPlanService } from '../../services/ms/processingPlan.service'
import { processingOrderService } from '../../services/ms/processingOrder.service'
import { OrderPositionWithAssortment } from '../../types/product.types'
import { emailService } from '../../services/email.service'
import { processingService } from '../../services/ms/processing.service'
import { COMPLETED_PRODUCE_ORDER_STATUS_ATTR } from '../../constants/order.constants'
import { RoofingSheet } from '../../utils/roofingSheet'

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

        const [walls, roofs, facings, roofingSheets]: OrderPositionWithAssortment[][] = [[], [], [], []]
        orderPositions.forEach((position) => {
          if (position.assortment.name.includes('Сэндвич-панель стеновая')) walls.push(position)
          else if (position.assortment.name.includes('Сэндвич-панель кровельная')) roofs.push(position)
          else if (position.assortment.name.includes('Фасонное изделие')) facings.push(position)
          else if (position.assortment.name.includes('Обкладка кровельная')) roofingSheets.push(position)
        })

        const wallsWidth: string[] = []
        // const wallsColorAndFiller: string[] = []
        // let wallsSquare = 0
        const wallsData: { [colorAndFiller: string]: { colorAndFiller: string, square: number } } = {}
        walls.forEach(wall => {
          const width = Panel.getWidth(wall.assortment.name)
          let color = wall.assortment.characteristics?.find(c => c.name === 'цвет')?.value

          const wallColorAndFiller = `${color} ${Panel.getFiller(wall.assortment.name)}`
          const square = Panel.getWeight(wall.assortment.name) * wall.quantity

          if (!wallsWidth.includes(width)) wallsWidth.push(width)
          // if (!wallsColorAndFiller.includes(wallColorAndFiller)) wallsColorAndFiller.push(wallColorAndFiller)
          if (wallColorAndFiller in wallsData) {
            wallsData[wallColorAndFiller].square += square
          } else {
            wallsData[wallColorAndFiller] = { colorAndFiller: wallColorAndFiller, square }
          }
          // wallsSquare += square
        })

        // const roofsColorAndFiller: string[] = []
        // let roofsSquare = 0
        const roofsData: { [colorAndFiller: string]: { colorAndFiller: string, square: number } } = {}
        roofs.forEach(roof => {
          let color = roof.assortment.characteristics?.find(c => c.name === 'цвет')?.value

          const roofColorAndFiller = `${color} ${Panel.getFiller(roof.assortment.name)}`
          const square = Panel.getWeight(roof.assortment.name) * roof.quantity

          // if (!roofsColorAndFiller.includes(roofColorAndFiller)) roofsColorAndFiller.push(roofColorAndFiller)
          if (roofColorAndFiller in roofsData) {
            roofsData[roofColorAndFiller].square += square
          } else {
            roofsData[roofColorAndFiller] = { colorAndFiller: roofColorAndFiller, square }
          }

          // roofsSquare += Panel.getWeight(roof.assortment.name) * roof.quantity
        })

        // let facingsSquare = 0
        const facingsData: { [color: string]: { color: string, square: number } } = {}
        facings.forEach(facing => {
          const color = facing.assortment.characteristics?.find(c => c.name === 'цвет')?.value
          if (!color) return
          const square = Facing.getWeight(facing.assortment.name) * facing.quantity

          if (color in facingsData) {
            facingsData[color].square += square
          } else {
            facingsData[color] = { color, square }
          }
          // facingsSquare += Facing.getWeight(facing.assortment.name) * facing.quantity
        })

        const roofingSheetsData: { [color: string]: { color: string, square: number } } = {}
        roofingSheets.forEach(roofingSheet => {
          const color = roofingSheet.assortment.characteristics?.find(c => c.name === 'цвет')?.value
          if (!color) return
          const square = RoofingSheet.getWeight(roofingSheet.assortment.name) * roofingSheet.quantity

          if (color in roofingSheetsData) {
            roofingSheetsData[color].square += square
          } else {
            roofingSheetsData[color] = { color, square }
          }

        })

        const { data: agent } = await msApi.get(order.agent.meta.href)
        const project = order.project ? (await msApi.get(order.project.meta.href)).data : ''

        const startDate = order?.attributes?.find(attribute => attribute.name === 'Дата запуска')?.value

        const wallsSquare = Object.values(wallsData).reduce((acc, d) => acc + d.square, 0)
        const roofsSquare = Object.values(roofsData).reduce((acc, d) => acc + d.square, 0)
        const facingsSquare = Object.values(facingsData).reduce((acc, d) => acc + d.square, 0)
        const roofingSheetsSquare = Object.values(roofingSheetsData).reduce((acc, d) => acc + d.square, 0)

        const orderData = {
          '№ заказа': order.name,
          'Дата заказа': order.moment?.split(' ')[0]?.split('-')?.reverse()?.join('.'),
          'Дата запуска': startDate ? startDate.split(' ')[0].split('-').reverse().join('.') : '-',
          'Дата отгрузки': order.deliveryPlannedMoment?.split(' ')[0].split('-').reverse().join('.') || '-',
          'Факт готовности': '',
          'Контрагент': agent?.name || agent?.legalTitle || '-',
          'Текущий статус': '',
          'Стена и ширина': walls.length ? `Стена ${wallsWidth.join('/')}` : '-',
          // 'Цвет, наполнение, Толщина': wallsColorAndFiller.join('/') || '-',
          'Цвет, наполнение, Толщина': Object.values(wallsData).map(d => d.colorAndFiller).join(' – ') || '-',
          'Площадь стен': wallsSquare,
          // 'Кровля цвет наполнение толщина': roofs.length ? `Кровля ${roofsColorAndFiller.join('/')}` : '-',
          'Кровля цвет наполнение толщина': Object.values(roofsData).map(d => d.colorAndFiller).join(' – ') || '-',
          'Площадь кровли': roofsSquare,
          'Ф (цвет)': Object.values(facingsData).map(d => d.color).join(' – ') || '-',
          'Ф (м2)': facingsSquare,
          'Обкладка цвет': Object.values(roofingSheetsData).map(d => d.color).join(' – ') || '-',
          'Обкладка (м2)': roofingSheetsSquare,
          'Проект': project.name || '-',
          'Sw': Object.values(wallsData).map(d => d.square).join(' – ') || '-',
          'Sr': Object.values(roofsData).map(d => d.square).join(' – ') || '-',
          'Sf': Object.values(facingsData).map(d => d.square).join(' – ') || '-',
          'Srs': Object.values(roofingSheetsData).map(d => d.square).join(' – ') || '-'
        }
        if (wallsSquare || roofsSquare || facingsSquare || roofingSheetsSquare) {
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
      const state = await orderService.getOrderStateDataByName(req.body.stateName)
      const order = await orderService.getOrderByName(orderName)
      const updatedOrder = await orderService.setOrderState(order.id, state)
      res.json(updatedOrder)
    } catch (error: any) {
      return res.status(500).json({ message: error.message })
    }
  }

  produceOrder = async (req: Request, res: Response) => {
    try {
      const { orderName } = req.body
      if (!orderName) return res.status(400).json({ message: 'param `orderName` is required' })

      const order = await orderService.getOrderByName(formatNumber(orderName, 5))
      if (order.attributes?.find(attr => attr.meta.href === COMPLETED_PRODUCE_ORDER_STATUS_ATTR.meta.href)) {
        return res.json({ processingOrders: 0, processings: 0 })
      }
      const orderPositions = await orderService.getOrderAssortments(order.id)

      const groupedOrderPositions = orderPositions.reduce((acc, position) => {
        const existingPositionIndex = acc.findIndex(p => {
          return p.assortment.name === position.assortment.name
        })
        if (existingPositionIndex >= 0) {
          acc[existingPositionIndex].quantity += position.quantity
        } else {
          acc.push(position)
        }
        return acc
      }, [] as OrderPositionWithAssortment[])

      const processingOrders = []
      const processings = []
      const failedProcessings = []
      for (const position of groupedOrderPositions) {
        const processingPlan = await processingPlanService.createProcessingPlan(position.assortment)
        if (processingPlan) {
          const processingOrder = await processingOrderService.create(processingPlan, position.quantity, order.name)
          processingOrders.push(processingOrder)
          const newProcessingRes = await processingService.create(processingPlan, processingOrder, order.name)
          if (newProcessingRes.status === 'success') {
            processings.push(newProcessingRes.data)
          } else if (newProcessingRes.status === 'error') {
            failedProcessings.push(newProcessingRes.data)
          }
        }
      }
      if (failedProcessings.length !== 0) {
        const emailMessage = `
Заказ покупателя: ${orderName}
Заказы на производство:
${failedProcessings.map(p => `https://online.moysklad.ru/app/#processingorder/edit?id=${p.processingOrder.id}`).join('\n')}
        `
        await emailService.sendMessage(process.env.ADMIN_EMAIL || '', 'Ошибка техоперации', emailMessage)
      } else {
        await orderService.completeProduceState(order.id)
      }

      console.log(`PRODUCE: order - ${orderName}; processingOrders - ${processingOrders.length}; processings - ${processings.length}`)
      res.json({ processingOrders: processingOrders.length, processings: processings.length })
    } catch (error: any) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  }
  lockOrder = async (req: Request, res: Response) => {
    const { orderId } = req.query
    if (!orderId) return res.status(400).json({ message: 'Query param `orderId` is required' })
    try {
      const lockedOrder = await orderService.lock(orderId as string)
      res.json(lockedOrder)
    } catch (error: any) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  }

  getOrderById = async (req: Request, res: Response) => {
    const { orderId } = req.params
    try {
      const order = await orderService.getById(orderId)
      res.json(order)
    } catch (error: any) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  }
}



import { Request, Response } from 'express'
import { orderService } from '../../services/customerOrder.service'
import { msHttp } from '../../services/http.service'
import { Panel } from '../../utils/panel'
import { Facing } from '../../utils/facing'


export class CustomerOrderController {
  getCurrentOrders = async (req: Request, res: Response) => {

    const existingOrders: number[] = ((req.query.existingOrders as string | undefined) || '')
      .replaceAll('[', '')
      .replaceAll(']', '')
      .replaceAll(' ', '')
      .replaceAll('"', '')
      .replaceAll('\'', '')
      .split(',')
      .map(n => Number(n))

    const ordersRes = await orderService.getOrdersByStatus(['Запуск в производство'])
    if (ordersRes.error) return res.status(500).json({ ...ordersRes.error })
    const data = []
    ordersRes.data = ordersRes.data.filter((order: any) => !existingOrders.includes(Number(order.name)))

    for (const i in ordersRes.data) {
      const order = ordersRes.data[i]

      const positionsRes = await orderService.getOrderAssortments(order.id)
      if (positionsRes.error) return res.status(500).json({ ...positionsRes.error })

      const [walls, roofs, facings]: [any[], any[], any[]] = [[], [], []]
      positionsRes.data.forEach((position: any) => {
        if (position.name.includes('Сэндвич-панель стеновая')) walls.push(position)
        else if (position.name.includes('Сэндвич-панель кровельная')) roofs.push(position)
        else if (position.name.includes('Фасонное изделие')) facings.push(position)
      })

      const wallsWidth: string[] = []
      const wallsColorAndFiller: string[] = []
      let wallsSquare = 0
      walls.forEach(wall => {
        const width = Panel.getWidth(wall.name)
        let color = wall.characteristics?.find((c: any) => c.name = 'цвет')?.value
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
        let color = roof.characteristics?.find((c: any) => c.name = 'цвет')?.value
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

      const { data: agent } = await msHttp.get(order.agent.meta.href)
      const { data: project } = await msHttp.get(order.project.meta.href)

      const startDate = order.attributes.find((attribute: any) => attribute.name === 'Дата запуска')?.value
      const orderData = {
        '№ заказа': order.name,
        'Дата заказа': order.moment.split(' ')[0].split('-').reverse().join('.'),
        'Дата запуска': startDate ? startDate.split(' ')[0].split('-').reverse().join('.') : '-',
        'Дата отгрузки': order.deliveryPlannedMoment?.split(' ')[0].split('-').reverse().join('.') || '-',
        'Факт готовности': '',
        'Контрагент': agent.name || agent.legalTitle || '-',
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
      if (wallsSquare || roofsSquare) {
        data.push(orderData)
      }
      console.log(`${+i + 1}/${ordersRes.data?.length}`)
    }
    console.log(`COMPLETED ${new Date().toLocaleString()}; ADD - ${data.length}`)
    res.json(data)
  }
}

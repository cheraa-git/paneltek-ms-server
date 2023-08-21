import { Request, Response } from 'express'
import { orderService } from '../../services/customerOrder.service'
import { msHttp } from '../../services/http.service'
import { Panel } from '../../utils/panel'
import { Facing } from '../../utils/facing'


export class CustomerOrderController {
  getCurrentOrders = async (req: Request, res: Response) => {
    const ordersRes = await orderService.getOrdersByStatus(['Частично отгружено'])
    if (ordersRes.error) return res.status(500).json({ ...ordersRes.error })
    const data = []

    for (const order of ordersRes.data) {
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
      data.push({
        '№ заказа': order.name,
        'Дата заказа': order.moment,
        'Дата запуска': order.attributes.find((attribute: any) => attribute.name === 'Дата запуска')?.value || '-',
        'Дата отгрузки': order.deliveryPlannedMoment || '-',
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
      })
    }
    res.json(data)
  }
}

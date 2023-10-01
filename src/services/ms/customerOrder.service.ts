import { msApi } from '../http.service'
import { Order, OrderState, OrderStateName } from '../../types/order.types'
import { OrderPositionWithAssortment } from '../../types/product.types'
import { ADMIN_OWNER_META } from '../../constants/constants'
import { COMPLETED_PRODUCE_ORDER_STATUS_ATTR } from '../../constants/order.constants'

class CustomerOrderService {
  getOrderAssortments = async (orderId: string): Promise<OrderPositionWithAssortment[]> => {
    const url = `/customerorder/${orderId}/positions`
    const { data: { rows } } = await msApi.get(url)
    for (let i in rows) {
      const { data: assortment } = await msApi.get(rows[i].assortment.meta.href)
      rows[i].assortment = assortment
    }
    return rows
  }

  getOrdersByStatus = async (statuses: string[]): Promise<Order[]> => {
    const { data } = await msApi.get('/customerorder', {
      params: {
        filter: `state.name=${statuses.join(',')}`
      }
    })
    return data.rows
  }
  getOrderStateDataByName = async (name: OrderStateName): Promise<OrderState> => {
      const { data: { states } } = await msApi.get<{ states: OrderState[] }>('/customerorder/metadata/')
      const state = states.find(s => s.name === name)
      if (!state) {
        throw new Error(`CustomerOrderService.getOrderStateDataByName: state "${name}" not found`)
      }
    return state

  }

  getOrderByName = async (orderName: string): Promise<Order> => {
    const { data: { rows } } = await msApi.get<{ rows: Order[] }>('/customerorder', { params: { filter: `name=${orderName}` } })
    const orders = rows.filter(o => !o.created.includes('2022-') && !o.created.includes('2021-'))
    if (orders.length > 1) {
      throw new Error(`CustomerOrderService.getOrderByName: founded more then one order (${orderName})`)
    }
    if (orders.length === 0) {
      throw new Error(`CustomerOrderService.getOrderByName: order not found (${orderName})`)
    }
    return orders[0]
  }

  getById = async (orderId: string): Promise<Order> => {
    const { data } = await msApi.get(`/customerorder/${orderId}`)
    return data
  }

  setOrderState = async (orderId: string, state: OrderState): Promise<Order> => {
    const { data } = await msApi.put(`/customerorder/${orderId}`, { state })
    return data
  }

  lock = async (orderId: string): Promise<Order> => {
    const { data } = await msApi.put(`/customerorder/${orderId}`, { owner: ADMIN_OWNER_META, shared: false })
    return data
  }

  completeProduceState = async (orderId: string): Promise<Order> => {
    const { data } = await msApi.put(`/customerorder/${orderId}`, { attributes: [COMPLETED_PRODUCE_ORDER_STATUS_ATTR] })
    return data
  }

}

export const orderService = new CustomerOrderService()

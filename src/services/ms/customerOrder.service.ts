import { msApi } from '../http.service'
import { ServiceResponse } from '../../types/types'
import { Order, OrderState, OrderStateName } from '../../types/order.types'
import { OrderPositionWithAssortment } from '../../types/product.types'
import { ADMIN_OWNER_META } from '../../constants/constants'

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
  getOrderStateDataByName = async (name: OrderStateName): ServiceResponse<OrderState> => {
    try {
      const { data: { states } } = await msApi.get<{ states: OrderState[] }>('/customerorder/metadata/')
      const state = states.find(s => s.name === name)
      if (!state) {
        return { error: { message: 'CustomerOrderService.getOrderStateDataByName: state not found', data: name } }
      }
      return { data: state }
    } catch (error) {
      return { error: { message: 'CustomerOrderService.getOrderStateDataByName error', data: error } }
    }
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

  setOrderState = async (orderId: string, state: OrderState): ServiceResponse<Order> => {
    try {
      const { data } = await msApi.put(`/customerorder/${orderId}`, { state })
      return { data }
    } catch (error) {
      return { error: { message: 'CustomerOrderService.setOrderState error', data: error } }
    }
  }

  lock = async (orderId: string): Promise<Order> => {
    const { data } = await msApi.put(`/customerorder/${orderId}`, { owner: ADMIN_OWNER_META, shared: false })
    return data
  }


}

export const orderService = new CustomerOrderService()

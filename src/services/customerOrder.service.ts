import { msHttp } from './http.service'
import { Order, OrderState, OrderStateName, ServiceResponse } from '../types'

class CustomerOrderService {
  getOrderAssortments = async (orderId: string): ServiceResponse => {
    try {
      const url = `/customerorder/${orderId}/positions`
      const { data: { rows } } = await msHttp.get(url)
      for (let i in rows) {
        const { data: assortment } = await msHttp.get(rows[i].assortment.meta.href)
        rows[i] = { ...rows[i], ...assortment }
      }
      return { data: rows }
    } catch (error) {
      return { error: { message: 'CustomerOrderService.getOrderAssortments error', data: error } }
    }
  }

  getOrdersByStatus = async (statuses: string[]): ServiceResponse => {
    try {
      const { data } = await msHttp.get('/customerorder', {
        params: {
          filter: `state.name=${statuses.join(',')}`
        }
      })
      return { data: data.rows }
    } catch (error) {
      return { error: { message: 'CustomerOrderService.getOrdersByStatus error', data: error } }
    }
  }
  getOrderStateDataByName = async (name: OrderStateName): ServiceResponse<OrderState> => {
    try {
      const { data: { states } } = await msHttp.get<{ states: OrderState[] }>('/customerorder/metadata/')
      const state = states.find(s => s.name === name)
      if (!state) {
        return { error: { message: 'CustomerOrderService.getOrderStateDataByName: state not found', data: name } }
      }
      return { data: state }
    } catch (error) {
      return { error: { message: 'CustomerOrderService.getOrderStateDataByName error', data: error } }
    }
  }

  getOrderByName = async (orderName: string): ServiceResponse<Order> => {
    const { data: { rows } } = await msHttp.get<{ rows: Order[] }>('/customerorder', { params: { filter: `name=${orderName}` } })
    const orders = rows.filter(o => !o.created.includes('2022-') && !o.created.includes('2021-'))
    if (orders.length > 1) {
      return { error: { message: 'CustomerOrderService.getOrderByName: founded more then one order', data: orderName } }
    }
    return { data: orders[0] }
  }

  setOrderState = async (orderId: string, state: OrderState): ServiceResponse<Order> => {
    try {
      const { data } = await msHttp.put(`/customerorder/${orderId}`, { state })
      return { data }
    } catch (error) {
      return { error: { message: 'CustomerOrderService.setOrderState error', data: error } }
    }
  }


}

export const orderService = new CustomerOrderService()

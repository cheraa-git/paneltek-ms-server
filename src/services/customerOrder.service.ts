import { msHttp } from './http.service'
import { ServiceResponse } from '../types'

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

}

export const orderService = new CustomerOrderService()

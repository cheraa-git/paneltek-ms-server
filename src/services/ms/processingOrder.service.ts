import { msHttp } from '../http.service'
import { ServiceResponse } from '../../types'


export const processingOrderService = {
  getProcessingOrdersByDate: async (startDate: string, endDate?: string): ServiceResponse => { // date format: 2023-06-20 00:00:00
    try {
      const response = await msHttp.get(`/processingorder?filter=updated>=${startDate};${endDate ? 'updated<=' + endDate + ';' : ''}`)
      return { data: response.data }
    } catch (error) {
      return { error: { message: 'getProcessingOrdersByDate error', data: error } }
    }
  },
  getProcessingOrdersPositions: async (orders: any) => {
    let count = 0
    const notReceivedOrders = []
    const result = []
    for (const order of orders) {
      count++
      const positionsRowsRes = (await processingOrderService.getProcessingOrderPositionsRowsWithAssortment(order))
      if (positionsRowsRes.error || !positionsRowsRes.data) {
        console.log(positionsRowsRes.error)
        notReceivedOrders.push(order)
        continue
      }
      result.push(...positionsRowsRes.data)
      console.log(`processingOrders - ${count}/${orders.length}`)
    }
    return { positions: result, notReceivedOrders }
  },
  getProcessingOrderPositionsRowsWithAssortment: async (processingOrderRow: any): ServiceResponse => {
    try {
      const products = (await msHttp.get(processingOrderRow.positions.meta.href)).data.rows
      for (const i in products) {
        const assortmentRes = await processingOrderService.getAssortment(products[i].assortment.meta.href)
        if (assortmentRes.error || !assortmentRes.data) {
          return { error: assortmentRes.error }
        }
        const assortment = assortmentRes.data
        const uomRes = await processingOrderService.getUom(assortment.uom.meta.href)
        if (uomRes.error || !uomRes.data) {
          return { error: uomRes.error }
        }
        assortment.uom = uomRes.data

        products[i] = { ...products[i], assortment }
      }
      return { data: products }
    } catch (error) {
      return { error: { message: 'getProcessingOrderPositions error', data: error } }
    }
  },
  getAssortment: async (href: string): ServiceResponse => {
    try {
      const response = await msHttp.get(href)
      return { data: response.data }
    } catch (error) {
      return { error: { message: 'getRowAssortment error', data: error } }
    }
  },
  getUom: async (href: string): ServiceResponse => {
    try {
      const response = await msHttp.get(href)
      return { data: response.data }
    } catch (error) {
      return { error: { message: 'getUom error', data: error } }
    }
  },
  getProductStock: async (id: string): ServiceResponse => {
    try {
      const response = await msHttp.get(`assortment?filter=id=${id}`)
      return { data: response.data.rows[0]?.stock || NaN }
    } catch (error) {
      return { error: { message: 'getPositionStock error', data: error } }
    }
  }
}

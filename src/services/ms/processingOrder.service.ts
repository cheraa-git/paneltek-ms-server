import { msApi } from '../http.service'
import { ServiceResponse } from '../../types/types'
import { ProcessingPlan } from '../../types/processingPlan.types'
import { ORGANIZATION_META, PROCESSING_ORDER_ATTR_ORDER_NUMB } from '../../constants/constants'
import { ProcessingOrder } from '../../types/processingOrder.types'
import { formatNumber } from '../../utils/utils'


class ProcessingOrderService {
  getProcessingOrdersByDate = async (startDate: string, endDate?: string): ServiceResponse => { // date format: 2023-06-20 00:00:00
    try {
      const response = await msApi.get(`/processingorder?filter=updated>=${startDate};${endDate ? 'updated<=' + endDate + ';' : ''}`)
      return { data: response.data }
    } catch (error) {
      return { error: { message: 'getProcessingOrdersByDate error', data: error } }
    }
  }
  getProcessingOrdersPositions = async (orders: any) => {
    let count = 0
    const notReceivedOrders = []
    const result = []
    for (const order of orders) {
      count++
      const positionsRowsRes = (await this.getProcessingOrderPositionsRowsWithAssortment(order))
      if (positionsRowsRes.error || !positionsRowsRes.data) {
        console.log(positionsRowsRes.error)
        notReceivedOrders.push(order)
        continue
      }
      result.push(...positionsRowsRes.data)
      console.log(`processingOrders - ${count}/${orders.length}`)
    }
    return { positions: result, notReceivedOrders }
  }
  getProcessingOrderPositionsRowsWithAssortment = async (processingOrderRow: any): ServiceResponse => {
    try {
      const products = (await msApi.get(processingOrderRow.positions.meta.href)).data.rows
      for (const i in products) {
        const assortmentRes = await this.getAssortment(products[i].assortment.meta.href)
        if (assortmentRes.error || !assortmentRes.data) {
          return { error: assortmentRes.error }
        }
        const assortment = assortmentRes.data
        const uomRes = await this.getUom(assortment.uom.meta.href)
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
  }
  getAssortment = async (href: string): ServiceResponse => {
    try {
      const response = await msApi.get(href)
      return { data: response.data }
    } catch (error) {
      return { error: { message: 'getRowAssortment error', data: error } }
    }
  }
  getUom = async (href: string): ServiceResponse => {
    try {
      const response = await msApi.get(href)
      return { data: response.data }
    } catch (error) {
      return { error: { message: 'getUom error', data: error } }
    }
  }
  getProductStock = async (id: string): ServiceResponse => {
    try {
      const response = await msApi.get(`assortment?filter=id=${id}`)
      return { data: response.data.rows[0]?.stock || NaN }
    } catch (error) {
      return { error: { message: 'getPositionStock error', data: error } }
    }
  }

  getByCustomerOrderNumb = async (orderNumber: string): Promise<ProcessingOrder[]> => {
    const { data } = await msApi.get('/processingorder', {
      params: {
        filter: `${PROCESSING_ORDER_ATTR_ORDER_NUMB.meta.href}=${orderNumber}`
      }
    })
    return data.rows
  }

  create = async (processingPlan: ProcessingPlan, quantity: number, orderNumber: string): Promise<ProcessingOrder> => {
    const customerOrderProcessingOrders = await this.getByCustomerOrderNumb(formatNumber(Number(orderNumber), 5))
    const existingProcessingOrder = customerOrderProcessingOrders.find(o => o.processingPlan.meta.href === processingPlan.meta.href)
    if (existingProcessingOrder) {
      return existingProcessingOrder
    }
    const materialsRes = await msApi.get(processingPlan.materials.meta.href)
    const materials = materialsRes.data.rows.map((m: any) => ({
      quantity: m.quantity * quantity,
      assortment: m.assortment
    }))
    const data = {
      organization: ORGANIZATION_META,
      processingPlan: { meta: processingPlan.meta },
      positions: materials,
      quantity,
      attributes: [{
        ...PROCESSING_ORDER_ATTR_ORDER_NUMB,
        value: orderNumber
      }]
    }
    const response = await msApi.post('/processingorder', data)
    return response.data
  }
}

export const processingOrderService = new ProcessingOrderService()

import { FINISHED_PRODUCT_STORE_META, MATERIALS_STORE_META, ORGANIZATION_META } from '../../constants/constants'
import { ProcessingPlan } from '../../types/processingPlan.types'
import { ProcessingOrder } from '../../types/processingOrder.types'
import { msApi } from '../http.service'
import { isAxiosError } from 'axios'

class ProcessingService {
  create = async (processingPlan: ProcessingPlan, processingOrder: ProcessingOrder) => {
    const payload = {
      organization: ORGANIZATION_META,
      productsStore: FINISHED_PRODUCT_STORE_META,
      materialsStore: MATERIALS_STORE_META,
      processingPlan,
      processingOrder,
      quantity: processingOrder.quantity
    }
    try {
      if (processingOrder.processings?.length) {
        return { status: 'success', data: processingOrder.processings[0] }
      }
      const { data } = await msApi.post('/processing', payload)
      return { status: 'success', data }
    } catch (error) {
      if (isAxiosError(error)) {
        const errors = error.response?.data?.errors
        if (errors && Array.isArray(errors) && errors.find(e => e.code === 3007)) {
          return { status: 'error', data: payload }
        }
      }
      throw error
    }

  }
}

export const processingService = new ProcessingService()

import { msApi } from '../http.service'

class ProductService {
  getProductById = async (productId: string) => {
    const url = `/product/${productId}`
    const { data } = await msApi.get(url)
    return data
  }

  searchOneProductByCode = async (code: string) => {
    const url = `/product?search=${encodeURIComponent(code)}`
    const { data } = await msApi.get(url)
    const rows = data.rows.filter((product: any) => product.code === code)
    if (rows.length > 1) {
      throw new Error(`MsService searchOneProductByCode: more than one product found - ${code}`)
    } else if (rows.length === 0) {
      throw new Error(`MsService searchOneProductByCode: product not found - ${code}`)
    }
    return rows[0]
  }
}

export const productService = new ProductService()

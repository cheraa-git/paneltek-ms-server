import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const http = axios.create({
  baseURL: 'https://online.moysklad.ru/api/remap/1.2/entity',
  auth: {
    username: process.env.MS_USER || '',
    password: process.env.MS_PASSWORD || ''
  },
  // timeout: 10000
})

const httpService = {
  get: http.get,
  post: http.post,
  put: http.put,
  delete: http.delete,
  patch: http.patch
}

export default httpService

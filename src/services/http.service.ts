import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

export const msApi = axios.create({
  baseURL: 'https://api.moysklad.ru/api/remap/1.2/entity',
  auth: {
    username: process.env.MS_USER || '',
    password: process.env.MS_PASSWORD || ''
  },
  headers: {
    'Accept-Encoding': 'gzip'
  }
})

export const firebaseHttp = axios.create({
  baseURL: 'https://paneltek-ms-default-rtdb.firebaseio.com'
})

firebaseHttp.interceptors.request.use(config => {
  config.url = config.url?.replace(/\/$/g, '') + '.json'
  return config
})





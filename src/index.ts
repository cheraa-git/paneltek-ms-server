import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
import httpService from './services/http.service'

const cors = require('cors')

dotenv.config()
const app: Express = express()
const port = process.env.PORT || 8080

app.use(express.json())
app.use(cors())


app.get('/', (req: Request, res: Response) => {
  httpService.get('/customerorder/c0e0cfd4-1218-11ee-0a80-043600167160')
    .then(({ data }) => {
      res.json(data)
    })
})

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})

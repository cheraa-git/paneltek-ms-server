import express from 'express'
import dotenv from 'dotenv'
import http from 'http'
import { MainRouter } from './router/mainRouter'

const cors = require('cors')


dotenv.config()
const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 8080
const Router = new MainRouter(app)

app.use(express.json())
app.use(cors())
Router.useRoutes()

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})

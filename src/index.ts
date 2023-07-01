import express, { Request, Response } from 'express'
import dotenv from 'dotenv'
import http from 'http'
import * as _ from 'lodash'
import path from 'path'
import ExcelJS from 'exceljs'
import * as fs from 'fs'
import { msService } from './services/ms.service'

const cors = require('cors')


dotenv.config()
const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 8080

app.use(express.json())
app.use(cors())

app.get('/', async (req: Request, res: Response) => {


  let resData: any[] = []


  const processingOrders = (await msService.getProcessingOrdersByDate('2023-06-20 00:00:00', '2023-06-27 23:59:00')).data.rows
  let { positions, notReceivedOrders } = await msService.getProcessingOrdersPositions(processingOrders)
  while (notReceivedOrders.length !== 0) {
    console.log(`notReceivedOrders length: ${notReceivedOrders.length}`)
    const newPositions = await msService.getProcessingOrdersPositions(notReceivedOrders)
    positions.push(newPositions.positions)
    notReceivedOrders = newPositions.notReceivedOrders
  }
  positions = positions.map((row: any) => {
    return {
      assortment: row.assortment,
      uomName: row.assortment.uom.name,
      quantity: row.quantity
    }
  })

  let count = 0
  const groupedPositions = _.groupBy(positions, ({ assortment }) => assortment.name)

  for (const key of Object.keys(groupedPositions)) {
    let groupedPosIndex = 0
    let stockRes = await msService.getProductStock(groupedPositions[key][groupedPosIndex].assortment.id)
    if (stockRes.error) {
      console.log(stockRes.error)
      throw new Error('stockRes.error') // TODO: вместо этого отработать ошибку
    }
    if (isNaN(stockRes.data) && groupedPositions[key].length > 1) {
      // TODO: stock равна NaN тогда, когда позиция в архиве. Нет смысла делать запрос, если позиция архивная, нужно сделать проверку на это прежде чем отправлять запрос.
      groupedPosIndex++
      while (isNaN(stockRes.data) && groupedPosIndex < groupedPositions[key].length) {
        console.log(`${groupedPositions[key][groupedPosIndex].assortment.id} ${groupedPositions[key][groupedPosIndex].assortment.name} - stock not found`)
        const id = groupedPositions[key][groupedPosIndex]?.assortment?.id
        if (!id) continue
        stockRes = await msService.getProductStock(id)
        if (isNaN(stockRes.data)) {
          groupedPosIndex++
        }
      }
    }

    count++
    console.log(`stock - ${count}/${Object.keys(groupedPositions).length}`)
    resData.push({
      positionName: groupedPositions[key][groupedPosIndex].assortment.name,
      uomName: groupedPositions[key][groupedPosIndex].uomName,
      quantity: groupedPositions[key].reduce((acc, value) => acc + value.quantity, 0),
      stock: stockRes.data
    })
  }

  const workbook = new ExcelJS.Workbook()
  workbook.xlsx.readFile(path.join(__dirname, 'template.xlsx'))
    .then(() => {
      const worksheet = workbook.getWorksheet(1)
      resData.forEach((data, index) => {
        const rowIndex = index + 3
        worksheet.getCell(`A${rowIndex}`).value = index + 1
        worksheet.getCell(`B${rowIndex}`).value = data.positionName
        worksheet.getCell(`C${rowIndex}`).value = data.uomName
        worksheet.getCell(`D${rowIndex}`).value = data.quantity
        worksheet.getCell(`E${rowIndex}`).value = isNaN(data.stock) ? 'Не найдено' : data.stock
        worksheet.getCell(`F${rowIndex}`).value = ''
        worksheet.getCell(`G${rowIndex}`).value = isNaN(data.stock) ? '-' : data.stock - data.quantity
      })

      const tempFilePath = path.join(__dirname, 'temp.xlsx')
      return workbook.xlsx.writeFile(tempFilePath)
    })
    .then(() => {
      console.log('COMPLETED')
      res.download(path.join(__dirname, 'temp.xlsx'), 'Материалы заказов на производство.xlsx', (err) => {
        if (err) {
          console.error(err)
          res.status(500).send('An error occurred')
        }
        fs.unlinkSync(path.join(__dirname, 'temp.xlsx'))
      })
    })
    .catch((error) => {
      console.error(error)
      res.status(500).send('An error occurred')
    })


})

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})

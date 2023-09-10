import { Request, Response } from 'express'
import { msService } from '../../services/ms.service'
import * as _ from 'lodash'
import path from 'path'
import axios from 'axios'
import { STORAGE_BASE_URL } from '../../utils/firebase'
import fs from 'fs'
import ExcelJS from 'exceljs'
import { reportService } from '../../services/report.service'
import { nanoid } from 'nanoid'
import { storageService } from '../../services/storage.service'


export class TemplateController {

  async getProcessingOrdersLength(req: Request, res: Response) {
    const start = req.query.start as string
    const end = req.query.end as string
    if (!start) return res.status(500).send({ message: 'param `start` is required' })
    const processingOrdersRes = await msService.getProcessingOrdersByDate(start, end)
    if (processingOrdersRes.error) return res.status(500).send(processingOrdersRes.error)
    if (processingOrdersRes.data.rows.length >= 1000) return res.status(500).send({ message: 'Максимальное количество обрабатываемых заказов на производство - 1000. Попробуйте выбрать другой диапазон' })
    const newReportRes = await reportService.create({
      id: nanoid(),
      status: 'pending',
      title: `"Заказы на производство" с ${start} ${end ? 'по ' + end : ''}`,
      type: 'processing_order',
      createdAt: Date.now(),
      length: processingOrdersRes.data.rows.length
    })
    if (newReportRes.error || !newReportRes.data) return res.status(500).send(newReportRes.error)
    res.send(newReportRes.data)
  }

  async getProcessingOrdersReport(req: Request, res: Response) {
    const { start, end, reportId } = req.query as Record<string, string>
    let resData: any[] = []
    if (!start || !reportId) {
      await reportService.cancel(reportId)
      return res.status(500).send({ message: 'params `start` adn `reportId` are required', reportId })
    }
    const processingOrdersRes = await msService.getProcessingOrdersByDate(start, end)
    if (processingOrdersRes.error || !processingOrdersRes.data) {
      await reportService.cancel(reportId)
      return res.status(500).send({ ...processingOrdersRes.error, reportId })
    }
    const processingOrders = processingOrdersRes.data.rows
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
        await reportService.cancel(reportId)
        return res.status(500).send({ ...stockRes.error, reportId })// TODO: вместо этого отработать ошибку
      }
      if (isNaN(stockRes.data) && groupedPositions[key].length > 1) {
        // TODO: stock равна NaN тогда, когда позиция в архиве. Нет смысла делать запрос, если позиция архивная, нужно сделать проверку на это прежде чем отправлять запрос.
        groupedPosIndex++
        while (isNaN(stockRes.data) && groupedPosIndex < groupedPositions[key].length) {
          console.log(`${groupedPositions[key][groupedPosIndex].assortment.id} ${groupedPositions[key][groupedPosIndex].assortment.name} - stock not found`)
          const id = groupedPositions[key][groupedPosIndex]?.assortment?.id
          if (!id) continue
          stockRes = await msService.getProductStock(id)
          if (stockRes.error) {
            await reportService.cancel(reportId)
            return res.status(500).send({ ...stockRes.error, reportId })
          }
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

    resData.sort((a, b) => {
      const positionNameA = a.positionName.toLowerCase()
      const positionNameB = b.positionName.toLowerCase()
      if (positionNameA < positionNameB) return -1
      if (positionNameA > positionNameB) return 1
      return 0
    })

    const localFilePath = path.join(__dirname, 'template-processing-orders.xlsx')
    axios.get('/templates%2Ftemplate-processing-orders.xlsx?alt=media', {
      responseType: 'stream',
      baseURL: STORAGE_BASE_URL
    })
      .then(response => {
        const writer = fs.createWriteStream(localFilePath)
        response.data.pipe(writer)
        return new Promise((resolve, reject) => {
          writer.on('finish', resolve)
          writer.on('error', reject)
        })
      })
      .then(() => {
        const workbook = new ExcelJS.Workbook()
        return workbook.xlsx.readFile(localFilePath)
      })
      .then(workbook => {
        const worksheet = workbook.getWorksheet(1)
        worksheet.getCell('A1').value = `Выгрузка с ${start} ${end ? 'по ' + end : ''}`
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
        return workbook.xlsx.writeBuffer()
      })
      .then((buffer) => {
        console.log('COMPLETED')
        storageService.save(buffer, 'reports', 'Материалы заказов на производство.xlsx').then(url => {
          reportService.complete(reportId, url).then(reportRes => {
            if (reportRes.error || !reportRes.data) return res.status(500).send({ ...reportRes.error, reportId })
            res.send(reportRes.data)
          })
        })
      })
      .catch((error) => {
        return res.status(500).send({ ...error, reportId })
      })

  }
}

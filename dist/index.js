"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const _ = __importStar(require("lodash"));
const path_1 = __importDefault(require("path"));
const exceljs_1 = __importDefault(require("exceljs"));
const fs = __importStar(require("fs"));
const ms_service_1 = require("./services/ms.service");
const cors = require('cors');
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const port = process.env.PORT || 8080;
app.use(express_1.default.json());
app.use(cors());
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let resData = [];
    const processingOrders = (yield ms_service_1.msService.getProcessingOrdersByDate('2023-06-20 00:00:00', '2023-06-27 23:59:00')).data.rows;
    let { positions, notReceivedOrders } = yield ms_service_1.msService.getProcessingOrdersPositions(processingOrders);
    while (notReceivedOrders.length !== 0) {
        console.log(`notReceivedOrders length: ${notReceivedOrders.length}`);
        const newPositions = yield ms_service_1.msService.getProcessingOrdersPositions(notReceivedOrders);
        positions.push(newPositions.positions);
        notReceivedOrders = newPositions.notReceivedOrders;
    }
    positions = positions.map((row) => {
        return {
            assortment: row.assortment,
            uomName: row.assortment.uom.name,
            quantity: row.quantity
        };
    });
    let count = 0;
    const groupedPositions = _.groupBy(positions, ({ assortment }) => assortment.name);
    for (const key of Object.keys(groupedPositions)) {
        let groupedPosIndex = 0;
        let stockRes = yield ms_service_1.msService.getProductStock(groupedPositions[key][groupedPosIndex].assortment.id);
        if (stockRes.error) {
            console.log(stockRes.error);
            throw new Error('stockRes.error'); // TODO: вместо этого отработать ошибку
        }
        if (isNaN(stockRes.data) && groupedPositions[key].length > 1) {
            // TODO: stock равна NaN тогда, когда позиция в архиве. Нет смысла делать запрос, если позиция архивная, нужно сделать проверку на это прежде чем отправлять запрос.
            groupedPosIndex++;
            while (isNaN(stockRes.data) && groupedPosIndex < groupedPositions[key].length) {
                console.log(`${groupedPositions[key][groupedPosIndex].assortment.id} ${groupedPositions[key][groupedPosIndex].assortment.name} - stock not found`);
                const id = (_b = (_a = groupedPositions[key][groupedPosIndex]) === null || _a === void 0 ? void 0 : _a.assortment) === null || _b === void 0 ? void 0 : _b.id;
                if (!id)
                    continue;
                stockRes = yield ms_service_1.msService.getProductStock(id);
                if (isNaN(stockRes.data)) {
                    groupedPosIndex++;
                }
            }
        }
        count++;
        console.log(`stock - ${count}/${Object.keys(groupedPositions).length}`);
        resData.push({
            positionName: groupedPositions[key][groupedPosIndex].assortment.name,
            uomName: groupedPositions[key][groupedPosIndex].uomName,
            quantity: groupedPositions[key].reduce((acc, value) => acc + value.quantity, 0),
            stock: stockRes.data
        });
    }
    const workbook = new exceljs_1.default.Workbook();
    workbook.xlsx.readFile(path_1.default.join(__dirname, 'template.xlsx'))
        .then(() => {
        const worksheet = workbook.getWorksheet(1);
        resData.forEach((data, index) => {
            const rowIndex = index + 3;
            worksheet.getCell(`A${rowIndex}`).value = index + 1;
            worksheet.getCell(`B${rowIndex}`).value = data.positionName;
            worksheet.getCell(`C${rowIndex}`).value = data.uomName;
            worksheet.getCell(`D${rowIndex}`).value = data.quantity;
            worksheet.getCell(`E${rowIndex}`).value = isNaN(data.stock) ? 'Не найдено' : data.stock;
            worksheet.getCell(`F${rowIndex}`).value = '';
            worksheet.getCell(`G${rowIndex}`).value = isNaN(data.stock) ? '-' : data.stock - data.quantity;
        });
        const tempFilePath = path_1.default.join(__dirname, 'temp.xlsx');
        return workbook.xlsx.writeFile(tempFilePath);
    })
        .then(() => {
        console.log('COMPLETED');
        res.download(path_1.default.join(__dirname, 'temp.xlsx'), 'Материалы заказов на производство.xlsx', (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('An error occurred');
            }
            fs.unlinkSync(path_1.default.join(__dirname, 'temp.xlsx'));
        });
    })
        .catch((error) => {
        console.error(error);
        res.status(500).send('An error occurred');
    });
}));
server.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_service_1 = __importDefault(require("./services/http.service"));
const cors = require('cors');
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
app.use(express_1.default.json());
app.use(cors());
app.get('/', (req, res) => {
    http_service_1.default.get('/customerorder/c0e0cfd4-1218-11ee-0a80-043600167160')
        .then(({ data }) => {
        res.json(data);
    });
});
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

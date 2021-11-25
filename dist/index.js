"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config_1 = __importDefault(require("./config"));
const cache_1 = __importDefault(require("./server/database/cache"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const index_js_1 = __importDefault(require("./server/index.js"));
const casesPath = path_1.default.join('server', 'database', 'cases.json');
const tranportPath = path_1.default.join('server', 'database', 'transport.json');
try {
    const casesJSON = fs_1.default.readFileSync(casesPath, 'utf-8');
    const transportJSON = fs_1.default.readFileSync(tranportPath, 'utf-8');
    cache_1.default.cases = JSON.parse(casesJSON);
    cache_1.default.transport = JSON.parse(transportJSON);
    console.log('Cache preloaded!');
    start();
}
catch (err) {
    Promise.all([
        axios_1.default.get(config_1.default.covidCasesEndpoint),
        axios_1.default.get(config_1.default.transportCaseEndpoint)
    ])
        .then(([casesRes, tranpsortRes]) => {
        const cases = casesRes.data;
        cache_1.default.cases = cases;
        fs_1.default.writeFileSync(casesPath, JSON.stringify(cases));
        const transport = tranpsortRes.data;
        cache_1.default.transport = tranpsortRes.data;
        fs_1.default.writeFileSync(tranportPath, JSON.stringify(transport));
        console.log('Cache loaded!');
        start();
    })
        .catch(err => {
        console.error('Failed to start', err);
    });
}
function start() {
    index_js_1.default.run();
    require('./server/cron/notifications.js');
}

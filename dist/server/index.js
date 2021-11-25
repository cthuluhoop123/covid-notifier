"use strict";
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
const app = (0, express_1.default)();
const db = require('./database/database.js');
const helmet = require('helmet');
const cors = require('cors');
const notifications = require('./notifications/notifications.js');
const covidFetcher = require('./covidFetch/fetch.js');
const suburbs = require('./database/suburbs.json');
const { transport } = require('./database/cache.js');
const { transportCaseEndpoint } = require('../config.js');
app.use(cors());
app.use(helmet());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({
    extended: true
}));
app.post('/configure', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, postcodeSIDs } = req.body;
    try {
        if (!isValidPostcodeSIDs(postcodeSIDs)) {
            res.status(400).json({
                error: 'Invalid postcode'
            });
            return;
        }
        if ([...new Set(postcodeSIDs)].length !== postcodeSIDs.length) {
            res.status(400).json({
                error: 'Duplicate postcodes...'
            });
            return;
        }
        const configuredPostcodeSIDs = yield db.updatePostcodes(id, postcodeSIDs);
        res.json(postcodeSIDToSubPost(configuredPostcodeSIDs));
    }
    catch (err) {
        next(err);
    }
}));
app.get('/configuration', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    try {
        const postcodeSIDs = yield db.getPostCodeSIDs(id);
        res.json(postcodeSIDToSubPost(postcodeSIDs));
    }
    catch (err) {
        next(err);
    }
}));
app.post('/createUser', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uuid = yield db.createUser();
        res.json({
            id: uuid
        });
    }
    catch (err) {
        next(err);
    }
}));
app.get('/suburbs', (req, res) => {
    const { postcode } = req.query;
    // @ts-ignore: Object is possibly 'null'.
    if (!postcode || postcode.length < 2) {
        res.json([]);
    }
    res.json(suburbs
        .filter(suburb => suburb.postcode.startsWith(postcode))
        .map(suburb => {
        return {
            postcode: suburb.postcode,
            suburb: suburb.suburb,
            sid: suburb.sid
        };
    }));
});
app.get('/nearCases', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, maxDist } = req.query;
    if (!id) {
        res.status(400).json({
            body: 'Missing id...'
        });
        return;
    }
    try {
        const cases = yield covidFetcher.fetchCases({ uuid: id, maxDist });
        if (!cases.length) {
            res.json([]);
            return;
        }
        res.json(cases[0].nearCases.slice(0, 500));
    }
    catch (err) {
        next(err);
    }
}));
app.get('/transportCases', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transportCases = yield covidFetcher.fetchTransportCases();
        res.json(transportCases);
    }
    catch (err) {
        next(err);
    }
}));
app.use('/subscribe', notifications);
app.use('/*', (req, res) => {
    res.send('404');
});
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        body: 'sorry...'
    });
});
function run() {
    app.listen(process.env.PORT, () => console.log('Running on', process.env.PORT));
}
function isValidPostcodeSIDs(postcodeSIDs) {
    return postcodeSIDs.every(sid => {
        return !!suburbs.find(suburb => suburb.sid === sid);
    });
}
function postcodeSIDToSubPost(postcodeSIDs) {
    const data = [];
    for (const postcode_sid of postcodeSIDs) {
        const suburb = suburbs.find(suburb => suburb.sid === postcode_sid);
        data.push({
            sid: postcode_sid,
            postcode: suburb.postcode,
            suburb: suburb.suburb
        });
    }
    return data;
}
exports.default = { run };

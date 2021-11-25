import dotenv from 'dotenv';
dotenv.config();

import config from './config';
import cache from './server/database/cache';
import path from 'path';
import fs from 'fs';
import request from 'axios';

import server from './server/index.js';

const casesPath = path.join('server', 'database', 'cases.json');
const tranportPath = path.join('server', 'database', 'transport.json');

try {
    const casesJSON = fs.readFileSync(casesPath, 'utf-8');
    const transportJSON = fs.readFileSync(tranportPath, 'utf-8');
    cache.cases = JSON.parse(casesJSON);
    cache.transport = JSON.parse(transportJSON);
    console.log('Cache preloaded!');
    start();
} catch (err) {
    Promise.all([
        request.get(config.covidCasesEndpoint),
        request.get(config.transportCaseEndpoint)
    ])
        .then(([casesRes, tranpsortRes]) => {
            const cases = casesRes.data;
            cache.cases = cases;
            fs.writeFileSync(casesPath, JSON.stringify(cases));

            const transport = tranpsortRes.data;
            cache.transport = tranpsortRes.data;
            fs.writeFileSync(tranportPath, JSON.stringify(transport));

            console.log('Cache loaded!');
            start();
        })
        .catch(err => {
            console.error('Failed to start', err);
        });
}

function start() {
    server.run();
    require('./server/cron/notifications.js');
}
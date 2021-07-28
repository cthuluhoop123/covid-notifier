require('dotenv').config();

const config = require('./config.js');
const cache = require('./server/database/cache.js');
const path = require('path');
const fs = require('fs');
const request = require('superagent');

const cachePath = path.join('server', 'database', 'cases.json');

try {
    const casesJSON = fs.readFileSync(cachePath);
    cache.cases = JSON.parse(casesJSON);
    console.log('Cache preloaded!');
    start();
} catch (err) {
    request.get(config.covidCasesEndpoint)
        .then(res => {
            const cases = res.body;
            cache.cases = cases;
            fs.writeFileSync(cachePath, JSON.stringify(cases));
            console.log('Cache loaded!');
            start();
        });
}

function start() {
    require('./server/index.js');
    require('./server/cron/notifications.js');
}
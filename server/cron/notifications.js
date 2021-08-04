const schedule = require('node-schedule');

const config = require('../../config.js');
const request = require('axios');
const fs = require('fs');
const path = require('path');
const cache = require('../database/cache.js');
const db = require('../database/database.js');
const covidFetch = require('../covidFetch/fetch.js');

const webPush = require('web-push');
const { notificationsSent } = require('../database/database.js');
webPush.setVapidDetails('mailto:dowzhong@gmail.com', process.env.PUBLIC_VAPID, process.env.PRIVATE_VAPID);


schedule.scheduleJob('*/15 * * * *', () => {
    fetch().catch(err => { console.error(err) });
});

console.log('Job scheduled.');

async function updateCache() {
    const casesRes = request.get(config.covidCasesEndpoint);
    const transportRes = request.get(config.transportCaseEndpoint);

    const cases = (await casesRes).data;
    fs.writeFileSync(path.join(__dirname, '..', 'database', 'cases.json'), JSON.stringify(cases));
    cache.cases = cases;

    const transport = (await transportRes).data;
    fs.writeFileSync(path.join(__dirname, '..', 'database', 'transport.json'), JSON.stringify(transport));
    cache.transport = transport;
}

async function fetch() {
    await updateCache();
    const caseRelevantToUsers = await covidFetch.fetchCases({ maxAge: 0 });
    const markAsSent = [];
    for (const userCases of caseRelevantToUsers) {
        const updatedToday = (await Promise.all(
            userCases.nearCases.map(async nearCase => {
                const alreadyNotified = await db
                    .alreadyNotified(nearCase)
                    .catch(err => false);
                if (alreadyNotified) {
                    return false;
                }
                return nearCase;
            })
        )).filter(Boolean);

        if (!updatedToday.length) { continue; }

        markAsSent.push(...updatedToday);

        const { subscription } = userCases;
        if (!subscription) { continue; }



        const payload = JSON.stringify(
            getNonDuplicateVenues(
                updatedToday
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 5)
            )
                .map(updated => {
                    return updated.venue;
                })
        );

        await webPush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
            }
        }, payload).catch(error => {
            if (error.statusCode === 410) {
                // Expired/unsubbed
                db.deleteSubscription(error.endpoint).catch(err => { });
                return;
            }
            console.error(error);
        });
    }

    await db.notificationsSent(markAsSent).catch(err => {
        console.error(err);
    });
}

function getNonDuplicateVenues(cases) {
    const uniqueCases = [];
    for (const covidCase of cases) {
        if (uniqueCases.find(unique => unique.venue === covidCase.venue)) {
            continue;
        }
        uniqueCases.push(covidCase);
    }
    return uniqueCases;
}
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


schedule.scheduleJob('0 * * * *', () => {
    fetch().catch(err => { console.error(err) });
});

console.log('Job scheduled.');

async function updateCache() {
    const res = await request.get(config.covidCasesEndpoint);
    const cases = res.data;

    fs.writeFileSync(path.join(__dirname, '..', 'database', 'cases.json'), JSON.stringify(cases));
    cache.cases = cases;
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
            updatedToday
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 5)
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

    await notificationsSent(markAsSent).catch(err => {
        console.error(err);
    });
}
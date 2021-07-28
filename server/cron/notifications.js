const schedule = require('node-schedule');

const config = require('../../config.js');
const request = require('superagent');
const fs = require('fs');
const path = require('path');
const cache = require('../database/cache.js');
const db = require('../database/database.js');
const covidFetch = require('../covidFetch/fetch.js');

const webPush = require('web-push');
const { notificationsSent } = require('../database/database.js');
webPush.setVapidDetails('mailto:dowzhong@gmail.com', process.env.PUBLIC_VAPID, process.env.PRIVATE_VAPID);

schedule.scheduleJob('0 */1 * * *', () => {
    fetch().catch(err => { console.error(err) });
});

async function updateCache() {
    const res = await request.get(config.covidCasesEndpoint);
    const cases = res.body;
    if (!cache.cases || cache.cases.date !== cases.date && cache.cases.time !== cases.time) {
        fs.writeFileSync(path.join(__dirname, '..', 'database', 'cases.json'), JSON.stringify(cases));
        cache.cases = cases;
    }
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

        webPush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
            }
        }, payload).catch(error => {
            console.error(error);
        }).catch(err => { });
    }

    await notificationsSent(markAsSent).then(res => {
    });
}
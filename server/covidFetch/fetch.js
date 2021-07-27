require('dotenv').config();

const dataEndpoint = 'https://data.nsw.gov.au/data/dataset/0a52e6c1-bc0b-48af-8b45-d791a6d8e289/resource/f3a28eed-8c2a-437b-8ac1-2dab3cf760f9/download/venue-data.json';

const request = require('superagent');

const db = require('../database/database.js');
const suburbs = require('../database/suburbs.json');

const webPush = require('web-push');
webPush.setVapidDetails('mailto:dowzhong@gmail.com', process.env.PUBLIC_VAPID, process.env.PRIVATE_VAPID);

async function fetchCases(uuid) {
    const res = await request.get(dataEndpoint);
    const casesToday = res.body.data.monitor
        .filter(covidCase => {
            const caseDate = new Date(covidCase.Date);
            const today = new Date();

            return today.getDate() - caseDate.getDate() <= 2
                && caseDate.getMonth() === today.getMonth()
                && caseDate.getFullYear() === today.getFullYear();
        })
        .sort((a, b) => new Date(b.Date) - new Date(a.Date));

    const subscriptions = await db.getSubscriptions(uuid);
    const nearCases = [];
    for (const subscription of subscriptions) {
        for (const postcodeSID of subscription.postcodeSIDs) {
            const userSuburb = suburbs.find(suburb => suburb.sid === postcodeSID);

            nearCases.push(
                {
                    ...subscription,
                    nearCases: casesToday.filter(covidCase => {
                        return distance(
                            Number(covidCase.Lat), Number(covidCase.Lon),
                            Number(userSuburb.lat), Number(userSuburb.lng)
                        ) <= 10;
                    }).map(data => {
                        return {
                            venue: data.Venue,
                            address: data.Address,
                            suburb: data.Suburb,
                            date: data.Date,
                            time: data.Time,
                            adviceHTML: data.HealthAdviceHTML
                        }
                    })
                }
            );
        }
    }
    return nearCases;
}

fetchCases('39082558-b759-47d5-be08-e59a8a043e47')
    .then(data => {
        const nearCases = data[0].nearCases;
        const venues = nearCases.map(covid => covid.venue);

        console.log(venues)
        // console.log(Buffer.from(JSON.stringify(nearCases.slice(0, 10))).length);

        // const payload = JSON.stringify(JSON.stringify(nearCases.slice(0, 10)));

        // webPush.sendNotification({
        //     endpoint: subscription.endpoint,
        //     keys: {
        //         p256dh: subscription.p256dh,
        //         auth: subscription.auth
        //     }
        // }, payload).catch(error => {
        //     console.error(error);
        // });
    })
    .catch(console.error);


// https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
function distance(lat1, lon1, lat2, lon2) {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p) / 2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p)) / 2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

module.exports = { fetchCases };
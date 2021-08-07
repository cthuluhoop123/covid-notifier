require('dotenv').config();

const db = require('../database/database.js');
const cache = require('../database/cache.js');
const suburbs = require('../database/suburbs.json');
const { transportCaseEndpoint } = require('../../config.js');
const { transport } = require('../database/cache.js');

async function fetchCases({ uuid, maxDist = 10, maxAge = 3 }) {
    const casesToday = cache.cases.data.monitor
        .filter(covidCase => {
            const caseDate = new Date(covidCase['Last updated date']);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today - caseDate <= 1000 * 60 * 60 * 24 * maxAge;
        })
        .sort((a, b) => new Date(b['Last updated date']) - new Date(a['Last updated date']));

    const users = await db.getUsers(uuid);
    const nearCases = [];

    for (const user of users) {
        const data = { nearCases: [] };
        const [subscription] = await db.getSubscriptions(user.userId);
        if (subscription) {
            data.subscription = {
                userId: subscription.userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.p256dh,
                auth: subscription.auth
            };
        }
        const firstPostcodeSuburb = suburbs.find(suburb => suburb.sid === user.postcodeSIDs[0]);
        for (const postcodeSID of user.postcodeSIDs) {
            const userSuburb = suburbs.find(suburb => suburb.sid === postcodeSID);
            data.nearCases.push(
                ...casesToday
                    .filter(covidCase => {
                        return distance(
                            Number(covidCase.Lat), Number(covidCase.Lon),
                            Number(userSuburb.lat), Number(userSuburb.lng)
                        ) <= maxDist;
                    })
                    .map(data => {
                        return {
                            venue: data.Venue,
                            address: data.Address,
                            suburb: data.Suburb,
                            date: data.Date,
                            time: data.Time,
                            adviceHTML: data.HealthAdviceHTML,
                            updated: data['Last updated date'],
                            latlng: [data.Lat, data.Lon],
                            distance: distance(
                                Number(data.Lat), Number(data.Lon),
                                Number(firstPostcodeSuburb.lat), Number(firstPostcodeSuburb.lng)
                            ),
                            contact: data.HealthAdviceHTML.includes('close') ? 'Close' : 'Casual'
                        }
                    })
            );
        }

        nearCases.push(data);
    }

    return nearCases;
}

function fetchTransportCases(maxAge = 3) {
    const transportCasesToday = cache.transport.data
        .filter(transportCase => {
            const caseDate = new Date(transportCase.last_updated);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today - caseDate <= 1000 * 60 * 60 * 24 * maxAge;
        })
        .sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));

    const trains = [];
    const buses = [];
    const metro = [];

    for (const transportCase of transportCasesToday) {
        if (transportCase.by === 'Bus') {
            buses.push(transportCase);
        }
        if (transportCase.by === 'Train') {
            trains.push(transportCase);
        }
        if (transportCase.by === 'Metro') {
            metro.push(transportCase);
        }
    }

    return { trains, buses, metro };
}

// https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
function distance(lat1, lon1, lat2, lon2) {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p) / 2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p)) / 2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

module.exports = { fetchCases, fetchTransportCases };
require('dotenv').config();

import db from '../database/database';
import cache from '../database/cache';
import suburbs from '../database/suburbs.json';

import {
    CaseFilter,
    Subscription,
    NearCase,
    TransportCase,
    CasesData
} from '../types';

async function fetchCases({ uuid, maxDist = 10, maxAge = 3 }: CaseFilter): Promise<CasesData[]> {
    if (!cache.cases.data.monitor) { return []; }

    const casesToday = cache.cases.data.monitor
        .filter((covidCase: any) => {
            const caseDate = new Date(covidCase['Last updated date']);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today.getTime() - caseDate.getTime() <= 1000 * 60 * 60 * 24 * maxAge;
        })
        .sort((a: any, b: any) => new Date(b['Last updated date']).getTime() - new Date(a['Last updated date']).getTime());

    const users = await db.getUsers(uuid);
    const nearCases: CasesData[] = [];

    for (const user of users) {
        const data: CasesData = { nearCases: [] };
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
        if (!firstPostcodeSuburb) { continue; }
        for (const postcodeSID of user.postcodeSIDs) {
            const userSuburb = suburbs.find(suburb => suburb.sid === postcodeSID);
            if (!userSuburb) { continue; }
            data.nearCases.push(
                ...casesToday
                    .filter((covidCase: any) => {
                        return distance(
                            Number(covidCase.Lat), Number(covidCase.Lon),
                            Number(userSuburb.lat), Number(userSuburb.lng)
                        ) <= maxDist
                            && !data.nearCases.find(existingCase => {
                                return db.caseToKey(existingCase) === db.unparsedCasetoKey(covidCase);
                            });
                    })
                    .map((data: any) => {
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
        .filter((transportCase: any) => {
            const caseDate = new Date(transportCase.last_updated);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today.getTime() - caseDate.getTime() <= 1000 * 60 * 60 * 24 * maxAge;
        })
        .sort((a: any, b: any) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());

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
function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p) / 2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p)) / 2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

export default { fetchCases, fetchTransportCases };
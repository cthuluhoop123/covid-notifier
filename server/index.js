const express = require('express');
const app = express();

const db = require('./database/database.js');

const helmet = require('helmet');
const cors = require('cors');

const notifications = require('./notifications/notifications.js');
const covidFetcher = require('./covidFetch/fetch.js');

const suburbs = require('./database/suburbs.json');

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cors());


app.post('/configure', async (req, res, next) => {
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
        const configuredPostcodeSIDs = await db.updatePostcodes(id, postcodeSIDs);
        res.json(postcodeSIDToSubPost(configuredPostcodeSIDs));
    } catch (err) {
        next(err);
    }
});

app.get('/configuration', async (req, res, next) => {
    const { id } = req.query;
    try {
        const postcodeSIDs = await db.getPostCodeSIDs(id);
        res.json(postcodeSIDToSubPost(postcodeSIDs));
    } catch (err) {
        next(err);
    }
});

app.post('/createUser', async (req, res, next) => {
    try {
        const uuid = await db.createUser();
        res.json({
            id: uuid
        });
    } catch (err) {
        next(err);
    }
});

app.get('/suburbs', (req, res) => {
    const { postcode } = req.query;
    if (!postcode || postcode.length < 2) {
        res.json([]);
    }
    res.json(
        suburbs
            .filter(suburb => suburb.postcode.startsWith(postcode))
            .map(suburb => {
                return {
                    postcode: suburb.postcode,
                    suburb: suburb.suburb,
                    sid: suburb.sid
                }
            })
    );
});

app.get('/nearCases', async (req, res, next) => {
    const { id } = req.query;

    if (!id) {
        res.status(400).json({
            body: 'Missing id...'
        })
        return;
    }

    try {
        const cases = await covidFetcher.fetchCases({ uuid: id });
        if (!cases.length) {
            res.json([]);
            return;
        }

        res.json(cases[0].nearCases.slice(0, 500));
    } catch (err) {
        next(err);
    }
});

app.use('/subscribe', notifications);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        body: 'sorry...'
    });
})

app.listen(process.env.PORT, () => console.log('Running on', process.env.PORT));

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
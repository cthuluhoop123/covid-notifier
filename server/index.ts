import express, { Response, Request, NextFunction, Errback } from 'express';

const app = express();

import db from './database/database';

import helmet from 'helmet';
import cors from 'cors';

import notifications from './notifications/notifications'
import covidFetcher from './covidFetch/fetch';

import suburbs from './database/suburbs.json';

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


app.post('/configure', async (req: Request, res: Response, next: NextFunction) => {
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

app.get('/configuration', async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    try {
        const postcodeSIDs = await db.getPostCodeSIDs(<string>id);
        res.json(postcodeSIDToSubPost(postcodeSIDs));
    } catch (err) {
        next(err);
    }
});

app.post('/createUser', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const uuid = await db.createUser();
        res.json({
            id: uuid
        });
    } catch (err) {
        next(err);
    }
});

app.get('/suburbs', (req: Request, res: Response) => {
    const { postcode } = req.query;
    // @ts-ignore: Object is possibly 'null'.
    if (!postcode || postcode.length < 2) {
        res.json([]);
        return;
    }
    res.json(
        suburbs
            .filter(suburb => suburb.postcode.startsWith(<string>postcode))
            .map(suburb => {
                return {
                    postcode: suburb.postcode,
                    suburb: suburb.suburb,
                    sid: suburb.sid
                }
            })
    );
});

app.get('/nearCases', async (req: Request, res: Response, next: NextFunction) => {
    const { id, maxDist } = req.query as { id: string, maxDist: string };

    if (!id) {
        res.status(400).json({
            body: 'Missing id...'
        })
        return;
    }

    try {
        const cases = await covidFetcher.fetchCases({ uuid: id, maxDist: Number(maxDist) });
        if (!cases.length) {
            res.json([]);
            return;
        }
        res.json(cases[0].nearCases.slice(0, 500));
    } catch (err) {
        next(err);
    }
});

app.get('/transportCases', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transportCases = await covidFetcher.fetchTransportCases();
        res.json(transportCases);
    } catch (err) {
        next(err);
    }
});

app.use('/subscribe', notifications);

app.use('/*', (req, res) => {
    res.send('404');
});

app.use((err: Errback, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({
        body: 'sorry...'
    });
})

function run() {
    app.listen(process.env.PORT, () => console.log('Running on', process.env.PORT));
}

function isValidPostcodeSIDs(postcodeSIDs: string[]) {
    return postcodeSIDs.every(sid => {
        return !!suburbs.find(suburb => suburb.sid === sid);
    });
}

function postcodeSIDToSubPost(postcodeSIDs: string[]) {
    const data = [];
    for (const postcode_sid of postcodeSIDs) {
        const suburb = suburbs.find(suburb => suburb.sid === postcode_sid);
        if (!suburb) { continue; }
        data.push({
            sid: postcode_sid,
            postcode: suburb.postcode,
            suburb: suburb.suburb
        });
    }
    return data;
}

export default { run };
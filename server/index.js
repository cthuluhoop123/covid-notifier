const express = require('express');
const app = express();

const db = require('./database.js');

const helmet = require('helmet');
const cors = require('cors');

const notifications = require('./notifications/notifications.js');

const suburbs = require('./suburbs.json');

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cors());


app.post('/configure', async (req, res, next) => {
    const { id, postcodes } = req.body;
    try {
        if (!isValidPostcodes(postcodes)) {
            res.status(400).json({
                error: 'Invalid postcode'
            });
            return;
        }
        if ([...new Set(postcodes)].length !== postcodes.length) {
            res.status(400).json({
                error: 'Duplicate postcodes'
            });
            return;
        }
        const configuredPostcodes = await db.updatePostcodes(id, postcodes);
        res.json(postcodeToSubPost(configuredPostcodes));
    } catch (err) {
        next(err);
    }
});

app.get('/configuration', async (req, res, next) => {
    const { id } = req.query;
    try {
        const postcodes = await db.getPostCodes(id);
        res.json(postcodeToSubPost(postcodes));
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

app.use('/subscribe', notifications);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        body: 'sorry...'
    });
})

app.listen(process.env.PORT, () => console.log('Running on', process.env.PORT));

function isValidPostcodes(postcodes) {
    return postcodes.every(postcode => {
        return !!suburbs.find(suburb => suburb.postcode === postcode);
    });
}

function postcodeToSubPost(postcodes) {
    const data = [];
    for (const postcode of postcodes) {
        data.push({
            postcode,
            suburb: suburbs.find(suburb => suburb.postcode === postcode).suburb
        });
    }
    return data;
}
const { Router } = require('express');

const db = require('../database/database.js');

const webPush = require('web-push');
webPush.setVapidDetails('mailto:dowzhong@gmail.com', process.env.PUBLIC_VAPID, process.env.PRIVATE_VAPID);

const router = Router();

router.post('/', (req, res) => {
    const subscription = req.body;
    console.log(subscription);
    res.status(201).json({});
    const payload = JSON.stringify({ title: 'test' });

    webPush.sendNotification(subscription, payload).catch(error => {
        console.error(error);
    });
});


router.post('/sub', async (req, res, next) => {
    const { id, subscription } = req.body;
    try {
        await db.createSubscription(id, subscription);
        res.json({});
    } catch (err) {
        next(err);
    }
});

module.exports = router;
const { Router } = require('express');

const db = require('../database/database.js');

const webPush = require('web-push');
webPush.setVapidDetails('mailto:dowzhong@gmail.com', process.env.PUBLIC_VAPID, process.env.PRIVATE_VAPID);

const router = Router();

router.post('/sub', async (req, res, next) => {
    const { id, subscription } = req.body;
    try {
        await db.createSubscription(id, subscription);
        res.json({});
    } catch (err) {
        next(err);
    }
});

router.post('/resub', async (req, res, next) => {
    const { oldEndpoint, newSub } = req.body;
    try {
        await db.renewSubscription(oldEndpoint, newSub);
        res.json({});
    } catch (err) {
        next(err);
    }
});

module.exports = router;
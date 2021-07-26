const { Router } = require('express');

const webPush = require('web-push');
webPush.setVapidDetails('mailto:dowzhong@gmail.com', process.env.PUBLIC_VAPID, process.env.PRIVATE_VAPID);

const router = Router();

router.post('/', (req, res) => {
    const subscription = req.body;
    res.status(201).json({});
    const payload = JSON.stringify({ title: 'test' });

    webPush.sendNotification(subscription, payload).catch(error => {
        console.error(error);
    });
});

module.exports = router;
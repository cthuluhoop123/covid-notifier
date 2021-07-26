const express = require('express');
const app = express();

const helmet = require('helmet');
const cors = require('cors');
const webPush = require('web-push');

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cors());

webPush.setVapidDetails('mailto:dowzhong@gmail.com', process.env.PUBLIC_VAPID, process.env.PRIVATE_VAPID);

app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    console.log(subscription);
    res.status(201).json({});
    const payload = JSON.stringify({ title: 'test' });

    webPush.sendNotification(subscription, payload).catch(error => {
        console.error(error);
    });
});

app.listen(process.env.PORT, () => console.log('Running on', process.env.PORT));
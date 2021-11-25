import { Router, Request, Response, NextFunction } from 'express';

import db from '../database/database';

import webPush from 'web-push';
webPush.setVapidDetails('mailto:dowzhong@gmail.com', <string>process.env.PUBLIC_VAPID, <string>process.env.PRIVATE_VAPID);

const router = Router();

router.post('/sub', async (req: Request, res: Response, next: NextFunction) => {
    const { id, subscription } = req.body;
    try {
        await db.createSubscription(id, subscription);
        res.json({});
    } catch (err) {
        next(err);
    }
});

router.post('/resub', async (req: Request, res: Response, next: NextFunction) => {
    const { oldEndpoint, newSub } = req.body;
    try {
        await db.renewSubscription(oldEndpoint, newSub);
        res.json({});
    } catch (err) {
        next(err);
    }
});

export default router;
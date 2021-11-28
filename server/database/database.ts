import Knex from 'knex';

const knex = Knex({
    client: 'sqlite3',
    connection: {
        filename: './data.db',
    },
});

import { v4 as uuid } from 'uuid';

// Refactor this and move interfaces/types into a centralized folder?
import { NearCase, Subscription } from '../types';

interface User {
    id: string,
}

interface UserPostcodes {
    userId: string,
    postcodeSIDs: string[]
}

export default {
    async getUsers(uuid: string): Promise<UserPostcodes[]> {
        const query = knex('users')
            .select()
            .innerJoin('postcode_sids', 'users.id', 'postcode_sids.user_id')
            .orderBy('postcode_sids.index', 'asc');

        if (uuid) {
            query.where('users.id', uuid);
        }

        const users = await query;

        return users.reduce((acc: UserPostcodes[], cur) => {
            const existing = acc.find(user => user.userId === cur.user_id);
            if (existing) {
                existing.postcodeSIDs.push(cur.postcode_sid);
                return acc;
            }
            acc.push({
                userId: cur.user_id,
                postcodeSIDs: [cur.postcode_sid]
            });
            return acc;
        }, []);
    },
    async notificationsSent(serviceNSWCases: NearCase[]) {
        const keys = serviceNSWCases.map(nswCase => this.caseToKey(nswCase));
        return Promise.all(
            keys.map(key => {
                return knex('notifications_sent')
                    .insert({
                        case_key: key
                    })
                    .onConflict('case_key')
                    .ignore();
            })
        );
    },
    async alreadyNotified(serviceNSWCase: NearCase) {
        const key = this.caseToKey(serviceNSWCase);
        const sent = await knex('notifications_sent')
            .where('case_key', key);
        return sent.length > 0;
    },
    async getSubscriptions(uuid: string) {
        const query = knex('subscriptions')
            .select()
            .innerJoin('postcode_sids', 'subscriptions.user_id', 'postcode_sids.user_id');

        if (uuid) {
            query.where('subscriptions.user_id', uuid);
        }

        const users: Subscription[] = await query;

        return users.reduce((acc: Subscription[], cur: any) => {
            const existing = acc.find(user => user.userId === cur.user_id);
            if (existing) {
                // @ts-ignore Object is possibly 'undefined'.
                existing.postcodeSIDs.push(cur.postcode_sid);
                return acc;
            }
            acc.push({
                userId: cur.user_id,
                endpoint: cur.endpoint,
                p256dh: cur.p256dh,
                auth: cur.auth,
                postcodeSIDs: [cur.postcode_sid]
            });
            return acc;
        }, []);
    },
    async updatePostcodes(uuid: string, postcodeSIDs: string[] = []) {
        if (!uuid) {
            throw new Error('ID missing.');
        }

        /**
         * For simplicity we will just delete every post code and recreate.
         * This is to avoid adding multiple edit endpoints.
         */

        await knex('postcode_sids')
            .where('user_id', uuid)
            .del();

        await Promise.all(
            postcodeSIDs.map((sid, index) => {
                return knex('postcode_sids')
                    .insert({
                        user_id: uuid,
                        postcode_sid: sid,
                        index
                    })
            })
        );

        return this.getPostCodeSIDs(uuid);
    },
    async getPostCodeSIDs(uuid: string) {
        if (!uuid) {
            throw new Error('ID missing.');
        }

        const result = await knex('postcode_sids')
            .where('user_id', uuid)
            .orderBy('index', 'asc');

        return result.map(entry => {
            return entry.postcode_sid;
        });
    },
    async createUser() {
        const id = uuid();
        await knex('users')
            .insert({
                id
            });
        return id;
    },
    async createSubscription(uuid: string, subscription: any) {
        const user = await knex('subscriptions')
            .insert({
                user_id: uuid,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            })
            .onConflict('user_id')
            .merge();
    },
    renewSubscription(oldEndpoint: any, newData: any) {
        return knex('subscriptions')
            .update({
                endpoint: newData.newEndpoint,
                p256dh: newData.newP256dh,
                auth: newData.newAuth
            })
            .where('subscriptions.endpoint', oldEndpoint);
    },
    deleteSubscription(endpoint: string) {
        return knex('subscriptions')
            .where('subscriptions.endpoint', endpoint)
            .del();
    },
    caseToKey(covidCase: NearCase) {
        return covidCase.venue
            + covidCase.address
            + covidCase.suburb
            + covidCase.date
            + covidCase.time
            + covidCase.updated;
    },
    unparsedCasetoKey(unparsedCase: any) {
        return unparsedCase.Venue
            + unparsedCase.Address
            + unparsedCase.Suburb
            + unparsedCase.Date
            + unparsedCase.Time
            + unparsedCase['Last updated date'];
    }
};
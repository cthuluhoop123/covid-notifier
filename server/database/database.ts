import Knex from 'knex';

const knex = Knex({
    client: 'sqlite3',
    connection: {
        filename: './data.db',
    },
});

const uuid = require('uuid').v4;

interface User {
    id: number,
}

interface UserPostcodes {
    userId: number,
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

        const users= await query;

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
    async notificationsSent(serviceNSWCases) {
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
    async alreadyNotified(serviceNSWCase) {
        const key = this.caseToKey(serviceNSWCase);
        const sent = await knex('notifications_sent')
            .where('case_key', key);
        return sent.length > 0;
    },
    async getSubscriptions(uuid) {
        const query = knex('subscriptions')
            .select()
            .innerJoin('postcode_sids', 'subscriptions.user_id', 'postcode_sids.user_id');

        if (uuid) {
            query.where('subscriptions.user_id', uuid);
        }

        const users = await query;

        return users.reduce((acc, cur) => {
            const existing = acc.find(user => user.userId === cur.user_id);
            if (existing) {
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
    async updatePostcodes(uuid, postcodeSIDs = []) {
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
    async getPostCodeSIDs(uuid) {
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
    async createSubscription(uuid, subscription) {
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
    renewSubscription(oldEndpoint, newData) {
        return knex('subscriptions')
            .update({
                endpoint: newData.newEndpoint,
                p256dh: newData.newP256dh,
                auth: newData.newAuth
            })
            .where('subscriptions.endpoint', oldEndpoint);
    },
    deleteSubscription(endpoint) {
        return knex('subscriptions')
            .where('subscriptions.endpoint', endpoint)
            .del();
    },
    caseToKey(covidCase) {
        return covidCase.venue
            + covidCase.address
            + covidCase.suburb
            + covidCase.date
            + covidCase.time
            + covidCase.updated;
    },
    unparsedCasetoKey(unparsedCase) {
        return unparsedCase.Venue
            + unparsedCase.Address
            + unparsedCase.Suburb
            + unparsedCase.Date
            + unparsedCase.Time
            + unparsedCase['Last updated date'];
    }
};
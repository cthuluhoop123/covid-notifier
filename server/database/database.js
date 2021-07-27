const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './data.db',
    },
});

const uuid = require('uuid').v4;

module.exports = {
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
            postcodeSIDs.map(sid => {
                return knex('postcode_sids')
                    .insert({
                        user_id: uuid,
                        postcode_sid: sid
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
            .where('user_id', uuid);

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
            });
    }
};
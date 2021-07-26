const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './data.db',
    },
});

const uuid = require('uuid').v4;

module.exports = {
    async updatePostcodes(uuid, postcodes = []) {
        if (!uuid) {
            throw new Error('ID missing.');
        }

        /**
         * For simplicity we will just delete every post code and recreate.
         * This is to avoid adding multiple edit endpoints.
         */

        await knex('postcodes')
            .where('user_id', uuid)
            .del();

        await Promise.all(
            postcodes.map(postcode => {
                return knex('postcodes')
                    .insert({
                        user_id: uuid,
                        postcode
                    })
            })
        );

        return this.getPostCodes(uuid);
    },
    async getPostCodes(uuid) {
        if (!uuid) {
            throw new Error('ID missing.');
        }

        const result = await knex('postcodes')
            .where('user_id', uuid);
        
        return result.map(entry => {
            return entry.postcode;
        });
    },
    async createUser() {
        const id = uuid();
        await knex('users')
            .insert({
                id
            });
        return id;
    }
};
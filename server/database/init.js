if (!process.argv.includes('-f')) {
    console.log('Use -f...');
    return;
}

const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './data.db',
    },
});

knex.schema
    .createTable('users', table => {
        table.string('id').primary();
    })
    .createTable('postcode_sids', table => {
        table
            .string('user_id')
            .references('users.id');

        table
            .string('postcode_sid');

        table.unique(['user_id', 'postcode_sid']);
    })
    .createTable('subscriptions', table => {
        table
            .string('user_id')
            .references('users.id')
            .unique();

        table
            .string('endpoint');

        table
            .string('p256dh');

        table
            .string('auth');
    })
    .catch(e => {
        console.error(e);
    });
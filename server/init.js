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
        table.string('id');
    })
    .createTable('postcodes', table => {
        table
            .string('user_id')
            .references('users.id');
        
        table
            .string('postcode');

        table.unique(['user_id', 'postcode']);
    })
    .catch(e => {
        console.error(e);
    });
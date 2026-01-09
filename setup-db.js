import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function setupDatabase() {
    // First, connect to the default 'postgres' database to create our database
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres', // Your PostgreSQL password
        database: 'postgres', // Connect to default database first
    });

    try {
        await client.connect();
        console.log('✓ Connected to PostgreSQL');

        // Check if database exists
        const checkDb = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = 'glee_planner'"
        );

        if (checkDb.rows.length === 0) {
            // Create database
            await client.query('CREATE DATABASE glee_planner;');
            console.log('✓ Database "glee_planner" created successfully!');
        } else {
            console.log('✓ Database "glee_planner" already exists');
        }

        await client.end();
        console.log('\n✓ Setup complete! Now run: npm run db:push');
    } catch (error) {
        console.error('✗ Error:', error.message);
        console.log('\nTip: Make sure PostgreSQL is running and the password is correct.');
        process.exit(1);
    }
}

setupDatabase();

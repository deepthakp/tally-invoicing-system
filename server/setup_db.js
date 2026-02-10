const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
    try {
        console.log('Connecting to MySQL...');
        // Connect to MySQL server (no database selected)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('Connected. Running schema...');

        // Read schema
        const schemaPath = path.join(__dirname, '../schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await connection.query(schema);

        console.log('Database and tables created successfully!');
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('Error setting up database:', err.message);
        process.exit(1);
    }
}

setup();

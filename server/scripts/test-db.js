const { connectDB, sql } = require('../src/config/db');

async function testConnection() {
    console.log('Testing Database Connection...');
    try {
        const pool = await connectDB();
        console.log('SUCCESS: Connected to SQL Server!');
        console.log('Verifying permissions...');
        const result = await sql.query('SELECT @@VERSION as version');
        console.log('SQL Version:', result.recordset[0].version);
        pool.close();
        process.exit(0);
    } catch (err) {
        console.error('CONNECTION FAILED:', err.message);
        process.exit(1);
    }
}

testConnection();

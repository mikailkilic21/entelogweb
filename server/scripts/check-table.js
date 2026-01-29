const { connectDB, sql } = require('../src/config/db');

async function checkTable() {
    console.log('Checking LG_113_ITEMS...');
    try {
        await connectDB();
        const result = await sql.query("SELECT TOP 1 LOGICALREF FROM LG_113_ITEMS");
        console.log('SUCCESS: Table LG_113_ITEMS exists and has data!');
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err.message);
        process.exit(1);
    }
}

checkTable();

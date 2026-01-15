const { sql, connectDB, getConfig } = require('./src/config/db');

async function checkColumns() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const table = `LG_${firm}_${period}_ORFICHE`;

        console.log(`Checking columns for ${table}...`);

        const result = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = '${table}'
            ORDER BY COLUMN_NAME
        `);

        console.log('Columns:', result.recordset.map(r => r.COLUMN_NAME).join(', '));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkColumns();

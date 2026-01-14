const { sql, connectDB, getConfig } = require('./src/config/db');

async function checkColumns() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const table = `LG_${firm}_${period}_ORFLINE`;

        console.log(`Checking table: ${table}`);

        const query = `SELECT TOP 1 * FROM ${table}`;
        const result = await sql.query(query);

        if (result.recordset.length > 0) {
            console.log('Columns:', Object.keys(result.recordset[0]));
        } else {
            console.log('Table is empty, cannot verify columns readily via SELECT *. Attempting sys.columns.');
            const schemaQuery = `
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${table}'
             `;
            const schemaResult = await sql.query(schemaQuery);
            console.log('Schema Columns:', schemaResult.recordset.map(r => r.COLUMN_NAME));
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkColumns();

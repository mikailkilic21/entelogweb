const { sql, getConfig, connectDB } = require('./src/config/db');

async function debugColumns() {
    try {
        const pool = await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';

        const cslinesTable = `LG_${firm}_${period}_CSLINES`;
        const csrollTable = `LG_${firm}_${period}_CSROLL`;

        console.log(`Checking columns for ${cslinesTable} and ${csrollTable}`);

        const r1 = await pool.request().query(`SELECT TOP 1 * FROM ${cslinesTable}`);
        console.log(`--- ${cslinesTable} Columns ---`);
        console.log(Object.keys(r1.recordset[0] || {}));

        const r2 = await pool.request().query(`SELECT TOP 1 * FROM ${csrollTable}`);
        console.log(`--- ${csrollTable} Columns ---`);
        console.log(Object.keys(r2.recordset[0] || {}));

        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

debugColumns();

const { sql, connectDB, getConfig } = require('./server/src/config/db');

async function run() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';

        const tables = [
            `LG_${firm}_${period}_CSCARD`,
            `LG_${firm}_${period}_CSROLL`,
            `LG_${firm}_${period}_CSLINES`,
            `LG_${firm}_CLCARD`
        ];

        console.log("--- Table Existence Check ---");
        for (const t of tables) {
            try {
                const res = await sql.query(`SELECT TOP 1 1 as ok FROM ${t}`);
                console.log(`✅ ${t}: Exists`);

                // If it's CSCARD, show sample data for OWING and other fields
                if (t.includes('CSCARD')) {
                    const data = await sql.query(`SELECT TOP 3 PORTFOYNO, SERINO, OWING, KEFIL, BANKNAME, AMOUNT, CURRSTAT FROM ${t}`);
                    console.log("Sample Data:", JSON.stringify(data.recordset, null, 2));
                }
            } catch (e) {
                console.log(`❌ ${t}: Not found or error: ${e.message}`);
            }
        }

    } catch (error) {
        console.error("Critical Error:", error);
    }
}

run();

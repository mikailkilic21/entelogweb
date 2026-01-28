const { sql, getConfig, connectDB } = require('./src/config/db');

async function guessTables() {
    try {
        const pool = await connectDB();
        const { firmNo, periodNo } = await getConfig();
        const firm = firmNo.toString().padStart(3, '0');
        const period = periodNo.toString().padStart(2, '0');

        console.log(`Firm: ${firm}, Period: ${period}`);

        const candidates = [
            `LG_${firm}_BNCARD`,
            `LG_${firm}_BANK`,
            `LG_${firm}_BANKCARD`,
            `LG_${firm}_BNACCOUNT`,
            `LG_${firm}_${period}_BNLINE`,
            `LG_${firm}_${period}_BNFLINE`,
            `LG_${firm}_${period}_BANKLINE`,
            `LG_${firm}_${period}_BNFICHE`
        ];

        for (const table of candidates) {
            try {
                // Try selecting 1 row
                await pool.query(`SELECT TOP 1 * FROM ${table}`);
                console.log(`✅ FOUND: ${table}`);
            } catch (err) {
                // console.log(`❌ Missing: ${table}`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

guessTables();

const { sql, getConfig, connectDB } = require('./src/config/db');
const fs = require('fs');

async function investigateCCDetails() {
    try {
        const pool = await connectDB();
        const { firmNo, periodNo } = await getConfig();
        const firm = firmNo.toString().padStart(3, '0');
        const period = periodNo.toString().padStart(2, '0');

        const data = {};

        // 1. Check PAYTRANS (POS)
        try {
            const ptTable = `LG_${firm}_${period}_PAYTRANS`;
            console.log(`Checking ${ptTable}...`);
            const ptRes = await pool.query(`
                SELECT TOP 5 * FROM ${ptTable} WHERE MODULENR = 7 -- Bank module transactions? 
                -- Actually for CC POS, MODULENR is usually 10 (Cari) or 2 (Fatura)
                -- Source: TRCODE 2 in PAYTRANS is CC
            `);
            data.paytrans = ptRes.recordset;

            const ptStats = await pool.query(`
                SELECT TRCODE, COUNT(*) as total, SUM(TOTAL) as sumTotal
                FROM ${ptTable}
                WHERE TRCODE = 2 -- Credit Card
                GROUP BY TRCODE
            `);
            data.paytransStats = ptStats.recordset;

        } catch (e) {
            data.paytransError = e.message;
        }

        // 2. Check BNCREDITCARD (Firm CC)
        try {
            const ccTable = `LG_${firm}_BNCREDITCARD`;
            console.log(`Checking ${ccTable}...`);
            const ccRes = await pool.query(`SELECT TOP 5 * FROM ${ccTable}`);
            data.bnCreditCard = ccRes.recordset;
        } catch (e) {
            data.bnCreditCardError = e.message;
        }

        fs.writeFileSync('cc_details.json', JSON.stringify(data, null, 2));
        console.log('✅ cc_details.json created');

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

investigateCCDetails();

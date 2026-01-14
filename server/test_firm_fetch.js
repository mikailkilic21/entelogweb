const { sql, connectDB, getConfig } = require('./src/config/db');

async function testFirmFetch() {
    try {
        await connectDB();
        const config = getConfig();
        const firmNo = config.firmNo ? parseInt(config.firmNo) : 115; // default fallback

        console.log(`Checking L_CAPIFIRM for NR = ${firmNo}`);

        const result = await sql.query(`SELECT NAME FROM L_CAPIFIRM WHERE NR = ${firmNo}`);

        if (result.recordset.length > 0) {
            console.log("✅ Fetch Success:", result.recordset[0].NAME);
        } else {
            console.log("❌ No record found for firm No:", firmNo);
        }

    } catch (err) {
        console.error("❌ SQL Error:", err);
    } finally {
        process.exit();
    }
}

testFirmFetch();

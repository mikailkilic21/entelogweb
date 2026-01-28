const { sql, getConfig, connectDB } = require('./src/config/db');

async function getPayrollExample() {
    try {
        await connectDB();
        let config = getConfig();
        let firmNo = config.firmNo || 113;
        let periodNo = config.periodNo || 1;

        const firm = firmNo.toString().padStart(3, '0');
        const period = periodNo.toString().padStart(2, '0');

        const cscardTable = `LG_${firm}_${period}_CSCARD`;
        const cstransTable = `LG_${firm}_${period}_CSTRANS`;
        const csrollTable = `LG_${firm}_${period}_CSROLL`;
        const clcardTable = `LG_${firm}_CLCARD`;

        console.log(`Searching for an Own Check (DOC=3) with linked Payroll...`);

        // Find a check that has a transaction linked to a ROLL
        const query = `
            SELECT TOP 1 
                C.NEWSERINO as CheckSerial,
                C.AMOUNT as Amount,
                C.DUEDATE as DueDate,
                T.DATE_ as TransDate,
                R.DATE_ as BordroDate,
                CL.CODE as ClientCode,
                CL.DEFINITION_ as ClientName
            FROM ${cscardTable} C
            JOIN ${cstransTable} T ON C.LOGICALREF = T.CSREF
            JOIN ${csrollTable} R ON T.ROLLREF = R.LOGICALREF
            LEFT JOIN ${clcardTable} CL ON R.CARDREF = CL.LOGICALREF
            WHERE C.DOC = 3
            ORDER BY T.DATE_ DESC
        `;

        const result = await sql.query(query);

        if (result.recordset.length > 0) {
            const row = result.recordset[0];
            const output = {
                "Çek Seri No": row.CheckSerial,
                "Tutar": row.Amount,
                "Vade Tarihi": row.DueDate,
                "İşlem Tarihi": row.TransDate,
                "Bordro Tarihi": row.BordroDate,
                "Bordro Cari (Alıcı)": row.ClientName || 'Tanımsız',
                "Cari Kodu": row.ClientCode
            };

            const fs = require('fs');
            fs.writeFileSync('payroll_example.json', JSON.stringify(output, null, 2));
            console.log('Example saved to payroll_example.json');
        } else {
            console.log('No matching records found.');
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

getPayrollExample();

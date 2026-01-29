
exports.getClientTurnover = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const invoiceTable = `LG_${firm}_${period}_INVOICE`;

        // Resolve ID (LogicalRef vs Code)
        // Assuming Frontend sends LOGICALREF from the Account Card
        const { id } = req.params;
        let clientRef = id;

        // If ID is string (code), we might need to look it up, 
        // but looking at getAccountDetails, we expect LOGICALREF or Code.
        // Let's rely on standard ID passing. If Frontend sends Code, we need lookup.
        // AccountDetailModal uses account.id (LOGICALREF).

        if (!id) return res.status(400).json({ error: 'Client ID required' });

        // Ciro: Total Sales (TRCODE 7,8,9), excluding Cancelled
        // Net Total (KDV Hariç)

        const query = `
      SELECT 
        ISNULL(SUM(NETTOTAL), 0) as totalTurnover,
        COUNT(LOGICALREF) as invoiceCount
      FROM ${invoiceTable}
      WHERE CLIENTREF = ${clientRef}
        AND TRCODE IN (7, 8, 9)
        AND CANCELLED = 0
    `;

        const result = await sql.query(query);
        const stats = result.recordset[0];

        res.json({
            totalTurnover: stats.totalTurnover,
            invoiceCount: stats.invoiceCount
        });

    } catch (err) {
        console.error('❌ getClientTurnover Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

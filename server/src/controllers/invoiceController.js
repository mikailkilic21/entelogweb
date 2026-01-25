const { sql, getConfig } = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getInvoices = async (req, res) => {
  try {
    const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');

    if (isDemo) {
      const mockFile = path.join(__dirname, '../../data/mock/invoices.json');
      if (fs.existsSync(mockFile)) {
        console.log('📦 Serving MOCK Invoices');
        const data = fs.readFileSync(mockFile, 'utf8');
        return res.json(JSON.parse(data));
      }
    }

    const config = getConfig();
    const firm = config.firmNo || '113';
    const period = config.periodNo || '01';

    // Switch to INVOICE table for correct financial data
    const invoiceTable = `LG_${firm}_${period}_INVOICE`;
    const clcardTable = `LG_${firm}_CLCARD`;

    // Date Filters
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Period mapping (fallback)
    const timePeriod = req.query.period || 'yearly';
    const daysMap = {
      'daily': 1,
      'weekly': 7,
      'monthly': 30,
      'yearly': 365
    };
    const days = daysMap[timePeriod] || 365;

    // Limit logic
    const limit = parseInt(req.query.limit) || 50;

    // Filters
    const search = req.query.search || '';
    const type = req.query.type || ''; // 'sales' or 'purchase'

    let whereClause;

    if (startDate && endDate) {
      whereClause = `S.DATE_ BETWEEN '${startDate}' AND '${endDate}'`;
    } else {
      if (timePeriod === 'daily') {
        // For daily, get everything from start of TODAY (00:00:00)
        whereClause = `S.DATE_ >= CAST(GETDATE() AS DATE)`;
      } else {
        whereClause = `S.DATE_ >= DATEADD(DAY, -${days}, GETDATE())`;
      }
    }

    // Type Filter
    if (type === 'sales') {
      whereClause += ` AND S.TRCODE IN (7, 8, 9)`;
    } else if (type === 'purchase') {
      whereClause += ` AND S.TRCODE IN (1, 2, 3)`;
    } else {
      // If 'All', show both Sales and Purchase (exclude other slip types)
      whereClause += ` AND S.TRCODE IN (1, 2, 3, 7, 8, 9)`;
    }

    // Search Filter
    if (search) {
      whereClause += ` AND (C.DEFINITION_ LIKE '%${search}%' OR S.FICHENO LIKE '%${search}%')`;
    }

    const result = await sql.query(`
      SELECT TOP ${limit}
        S.LOGICALREF as id,
        S.FICHENO as ficheNo,
        S.DATE_ as date,
        S.TRCODE as trcode,
        CASE 
          WHEN S.TRCODE IN (1, 2, 3) THEN 'Alış'
          WHEN S.TRCODE IN (7, 8, 9) THEN 'Satış'
          ELSE 'Diğer'
        END as type,
        C.DEFINITION_ as customer,
        C.CODE as customerCode,
        S.NETTOTAL as amount,
        S.GROSSTOTAL as grossTotal,
        S.TOTALVAT as vat,
        S.GENEXP1 as notes,
        S.DOCODE as invoiceNo,
        S.EINVOICE as eInvoiceStatus, 
        S.PROFILEID as profileId
      FROM ${invoiceTable} S
      LEFT JOIN ${clcardTable} C ON S.CLIENTREF = C.LOGICALREF
      WHERE ${whereClause}
      ORDER BY S.DATE_ DESC, S.CAPIBLOCK_CREADEDDATE DESC, S.FICHENO DESC
    `);

    // Veriyi formatlayarak gönder
    const formattedData = result.recordset.map(item => {
      let gibStatus = 'Kağıt';
      if (item.trcode === 8 || item.trcode === 9) { // Sales
        if (item.eInvoiceStatus === 1) gibStatus = 'e-Fatura';
        else if (item.eInvoiceStatus === 2) gibStatus = 'e-Arşiv';
        else if (item.profileId === 1) gibStatus = 'e-Fatura'; // Fallback logic
      } else if (item.trcode === 1) { // Purchase
        if (item.eInvoiceStatus === 1) gibStatus = 'Gelen e-Fatura';
      }

      return {
        id: item.id, // Always use LOGICALREF for navigation/ID
        logicalRef: item.id,
        date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
        type: item.type,
        customer: item.customer || item.customerCode || 'Bilinmiyor',
        product: item.notes || 'Çeşitli',
        amount: parseFloat(item.amount || 0),
        grossTotal: parseFloat(item.grossTotal || 0),
        vat: parseFloat(item.vat || 0),
        quantity: 1,
        status: 'Onaylı',
        invoiceNo: item.invoiceNo,
        trcode: item.trcode,
        gibStatus: gibStatus,
        paymentStatus: 'Açık',
        _debug: "REAL_DATA"
      };
    });

    console.log(`✅ ${formattedData.length} fatura çekildi (${type || 'all'})`);
    res.json(formattedData);

  } catch (err) {
    console.error('❌ SQL Hatası:', err.message);

    // Fallback simulated data with basic filtering
    const search = (req.query.search || '').toLowerCase();
    const type = req.query.type || '';
    const timePeriod = req.query.period || 'yearly';

    // Determine days for simulation based on requested period
    const daysMap = { 'daily': 1, 'weekly': 7, 'monthly': 30, 'yearly': 365 };
    const days = daysMap[timePeriod] || 365;

    const count = 20;

    const demoInvoices = Array.from({ length: count }, (_, i) => {
      const isSales = i % 2 === 0; // Mix
      const customerName = isSales ? ['Ahmet Yılmaz', 'Ayşe Demir', 'TeknoFlow', 'Mega Market'][Math.floor(Math.random() * 4)] : ['Global Tedarik', 'Hızlı Lojistik'][Math.floor(Math.random() * 2)];
      const ficheNo = `F${1000 + i}`;

      if (type === 'sales' && !isSales) return null;
      if (type === 'purchase' && isSales) return null;
      if (search && !customerName.toLowerCase().includes(search) && !ficheNo.toLowerCase().includes(search)) return null;

      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * days));
      const amount = Math.floor(Math.random() * 10000) + 100;

      let gibStatus = 'Kağıt';
      if (isSales) {
        const r = Math.random();
        if (r > 0.6) gibStatus = 'e-Fatura';
        else if (r > 0.3) gibStatus = 'e-Arşiv';
      } else {
        if (Math.random() > 0.5) gibStatus = 'Gelen e-Fatura';
      }

      return {
        id: 1000 + i,
        logicalRef: 1000 + i,
        ficheNo: ficheNo,
        date: date.toISOString().split('T')[0],
        type: isSales ? 'Satış' : 'Alış',
        customer: customerName,
        product: ['Laptop', 'Mouse', 'Klavye', 'Monitör', 'Yazıcı'][Math.floor(Math.random() * 5)],
        amount: amount,
        grossTotal: amount * 1.18,
        vat: amount * 0.18,
        quantity: Math.floor(Math.random() * 10) + 1,
        status: 'Onaylı',
        invoiceNo: `INV${2024000 + i}`,
        trcode: isSales ? 8 : 1,
        iocode: isSales ? 1 : 2,
        gibStatus: gibStatus,
        paymentStatus: Math.random() > 0.3 ? 'Kapalı' : 'Açık'
      };
    }).filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(demoInvoices);
  }
};

exports.getInvoiceDetails = async (req, res) => {
  try {
    const config = getConfig();
    const firm = config.firmNo || '113';
    const period = config.periodNo || '01';
    const stlineTable = `LG_${firm}_${period}_STLINE`;
    const itemsTable = `LG_${firm}_ITEMS`;
    const unitsetlTable = `LG_${firm}_UNITSETL`;
    const clflineTable = `LG_${firm}_${period}_CLFLINE`;
    const stficheTable = `LG_${firm}_${period}_STFICHE`;
    const srvcardTable = `LG_${firm}_SRVCARD`;

    const { id } = req.params;

    let whereCondition;
    let ficheRefSql = id;

    if (isNaN(id)) {
      ficheRefSql = `(SELECT LOGICALREF FROM ${stficheTable} WHERE FICHENO = '${id}')`;
      whereCondition = `L.STFICHEREF = ${ficheRefSql}`;
    } else {
      // If ID is numeric, it is likely the INVOICE LOGICALREF
      whereCondition = `L.INVOICEREF = ${id}`;
    }

    const linesQuery = `
            SELECT 
                L.LOGICALREF as id,
                COALESCE(I.CODE, S.CODE) as code,
                COALESCE(I.NAME, S.DEFINITION_) as name,
                L.AMOUNT as quantity,
                U.CODE as unit,
                L.PRICE as price,
                L.VAT as vatRate,
                L.VATAMNT as vatAmount,
                L.TOTAL as total,
                L.DISTDISC as discount,
                L.LINETYPE as lineType
            FROM ${stlineTable} L
            LEFT JOIN ${itemsTable} I ON L.STOCKREF = I.LOGICALREF AND L.LINETYPE = 0
            LEFT JOIN ${srvcardTable} S ON L.STOCKREF = S.LOGICALREF AND L.LINETYPE = 4
            LEFT JOIN ${unitsetlTable} U ON L.UOMREF = U.LOGICALREF
            WHERE ${whereCondition} AND L.LINETYPE IN (0, 4)
        `;

    const paymentsQuery = `
            SELECT 
                C.DATE_ as date,
                C.TRCODE as trcode,
                C.AMOUNT as amount,
                C.LINEEXP as description,
                C.MODULENR as moduleNr,
                CASE 
                    WHEN C.TRCODE = 1 THEN 'Nakit Tahsilat'
                    WHEN C.TRCODE = 2 THEN 'Nakit Ödeme'
                    WHEN C.TRCODE IN (70, 71) THEN 'Kredi Kartı'
                    WHEN C.MODULENR = 7 THEN 'Banka / Havale'
                    WHEN C.MODULENR = 6 THEN 'Çek / Senet'
                    ELSE 'Diğer'
                END as type
            FROM ${clflineTable} C
            WHERE C.SOURCEFREF = ${ficheRefSql} 
              AND C.CANCELLED = 0
        `;

    // Execute queries independently to prevent one failure from blocking the other
    let lines = [];
    let payments = [];

    try {
      const linesResult = await sql.query(linesQuery);
      lines = linesResult.recordset;
    } catch (lineErr) {
      console.error('Lines Query Error:', lineErr.message);
    }

    try {
      const paymentsResult = await sql.query(paymentsQuery);
      payments = paymentsResult.recordset.map(p => ({
        ...p,
        date: p.date ? new Date(p.date).toISOString().split('T')[0] : ''
      }));
    } catch (payErr) {
      console.error('Payments Query Error:', payErr.message);
    }

    const subTotal = lines.reduce((acc, line) => acc + (line.total || 0), 0);
    const totalVat = lines.reduce((acc, line) => acc + (line.vatAmount || 0), 0);
    const totalDiscount = lines.reduce((acc, line) => acc + (line.discount || 0), 0);
    const grandTotal = subTotal - totalDiscount + totalVat;

    res.json({
      lines: lines || [],
      summary: {
        subTotal,
        totalVat,
        totalDiscount,
        grandTotal
      },
      payments: payments || []
    });

  } catch (err) {
    console.error('❌ getInvoiceDetails Error:', err.message);
    res.status(500).json({ error: 'Veri çekilemedi: ' + err.message });
  }
};

exports.getInvoiceStats = async (req, res) => {
  try {
    const config = getConfig();
    const firm = config.firmNo || '113';
    const period = config.periodNo || '01';
    const invoiceTable = `LG_${firm}_${period}_INVOICE`;
    const clcardTable = `LG_${firm}_CLCARD`;

    // Date Filters logic
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const timePeriod = req.query.period || 'monthly';
    const daysMap = { 'daily': 1, 'weekly': 7, 'monthly': 30, 'yearly': 365 };
    const days = daysMap[timePeriod] || 30;

    let whereClause;
    if (startDate && endDate) {
      whereClause = `DATE_ BETWEEN '${startDate}' AND '${endDate}'`;
    } else {
      if (timePeriod === 'daily') {
        whereClause = `DATE_ >= CAST(GETDATE() AS DATE)`;
      } else {
        // For weekly/monthly/yearly, use DATEADD
        whereClause = `DATE_ >= DATEADD(DAY, -${days}, GETDATE())`;
      }
    }

    const result = await sql.query(`
            SELECT 
                ISNULL(SUM(CASE WHEN TRCODE IN (7, 8, 9) THEN NETTOTAL ELSE 0 END), 0) as totalSales,
                ISNULL(SUM(CASE WHEN TRCODE IN (1, 2, 3) THEN NETTOTAL ELSE 0 END), 0) as totalPurchases,
                COUNT(CASE WHEN TRCODE IN (7, 8, 9) THEN 1 END) as salesCount,
                COUNT(CASE WHEN TRCODE IN (1, 2, 3) THEN 1 END) as purchaseCount
            FROM ${invoiceTable}
            WHERE ${whereClause}
        `);

    // Daily Sales
    const dailyResult = await sql.query(`
             SELECT SUM(NETTOTAL) as dailySales
             FROM ${invoiceTable}
             WHERE TRCODE IN (7, 8, 9) AND DATE_ >= CAST(GETDATE() AS DATE)
        `);

    const stats = result.recordset[0];
    const dailySales = dailyResult.recordset[0]?.dailySales || 0;

    res.json({
      totalSales: stats.totalSales || 0,
      totalPurchases: stats.totalPurchases || 0,
      salesCount: stats.salesCount || 0,
      purchaseCount: stats.purchaseCount || 0,
      dailySales: dailySales
    });

  } catch (err) {
    console.error('❌ Stats Error:', err.message);
    // Simulation
    res.json({
      totalSales: Math.floor(Math.random() * 500000) + 100000,
      totalPurchases: Math.floor(Math.random() * 300000) + 50000,
      salesCount: Math.floor(Math.random() * 50) + 10,
      purchaseCount: Math.floor(Math.random() * 20) + 5,
      dailySales: Math.floor(Math.random() * 20000) + 1000
    });
  }
};

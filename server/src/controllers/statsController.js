const { sql, getConfig, getCachedData, setCachedData } = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getStats = async (req, res) => {
  try {
    const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');

    if (isDemo) {
      const mockFile = path.join(__dirname, '../../data/mock/stats.json');
      if (fs.existsSync(mockFile)) {
        console.log('📦 Serving MOCK Stats');
        const data = fs.readFileSync(mockFile, 'utf8');
        const stats = JSON.parse(data);
        return res.json(stats.monthlyStats || {});
      }
    }

    console.log('🔍 getStats Request Received');
    const config = getConfig();
    const firm = config.firmNo || '113';
    const period = config.periodNo || '01';

    // Period mapping: daily, weekly, monthly, yearly
    const timePeriod = req.query.period || 'daily';

    // 1. Try Cache
    const cacheKey = `stats_${firm}_${period}_${timePeriod}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const stficheTable = `LG_${firm}_${period}_STFICHE`;
    const daysMap = {
      'daily': 1,
      'weekly': 7,
      'monthly': 30,
      'yearly': 365
    };
    const days = daysMap[timePeriod] || 1;

    let whereClause;
    if (timePeriod === 'daily') {
      // Safer T-SQL for 'Start of Day' (Today 00:00:00)
      whereClause = `DATE_ >= DATEADD(dd, DATEDIFF(dd, 0, GETDATE()), 0)`;
    } else {
      whereClause = `DATE_ >= DATEADD(DAY, -${days}, GETDATE())`;
    }

    const query = `
      SELECT 
        COUNT(*) as totalCount,
        ISNULL(SUM(CASE WHEN TRCODE IN (1,2,3) THEN 1 ELSE 0 END), 0) as purchaseCount,
        ISNULL(SUM(CASE WHEN TRCODE IN (7,8,9) THEN 1 ELSE 0 END), 0) as salesCount,
        ISNULL(SUM(CASE WHEN TRCODE IN (1,2,3) THEN NETTOTAL ELSE 0 END), 0) as totalPurchases,
        ISNULL(SUM(CASE WHEN TRCODE IN (7,8,9) THEN NETTOTAL ELSE 0 END), 0) as totalSales,
        ISNULL(SUM(TOTALVAT), 0) as totalVat
      FROM ${stficheTable}
      WHERE ${whereClause}
    `;

    console.log(`🔍 Query (${timePeriod}):`, query);

    const result = await sql.query(query);

    const data = result.recordset[0];

    // 2. Set Cache (60 seconds)
    setCachedData(cacheKey, data, 60);

    console.log(`✅ İstatistikler çekildi (${timePeriod}) - DB fetch`);
    res.json(data);

  } catch (err) {
    console.error(`❌ getStats Hatası (${req.query.period}):`, err.message);
    // Return real error to client for debugging
    res.status(500).json({ error: err.message, details: 'SQL Error' });
  }
};

exports.getFinancialTrend = async (req, res) => {
  try {
    const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');

    if (isDemo) {
      const mockFile = path.join(__dirname, '../../data/mock/stats.json');
      if (fs.existsSync(mockFile)) {
        const data = fs.readFileSync(mockFile, 'utf8');
        const stats = JSON.parse(data);
        return res.json(stats.financialTrend || []);
      }
    }

    const config = getConfig();
    const firm = config.firmNo || '113';
    const period = config.periodNo || '01';
    const stficheTable = `LG_${firm}_${period}_STFICHE`;

    // Period mapping: daily (default), weekly, monthly, yearly
    // Period mapping: daily (Today Hourly), weekly (Last 7 Days), monthly (Last 30 Days), yearly (Last 12 Months)
    const timePeriod = req.query.period || 'daily';

    let groupByClause = 'DATE_';
    let selectDate = 'DATE_';
    let orderByClause = 'DATE_';
    let whereClause = '';

    // Dynamic SQL configuration based on period
    switch (timePeriod) {
      case 'daily':
        // Today in 4-hour intervals: 00-04, 04-08, 08-12, 12-16, 16-20, 20-24
        // LOGO FTIME logic: Hour = FLOOR(FTIME / 16777216)
        // Interval = FLOOR(Hour / 4)
        whereClause = `DATE_ = CAST(GETDATE() AS DATE)`;
        const hourExpr = "FLOOR(FTIME / 16777216)";
        groupByClause = `FLOOR(${hourExpr} / 4)`;

        // Return a label like '00:00', '04:00' etc. or just the index 0-5
        selectDate = `
            CASE 
                WHEN FLOOR(${hourExpr} / 4) = 0 THEN '00:00'
                WHEN FLOOR(${hourExpr} / 4) = 1 THEN '04:00'
                WHEN FLOOR(${hourExpr} / 4) = 2 THEN '08:00'
                WHEN FLOOR(${hourExpr} / 4) = 3 THEN '12:00'
                WHEN FLOOR(${hourExpr} / 4) = 4 THEN '16:00'
                ELSE '20:00'
            END
        `;
        orderByClause = groupByClause;
        break;

      case 'weekly':
        // Current Week (Mon-Sun)
        // DATEFIRST default varies, but we can use DATEPART(weekday)
        // Assuming default English (Sun=1) or Turkish (Mon=1). Safer to use DATENAME or generic logic.
        // Let's filter for Start of Current Week (Monday)
        // Logic: DATEADD(wk, DATEDIFF(wk, 0, GETDATE()), 0) usually gives Monday
        whereClause = `DATE_ >= DATEADD(wk, DATEDIFF(wk, 0, GETDATE()), 0) AND DATE_ < DATEADD(wk, DATEDIFF(wk, 0, GETDATE()) + 1, 0)`;

        // Group by Day Name
        selectDate = "SUBSTRING(DATENAME(weekday, DATE_), 1, 3)"; // Mon, Tue... (First 3 chars)
        groupByClause = "DATE_, DATENAME(weekday, DATE_)"; // Group by actual date to sort correctly
        orderByClause = "DATE_";
        break;

      case 'monthly':
        // Last 30 Days Daily Trend
        whereClause = `DATE_ >= DATEADD(DAY, -30, GETDATE())`;

        // Return Day-Month format (e.g. 15-02)
        selectDate = "FORMAT(DATE_, 'dd-MM')";
        groupByClause = "DATE_";
        orderByClause = "DATE_";
        break;

      case 'yearly':
        whereClause = `DATE_ >= DATEADD(MONTH, -12, GETDATE())`;
        selectDate = "FORMAT(DATE_, 'yyyy-MM')";
        groupByClause = "YEAR(DATE_), MONTH(DATE_)";
        orderByClause = "YEAR(DATE_), MONTH(DATE_)";
        break;

      default:
        // Default to daily logic if unknown
        whereClause = `DATE_ = CAST(GETDATE() AS DATE)`;
        groupByClause = "FLOOR( FLOOR(FTIME / 16777216) / 4 )";
        selectDate = "'Daily'";
        orderByClause = groupByClause;
        break;
    }

    const query = `
      SELECT 
        ${selectDate} as date,
        SUM(CASE WHEN TRCODE IN (1,2,3) THEN NETTOTAL ELSE 0 END) as purchase,
        SUM(CASE WHEN TRCODE IN (7,8,9) THEN NETTOTAL ELSE 0 END) as sales
      FROM ${stficheTable}
      WHERE ${whereClause}
      GROUP BY ${groupByClause}
      ORDER BY ${orderByClause} ASC
    `;

    const result = await sql.query(query);

    // Format fields
    const formattedData = result.recordset.map(item => ({
      date: item.date,
      purchase: item.purchase || 0,
      sales: item.sales || 0
    }));

    // For Daily, ensure all 24 hours are present (optional but good for charts)
    if (timePeriod === 'daily') {
      const fullDay = Array.from({ length: 24 }, (_, i) => {
        const hourStr = i.toString();
        const existing = formattedData.find(d => d.date == hourStr); // lenient compare
        return existing || { date: `${i}:00`, purchase: 0, sales: 0 };
      });
      // Remap date to readable hour if needed, but "14" is fine. Converting to "14:00" for chart.
      res.json(fullDay.map(d => ({ ...d, date: d.date.includes(':') ? d.date : `${d.date}:00` })));
      return;
    }

    res.json(formattedData);

  } catch (err) {
    console.error('❌ getFinancialTrend Error:', err.message);
    res.json([]);
  }
};

exports.getTopProducts = async (req, res) => {
  try {
    const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');

    if (isDemo) {
      const mockFile = path.join(__dirname, '../../data/mock/stats.json');
      if (fs.existsSync(mockFile)) {
        const data = fs.readFileSync(mockFile, 'utf8');
        const stats = JSON.parse(data);
        return res.json(stats.topProducts || []);
      }
    }

    const config = getConfig();
    const firm = config.firmNo || '113';
    const period = config.periodNo || '01';
    const stlineTable = `LG_${firm}_${period}_STLINE`;
    const itemsTable = `LG_${firm}_ITEMS`;

    // Period mapping
    const timePeriod = req.query.period || 'daily';
    const daysMap = { 'daily': 1, 'weekly': 7, 'monthly': 30, 'yearly': 365 };
    const days = daysMap[timePeriod] || 1;

    // En çok satılan 5 ürünü getir (Ciro bazlı)
    const result = await sql.query(`
            SELECT TOP 5
                IT.NAME as name,
                SUM(L.TOTAL) as value
            FROM ${stlineTable} L
            JOIN ${itemsTable} IT ON L.STOCKREF = IT.LOGICALREF
            WHERE L.TRCODE IN (7, 8, 9) 
            AND L.DATE_ >= DATEADD(DAY, -${days}, GETDATE())
            GROUP BY IT.NAME
            ORDER BY value DESC
        `);

    // Format names to Title Case
    const formatted = result.recordset.map(item => {
      const name = item.name || '';
      const titleCase = name.toLowerCase().split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      return { ...item, name: titleCase };
    });

    res.json(formatted);
  } catch (err) {
    console.error('❌ Top Products Hata:', err.message);
    // Fallback demo data
    res.json([
      { name: 'Laptop Pro X1', value: 125000 },
      { name: 'Ofis Koltuğu Ergonomik', value: 85000 },
      { name: 'Kablosuz Mouse', value: 45000 },
      { name: '27" Monitör', value: 32000 },
      { name: 'USB-C Dock', value: 15000 }
    ]);
  }
};

exports.getTopCustomers = async (req, res) => {
  try {
    const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');
    if (isDemo) {
      // Return clear demo data
      return res.json([
        { name: 'Demo Müşteri A', value: 500000 },
        { name: 'Demo Müşteri B', value: 350000 },
        { name: 'Demo Müşteri C', value: 150000 },
        { name: 'Demo Müşteri D', value: 75000 },
        { name: 'Demo Müşteri E', value: 25000 }
      ]);
    }

    const config = getConfig();
    const firm = config.firmNo || '113';
    const period = config.periodNo || '01';
    const stficheTable = `LG_${firm}_${period}_STFICHE`;
    const clcardTable = `LG_${firm}_CLCARD`;

    // Period mapping
    const timePeriod = req.query.period || 'daily';
    const daysMap = { 'daily': 1, 'weekly': 7, 'monthly': 30, 'yearly': 365 };
    const days = daysMap[timePeriod] || 1;

    // En çok ciro yapan 5 müşteri
    const result = await sql.query(`
            SELECT TOP 5
                C.DEFINITION_ as name,
                SUM(S.NETTOTAL) as value
            FROM ${stficheTable} S
            JOIN ${clcardTable} C ON S.CLIENTREF = C.LOGICALREF
            WHERE S.TRCODE IN (7, 8, 9)
            AND S.DATE_ >= DATEADD(DAY, -${days}, GETDATE())
            GROUP BY C.DEFINITION_
            ORDER BY value DESC
        `);
    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Top Customers Hata:', err.message);
    // Fallback demo data - Scale values by period
    const timePeriod = req.query.period || 'daily';
    const multipliers = { 'daily': 1, 'weekly': 4, 'monthly': 15, 'yearly': 150 };
    const m = multipliers[timePeriod] || 1;

    res.json([
      { name: 'TeknoFlow Yazılım A.Ş.', value: 450000 * m },
      { name: 'Metaverse Çözümleri', value: 320000 * m },
      { name: 'Mega Market', value: 180000 * m },
      { name: 'Ali Yılmaz', value: 95000 * m },
      { name: 'Ayşe Demir', value: 50000 * m }
    ]);
  }
};

exports.getTopSuppliers = async (req, res) => {
  try {
    const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');
    if (isDemo) {
      const mockFile = path.join(__dirname, '../../data/mock/stats.json');
      if (fs.existsSync(mockFile)) {
        const data = fs.readFileSync(mockFile, 'utf8');
        const stats = JSON.parse(data);
        return res.json(stats.topSuppliers || []);
      }
    }

    const config = getConfig();
    const firm = config.firmNo || '113';
    const period = config.periodNo || '01';
    const stficheTable = `LG_${firm}_${period}_STFICHE`;
    const clcardTable = `LG_${firm}_CLCARD`;

    // Period mapping
    const timePeriod = req.query.period || 'daily';
    const daysMap = { 'daily': 1, 'weekly': 7, 'monthly': 30, 'yearly': 365 };
    const days = daysMap[timePeriod] || 1;

    // En çok alım yapılan 5 tedarikçi
    const result = await sql.query(`
            SELECT TOP 5
                C.DEFINITION_ as name,
                SUM(S.NETTOTAL) as value
            FROM ${stficheTable} S
            JOIN ${clcardTable} C ON S.CLIENTREF = C.LOGICALREF
            WHERE S.TRCODE IN (1, 2, 3)
            AND S.DATE_ >= DATEADD(DAY, -${days}, GETDATE())
            GROUP BY C.DEFINITION_
            ORDER BY value DESC
        `);
    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Top Suppliers Hata:', err.message);
    // Fallback demo data - Scale values by period
    const timePeriod = req.query.period || 'daily';
    const multipliers = { 'daily': 1, 'weekly': 4, 'monthly': 15, 'yearly': 150 };
    const m = multipliers[timePeriod] || 1;

    res.json([
      { name: 'Global Tedarik Ltd.', value: 250000 * m },
      { name: 'Hızlı Lojistik', value: 120000 * m },
      { name: 'Ofis Toptan', value: 80000 * m },
      { name: 'Net Telekom', value: 45000 * m },
      { name: 'Enerji A.Ş.', value: 30000 * m }
    ]);
  }
};

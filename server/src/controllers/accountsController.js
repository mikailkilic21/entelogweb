const { sql, getConfig } = require('../config/db');

exports.getAccounts = async (req, res) => {
  try {
    const config = getConfig();
    const firm = config.firmNo || '113';
    const period = config.periodNo || '01';
    const clcardTable = `LG_${firm}_CLCARD`;
    const clflineTable = `LG_${firm}_${period}_CLFLINE`;

    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type; // 'customer' or 'supplier' (Legacy)
    const listingType = req.query.listingType || 'all'; // 'all', 'debtor', 'creditor'
    const search = req.query.search || '';

    // Base conditions
    let baseWhere = '1=1';
    if (type === 'customer') baseWhere += ' AND C.CARDTYPE IN (1, 3)'; // Alıcı
    else if (type === 'supplier') baseWhere += ' AND C.CARDTYPE IN (2, 3)'; // Satıcı

    if (search) {
      baseWhere += ` AND (C.CODE LIKE '%${search}%' OR C.DEFINITION_ LIKE '%${search}%')`;
    }

    // CTE Query to calculate balance first, then filter/sort
    const query = `
      WITH AccountBalances AS (
          SELECT 
              C.LOGICALREF as id,
              C.CODE as code,
              C.DEFINITION_ as name,
              C.TAXNR as taxNumber,
              C.CITY as city,
              C.TOWN as town,
              C.TELNRS1 as phone,
              C.EMAILADDR as email,
              C.CARDTYPE as cardType,
              ISNULL((SELECT SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE -AMOUNT END) 
               FROM ${clflineTable} 
               WHERE CLIENTREF = C.LOGICALREF AND CANCELLED = 0), 0) as balance,
               (SELECT TOP 1 DATE_ 
                FROM ${clflineTable} 
                WHERE CLIENTREF = C.LOGICALREF AND CANCELLED = 0 
                ORDER BY DATE_ DESC) as lastOperationDate
          FROM ${clcardTable} C
          WHERE ${baseWhere}
      )
      SELECT TOP ${limit} *
      FROM AccountBalances
      WHERE ABS(balance) > 0.1  -- Filter out zero balances (allowing for small float diffs)
      
      -- Positive Balance (+): Customer owes us money (Borç Bakiyesi / Borçlu)
      -- Negative Balance (-): We owe supplier money (Alacak Bakiyesi / Alacaklı)
      ${listingType === 'debtor' ? 'AND balance > 0' : ''}
      ${listingType === 'creditor' ? 'AND balance < 0' : ''}
      ORDER BY ABS(balance) DESC -- Sort by magnitude
    `;

    const result = await sql.query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error('❌ getAccounts Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getAccountStats = async (req, res) => {
  try {
    const config = getConfig();
    const firm = config.firmNo || '113';
    const clcardTable = `LG_${firm}_CLCARD`;

    const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN CARDTYPE IN (1, 3) THEN 1 ELSE 0 END) as customers,
                SUM(CASE WHEN CARDTYPE IN (2, 3) THEN 1 ELSE 0 END) as suppliers
            FROM ${clcardTable}
        `;

    const result = await sql.query(query);
    res.json(result.recordset[0]);

  } catch (err) {
    console.error('❌ getAccountStats Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getAccountDetails = async (req, res) => {
  try {
    const config = getConfig();
    const firm = config.firmNo || '113';
    const period = config.periodNo || '01';
    const clcardTable = `LG_${firm}_CLCARD`;
    const clflineTable = `LG_${firm}_${period}_CLFLINE`;

    const { id } = req.params;

    // 1. Get Account Info (CLCARD)
    // Check if ID is LogicalRef (int) or Code (string)
    let whereCondition = `LOGICALREF = ${id}`;
    if (isNaN(id)) {
      whereCondition = `CODE = '${id}'`;
    }

    const infoQuery = `
            SELECT 
                LOGICALREF as id,
                CODE as code,
                DEFINITION_ as name,
                TAXNR as taxNumber,
                TAXOFFICE as taxOffice,
                TELNRS1 as phone1,
                EMAILADDR as email,
                ADDR1 as address1,
                CITY as city,
                TOWN as town,
                CARDTYPE as cardType -- 1: Customer, 2: Supplier
            FROM ${clcardTable}
            WHERE ${whereCondition}
        `;

    const infoResult = await sql.query(infoQuery);
    if (infoResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Cari bulunamadı' });
    }
    const accountInfo = infoResult.recordset[0];

    // 2. Get Transactions (CLFLINE)
    // TRCODE mapping can be complex, simplifying for now
    // 37: Retail Sales Invoice, 38: Wholesale Sales Invoice, 1: Purchase Invoice etc.
    const transactionsQuery = `
            SELECT TOP 20
                LOGICALREF as id,
                DATE_ as date,
                TRANNO as invoiceNo,
                DOCODE as documentNo,
                LINEEXP as description,
                TRCODE as trcode,
                AMOUNT as amount,
                SIGN as sign,
                SOURCEFREF as sourceRef,
                MODULENR as moduleNr,
                CASE 
                     -- Map common invoice types
                    WHEN TRCODE IN (37, 38, 8) THEN 'Satış Faturası'
                    WHEN TRCODE IN (1, 2) THEN 'Alım Faturası'
                    WHEN TRCODE = 14 THEN 'Devir'
                    WHEN TRCODE = 1 THEN 'Nakit Tahsilat'
                    WHEN TRCODE = 2 THEN 'Nakit Ödeme'
                    WHEN TRCODE = 3 THEN 'Borç Dekontu'
                    WHEN TRCODE = 4 THEN 'Alacak Dekontu'
                    WHEN TRCODE = 5 THEN 'Virman'
                    WHEN TRCODE = 6 THEN 'Kur Farkı'
                    WHEN TRCODE IN (61, 62) THEN 'Çek'
                    WHEN TRCODE IN (71, 72) THEN 'Senet'
                    ELSE 'Diğer'
                END as type
            FROM ${clflineTable}
            WHERE CLIENTREF = ${accountInfo.id} AND CANCELLED = 0
            ORDER BY DATE_ DESC
        `;

    const transResult = await sql.query(transactionsQuery);
    const transactions = transResult.recordset.map(t => ({
      ...t,
      date: t.date.toISOString().split('T')[0]
    }));

    // 3. Calculate Balance (Sum of CLFLINE)
    const balanceQuery = `
            SELECT 
                SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE -AMOUNT END) as balance
            FROM ${clflineTable}
            WHERE CLIENTREF = ${accountInfo.id} AND CANCELLED = 0
        `;
    const balanceResult = await sql.query(balanceQuery);
    const balance = balanceResult.recordset[0]?.balance || 0;

    res.json({
      ...accountInfo,
      balance,
      transactions
    });

  } catch (err) {
    console.error('❌ getAccountDetails Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getAccountOrders = async (req, res) => {
  try {
    const config = getConfig();
    const firm = config.firmNo || '113';
    const period = config.periodNo || '01';
    const orficheTable = `LG_${firm}_${period}_ORFICHE`; // Sipariş Fişleri
    const orflineTable = `LG_${firm}_${period}_ORFLINE`; // Sipariş Satırları
    const itemsTable = `LG_${firm}_ITEMS`;

    const { id } = req.params;

    // Resolve ID to LogicalRef if it's a code
    let clientRef = id;
    if (isNaN(id)) {
      // Assuming we need to look it up, but for now expect LOGICALREF from frontend usually.
      // If frontend sends code, we'd need a lookup. 
      // Let's assume frontend sends LOGICALREF or we did a lookup in a previous step.
      // For safety, let's do a quick lookup if needed or trust the ID.
      // A better pattern is to use the middleware or helper, but let's do a subquery approach if possible.
      // However, strictly speaking, CLIENTREF in ORFICHE is an integer.
    }

    const query = `
            SELECT 
                O.DATE_ as date,
                O.FICHENO as orderNo,
                O.DOCODE as documentNo,
                I.NAME as productName,
                (L.AMOUNT - L.SHIPPEDAMOUNT) as quantity,
                L.PRICE as price,
                L.TOTAL as total,
                L.LOGICALREF as id,
                U.CODE as unit
            FROM ${orflineTable} L
            JOIN ${orficheTable} O ON L.ORDFICHEREF = O.LOGICALREF
            JOIN ${itemsTable} I ON L.STOCKREF = I.LOGICALREF
            LEFT JOIN LG_${firm}_UNITSETL U ON L.UOMREF = U.LOGICALREF
            WHERE O.CLIENTREF = ${id} 
              AND L.CLOSED = 0  -- Bekleyen siparişler
              AND L.AMOUNT > L.SHIPPEDAMOUNT -- Sadece sevk edilmemiş miktarı olanlar
              AND O.STATUS = 4  -- Onaylı (Siparişleşmiş)
              AND O.TRCODE IN (1, 2)
            ORDER BY O.DATE_ DESC
        `;

    const result = await sql.query(query);
    const orders = result.recordset.map(o => ({
      ...o,
      date: o.date.toISOString().split('T')[0]
    }));

    res.json(orders);

  } catch (err) {
    console.error('❌ getAccountOrders Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

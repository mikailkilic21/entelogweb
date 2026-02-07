const { sql, getPool, getConfig } = require('../config/db');

const resolvers = {
    Query: {
        products: async (_, { limit = 50, offset = 0, search = '', warehouseId, sortBy = 'quantity' }) => {
            try {
                const pool = getPool();
                if (!pool) throw new Error('Veritabanı bağlantısı yok');

                const config = getConfig();
                const firm = config.firmNo || '113';
                const period = config.periodNo || '01';

                // Table Names
                const itemsTable = `LG_${firm}_ITEMS`;
                const stlineTable = `LG_${firm}_${period}_STLINE`;
                const prclistTable = `LG_${firm}_PRCLIST`;

                // Search Filter
                let searchCondition = "I.ACTIVE = 0"; // Only active products
                if (search) {
                    // Basic SQL Injection prevention for search term
                    const safeSearch = search.replace(/'/g, "''");
                    searchCondition += ` AND (I.CODE LIKE '%${safeSearch}%' OR I.NAME LIKE '%${safeSearch}%')`;
                }

                // Warehouse Condition
                // Assuming standard IOCODE logic: 1,3 (Output -), 2,4 (Input +)
                // SourceIndex checks handle warehouse filter
                let whCondition = "";
                if (warehouseId !== undefined && warehouseId !== null) {
                    whCondition = `AND SOURCEINDEX = ${warehouseId}`;
                }

                // Sorting Logic
                let orderBy = "SalesQuantity DESC";
                if (sortBy === 'amount') orderBy = "SalesAmount DESC";
                if (sortBy === 'realStock') orderBy = "StockLevel DESC";

                const query = `
                    SELECT TOP ${limit}
                        I.LOGICALREF AS id,
                        I.CODE AS code,
                        I.NAME AS name,
                        I.STGRPCODE AS brand,
                        U.CODE AS unit,
                        
                        -- Stock Level Calculation (Simplified)
                        ISNULL((
                            SELECT SUM(
                                CASE 
                                    WHEN IOCODE IN (1, 3) THEN -AMOUNT 
                                    WHEN IOCODE IN (2, 4) THEN AMOUNT 
                                    ELSE 0 
                                END
                            )
                            FROM ${stlineTable}
                            WHERE STOCKREF = I.LOGICALREF AND CANCELLED = 0 ${whCondition}
                        ), 0) AS stockLevel,

                        -- Price (Last Purchase Price or List Price)
                        ISNULL((
                            SELECT TOP 1 PRICE 
                            FROM ${prclistTable} 
                            WHERE CARDREF = I.LOGICALREF AND PTYPE = 2 
                            ORDER BY LOGICALREF DESC
                        ), 0) AS price,

                        -- Sales Amount (Turnover)
                        ISNULL((
                            SELECT SUM(TOTAL) 
                            FROM ${stlineTable} 
                            WHERE STOCKREF = I.LOGICALREF AND TRCODE IN (7, 8) AND CANCELLED = 0 ${whCondition}
                        ), 0) AS salesAmount,

                        -- Sales Quantity
                        ISNULL((
                            SELECT SUM(AMOUNT) 
                            FROM ${stlineTable} 
                            WHERE STOCKREF = I.LOGICALREF AND TRCODE IN (7, 8) AND CANCELLED = 0 ${whCondition}
                        ), 0) AS salesQuantity

                    FROM ${itemsTable} I
                    LEFT JOIN LG_${firm}_UNITSETL U ON I.UNITSETREF = U.UNITSETREF AND U.MAINUNIT = 1
                    WHERE ${searchCondition}
                    ORDER BY ${orderBy}
                `;

                const result = await pool.request().query(query);

                // Map results to schema (if field names diff)
                return result.recordset.map(row => ({
                    id: row.id,
                    code: row.code,
                    name: row.name,
                    brand: row.brand,
                    stockLevel: row.stockLevel,
                    unit: row.unit,
                    price: row.price,
                    salesAmount: row.salesAmount,
                    salesQuantity: row.salesQuantity
                }));

            } catch (error) {
                console.error('GraphQL Products Error:', error);
                throw new Error('Veri çekilemedi: ' + error.message);
            }
        },

        warehouses: async () => {
            try {
                const pool = getPool();
                const config = getConfig();
                const firm = config.firmNo || '113';
                // L_CAPIWH is typically used for Warehouses in Logo
                // Or dynamic query from GNTOTST columns?
                // Using simple mock or specific table if available. 
                // Fallback to static list if table not known standardly.
                // Assuming L_CAPIWH table exists:
                const query = `SELECT NR as id, NAME as name FROM L_CAPIWH WHERE FIRMNR = ${parseInt(firm)}`;
                const result = await pool.request().query(query);
                return result.recordset;
            } catch (e) {
                console.error(e);
                return [];
            }
        }
    }
};

module.exports = resolvers;

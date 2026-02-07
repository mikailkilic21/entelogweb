const { sql, getConfig } = require('../config/db');
const fs = require('fs');
const path = require('path');

const PLANS_FILE = path.join(__dirname, '../../data/check-plans.json');

// Helper: Read Plans
const readPlans = () => {
    try {
        if (!fs.existsSync(PLANS_FILE)) return [];
        const data = fs.readFileSync(PLANS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading check plans:', err);
        return [];
    }
};

// Helper: Save Plans
const writePlans = (plans) => {
    try {
        fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving check plans:', err);
        return false;
    }
};

exports.getPayrollDetails = async (req, res) => {
    try {
        const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');
        if (isDemo) {
            // Mock data for details usually not needed strictly if listing is mocked, 
            // but effectively we can mock it or return a generic item.
            // For now, let's return a dummy based on ID.
            return res.json([{
                id: parseInt(req.params.id),
                portfolioNo: 'DEMO-999',
                serialNo: 'DEMO-SERIES',
                dueDate: '2026-12-31',
                amount: 10000,
                bankName: 'DEMO BANK',
                cardType: 1,
                type: 'Çek',
                trcode: 1
            }]);
        }

        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cslinesTable = `LG_${firm}_${period}_CSLINES`;
        const cscardTable = `LG_${firm}_${period}_CSCARD`;

        const { id } = req.params; // This is the ROLLREF (Payroll ID)

        const query = `
            SELECT 
                L.LOGICALREF as id,
                C.PORTFOYNO as portfolioNo,
                C.NEWSERINO as serialNo,
                C.DUEDATE as dueDate,
                C.AMOUNT as amount,
                C.BANKNAME as bankName,
                C.DOC as cardType, -- 1: Çek, 2: Senet
                L.TRCODE as trcode
            FROM ${cslinesTable} L
            LEFT JOIN ${cscardTable} C ON L.CSREF = C.LOGICALREF
            WHERE L.ROLLREF = ${id}
            ORDER BY C.DUEDATE ASC
        `;

        const result = await sql.query(query);
        const checks = result.recordset.map(c => ({
            ...c,
            dueDate: c.dueDate ? c.dueDate.toISOString().split('T')[0] : null,
            type: c.cardType === 1 ? 'Çek' : 'Senet'
        }));

        res.json(checks);

    } catch (err) {
        console.error('❌ getPayrollDetails Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getChecks = async (req, res) => {
    try {
        const isDemo = req.headers['x-demo-mode'] === 'true' || (req.user && req.user.role === 'demo');
        if (isDemo) {
            const mockFile = require('path').join(__dirname, '../../data/mock/checks.json');
            if (require('fs').existsSync(mockFile)) {
                let data = JSON.parse(require('fs').readFileSync(mockFile, 'utf8'));
                const { type, search, period, status } = req.query;

                // 1. Filter by Type (Check vs Promissory Note is usually handling in 'trcode' or 'doc' logic, 
                // but frontend sends 'type=customer' vs 'type=own'. 
                // In mock data, let's assume all are 'customer' (1, 2) unless specified.
                // If type is 'own' we might filter, but mock data only has customer checks for now. 
                // Let's filter by status map if provided.

                // 2. Filter by Status
                if (status && status !== 'all') {
                    if (status === 'overdue') {
                        // Due date < today
                        const today = new Date().toISOString().split('T')[0];
                        data = data.filter(c => c.dueDate < today && ['Portföyde', 'Karşılıksız', 'Protestolu'].includes(c.status));
                    } else if (status === 'portfolio') {
                        data = data.filter(c => c.status === 'Portföyde');
                    } else if (status === 'in_bank') {
                        data = data.filter(c => ['Tahsil Edildi', 'Bankada'].includes(c.status));
                    } else if (status === 'endorsed') {
                        data = data.filter(c => c.status === 'Ciro Edildi');
                    }
                }

                // 3. Filter by Date Period
                if (period && period !== 'all') {
                    const now = new Date();
                    data = data.filter(c => {
                        const d = new Date(c.dueDate);
                        if (period === 'daily') return d.toDateString() === now.toDateString();
                        if (period === 'weekly') {
                            const nextWeek = new Date();
                            nextWeek.setDate(now.getDate() + 7);
                            return d >= now && d <= nextWeek;
                        }
                        if (period === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        if (period === 'yearly') return d.getFullYear() === now.getFullYear();
                        return true;
                    });
                }

                // 4. Search
                if (search) {
                    const q = search.toLowerCase();
                    data = data.filter(c =>
                        (c.portfolioNo && c.portfolioNo.toLowerCase().includes(q)) ||
                        (c.serialNo && c.serialNo.toLowerCase().includes(q)) ||
                        (c.bankName && c.bankName.toLowerCase().includes(q)) ||
                        (c.accountName && c.accountName.toLowerCase().includes(q))
                    );
                }

                // Map format for frontend if needed
                data = data.map(c => ({ ...c, statusLabel: c.status }));
                return res.json(data);
            }
        }

        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cscardTable = `LG_${firm}_${period}_CSCARD`;
        const cstransTable = `LG_${firm}_${period}_CSTRANS`;
        const clcardTable = `LG_${firm}_CLCARD`;

        const { type, search, limit, period: timePeriod, status } = req.query;

        // DOC 1: Customer Check, 2: Customer Promissory Note, 3: Own Check, 4: Own Promissory Note
        let whereClause = "";

        if (type === 'own') {
            whereClause = "WHERE C.DOC IN (3, 4)";
            // Own Checks: Statuses 7, 8, 9, 10, 11, 12, 13
            whereClause += " AND C.CURRSTAT IN (7, 8, 9, 10, 11, 12, 13)";
        } else {
            // Default to customer
            whereClause = "WHERE C.DOC IN (1, 2)";
            // Customer Checks: Statuses 1, 2, 3, 4, 5, 6, 11
            whereClause += " AND C.CURRSTAT IN (1, 2, 3, 4, 5, 6, 11)";
        }

        // Filter by Sub-Status
        if (type === 'customer') {
            if (status === 'portfolio') {
                whereClause += " AND C.CURRSTAT = 1";
            } else if (status === 'in_bank') {
                whereClause += " AND C.CURRSTAT IN (3, 6)";
            } else if (status === 'endorsed') {
                whereClause += " AND C.CURRSTAT IN (2, 5)";
            } else if (status === 'overdue') {
                whereClause += " AND C.DUEDATE < DATEADD(day, -2, GETDATE()) AND C.CURRSTAT IN (1, 3, 6)";
            }
        }

        // Default: If not specifically asking for overdue or everything, exclude overdue (>2 days past)
        if (status !== 'overdue' && timePeriod !== 'all' && !search) {
            whereClause += " AND (C.DUEDATE >= DATEADD(day, -2, GETDATE()) OR C.CURRSTAT NOT IN (1, 3, 6))";
        }

        // Filter by Period (Due Date)
        if (timePeriod && timePeriod !== 'all') {
            if (timePeriod === 'daily') {
                whereClause += ` AND CAST(C.DUEDATE AS DATE) = CAST(GETDATE() AS DATE)`;
            } else if (timePeriod === 'weekly') {
                whereClause += ` AND C.DUEDATE >= CAST(GETDATE() AS DATE) AND C.DUEDATE <= DATEADD(day, 7, CAST(GETDATE() AS DATE))`;
            } else if (timePeriod === 'monthly') {
                whereClause += ` AND C.DUEDATE >= CAST(GETDATE() AS DATE) AND C.DUEDATE <= DATEADD(day, 30, CAST(GETDATE() AS DATE))`;
            } else if (timePeriod === 'yearly') {
                whereClause += ` AND C.DUEDATE >= CAST(GETDATE() AS DATE) AND C.DUEDATE <= DATEADD(day, 365, CAST(GETDATE() AS DATE))`;
            }
        }

        if (search) {
            whereClause += ` AND (C.NEWSERINO LIKE '%${search}%' OR C.PORTFOYNO LIKE '%${search}%' OR CA.DEFINITION_ LIKE '%${search}%' OR C.OWING LIKE '%${search}%')`;
        }

        const topClause = limit ? `TOP ${parseInt(limit)}` : 'TOP 500';
        const query = `
            SELECT ${topClause}
                C.LOGICALREF as id,
                C.PORTFOYNO as portfolioNo,
                C.NEWSERINO as serialNo,
                C.DUEDATE as dueDate,
                C.AMOUNT as amount,
                C.BANKNAME as bankName,
                C.CURRSTAT as status,
                C.DOC as cardType,
                C.DEVIR as isRollover,
                C.OWING as debtorName,
                CA.DEFINITION_ as clientName,
                CA.DEFINITION_ as fromCompany
            FROM ${cscardTable} C
            OUTER APPLY (
                SELECT TOP 1 CARDREF FROM ${cstransTable} 
                WHERE CSREF = C.LOGICALREF AND STATUS IN (1, 7)
                ORDER BY DATE_ ASC, LOGICALREF ASC
            ) T
            LEFT JOIN ${clcardTable} CA ON T.CARDREF = CA.LOGICALREF
            ${whereClause}
            ORDER BY C.DUEDATE ASC
        `;

        const result = await sql.query(query);

        const mapStatus = (status, type) => {
            if (type === 'own') {
                if (status === 7) return 'Portföyde (Kendi)';
                if (status === 8) return 'Ödendi';
                if (status === 9) return 'Karşılıksız';
                if (status === 10) return 'İade Edildi';
                if (status === 11) return 'Protestolu';
                return 'İşlemde';
            }
            if (status === 1) return 'Portföyde';
            if (status === 2) return 'Ciro Edildi';
            if (status === 3) return 'Bankada (Tahsil)';
            if (status === 6) return 'Bankada (Teminat)';
            if (status === 4) return 'Tahsil Edildi';
            if (status === 5) return 'Protestolu';
            if (status === 11) return 'Karşılıksız';
            return 'Diğer';
        };

        const checks = result.recordset.map(c => {
            const checkType = (c.status >= 7 && c.status <= 13) ? 'own' : 'customer';
            return {
                ...c,
                dueDate: c.dueDate ? c.dueDate.toISOString().split('T')[0] : null,
                statusLabel: mapStatus(c.status, checkType),
                type: checkType,
                clientName: c.clientName || c.debtorName || 'Bilinmeyen Cari',
                debtorName: c.debtorName,
                fromCompany: c.clientName,
                endorseeName: '-'
            };
        });

        res.json(checks);

    } catch (err) {
        console.error('❌ getChecks Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getUpcomingChecks = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cscardTable = `LG_${firm}_${period}_CSCARD`;
        const clcardTable = `LG_${firm}_CLCARD`;
        const cstransTable = `LG_${firm}_${period}_CSTRANS`;
        const csrollTable = `LG_${firm}_${period}_CSROLL`;

        const query = `
            SELECT 
                C.LOGICALREF as id,
                C.NEWSERINO as serialNo,
                C.DUEDATE as dueDate,
                C.AMOUNT as amount,
                C.CURRSTAT as status,
                C.BANKNAME as bankName,
                C.DOC as cardType,
                C.OWING as debtorName,
                CAE.DEFINITION_ as endorseeName,
                CASE 
                    WHEN C.DOC IN (3, 4) THEN COALESCE(CAR.DEFINITION_, C.OWING)
                    ELSE COALESCE(CA.DEFINITION_, C.OWING)
                END as derivedClientName
            FROM ${cscardTable} C
            OUTER APPLY (
                SELECT TOP 1 CARDREF, ROLLREF FROM ${cstransTable} 
                WHERE CSREF = C.LOGICALREF AND STATUS IN (1, 7) AND ROLLREF > 0
                ORDER BY DATE_ DESC, LOGICALREF DESC
            ) T
            LEFT JOIN ${clcardTable} CA ON T.CARDREF = CA.LOGICALREF
            LEFT JOIN ${csrollTable} R ON T.ROLLREF = R.LOGICALREF
            LEFT JOIN ${clcardTable} CAR ON R.CARDREF = CAR.LOGICALREF
            OUTER APPLY (
                SELECT TOP 1 CARDREF FROM ${cstransTable} 
                WHERE CSREF = C.LOGICALREF AND STATUS = 2
                ORDER BY DATE_ DESC, LOGICALREF DESC
            ) TE
            LEFT JOIN ${clcardTable} CAE ON TE.CARDREF = CAE.LOGICALREF
            WHERE 
                C.CURRSTAT NOT IN (4, 8, 12, 13) 
                AND C.CURRSTAT IN (1, 2, 3, 7, 9) 
                AND C.DOC IN (1, 2, 3, 4) 
            ORDER BY C.DUEDATE ASC
        `;

        const result = await sql.query(query);
        const checks = result.recordset.map(c => {
            const checkType = (c.status >= 7 && c.status <= 13) ? 'own' : 'customer';

            return {
                ...c,
                dueDate: c.dueDate ? c.dueDate.toISOString().split('T')[0] : null,
                statusLabel: (c.status === 1) ? 'Portföyde' : (c.status === 2 ? 'Ciro Edildi' : 'Bekliyor'),
                type: checkType,
                clientName: c.derivedClientName || 'Bilinmeyen Cari',
                endorseeName: c.endorseeName || '-'
            };
        });

        res.json(checks);

    } catch (err) {
        console.error('❌ getUpcomingChecks Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getRecentChecks = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cscardTable = `LG_${firm}_${period}_CSCARD`;
        const clcardTable = `LG_${firm}_CLCARD`;
        const cstransTable = `LG_${firm}_${period}_CSTRANS`;

        const query = `
            SELECT TOP 10
                C.LOGICALREF as id,
                C.NEWSERINO as serialNo,
                C.DUEDATE as dueDate,
                C.AMOUNT as amount,
                C.CURRSTAT as status,
                C.BANKNAME as bankName,
                CA.DEFINITION_ as clientName
            FROM ${cscardTable} C
            OUTER APPLY (
                SELECT TOP 1 CARDREF FROM ${cstransTable} 
                WHERE CSREF = C.LOGICALREF AND STATUS IN (1, 7)
                ORDER BY DATE_ ASC, LOGICALREF ASC
            ) T
            LEFT JOIN ${clcardTable} CA ON T.CARDREF = CA.LOGICALREF
            WHERE C.DOC = 1
            ORDER BY C.LOGICALREF DESC
        `;

        const result = await sql.query(query);
        const checks = result.recordset.map(c => ({
            ...c,
            dueDate: c.dueDate ? c.dueDate.toISOString().split('T')[0] : null,
            statusLabel: (c.status === 1) ? 'Portföyde' : (c.status === 8 ? 'Ödendi' : 'İşlemde'),
            clientName: c.clientName || 'Bilinmeyen Cari'
        }));

        res.json(checks);

    } catch (err) {
        console.error('❌ getRecentChecks Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getCheckStats = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cscardTable = `LG_${firm}_${period}_CSCARD`;

        // We want totals for Customer checks (DOC IN (1,2) and CURRSTAT < 7)
        // Portfolio: 1
        // Bank: 3, 6
        // Endorsed: 2
        // Protest/Unpaid: 5, 11

        const query = `
            SELECT 
                SUM(CASE WHEN CURRSTAT = 1 THEN AMOUNT ELSE 0 END) as portfolioTotal,
                SUM(CASE WHEN CURRSTAT IN (3, 6) THEN AMOUNT ELSE 0 END) as bankTotal,
                SUM(CASE WHEN CURRSTAT = 2 THEN AMOUNT ELSE 0 END) as endorsedTotal,
                SUM(CASE WHEN CURRSTAT IN (5, 11) THEN AMOUNT ELSE 0 END) as protestTotal,
                SUM(CASE WHEN DUEDATE < DATEADD(day, -2, GETDATE()) AND CURRSTAT IN (1, 3, 6) THEN AMOUNT ELSE 0 END) as overdueTotal,
                COUNT(CASE WHEN CURRSTAT = 1 THEN 1 END) as portfolioCount,
                COUNT(CASE WHEN CURRSTAT IN (3, 6) THEN 1 END) as bankCount,
                COUNT(CASE WHEN CURRSTAT = 2 THEN 1 END) as endorsedCount,
                COUNT(CASE WHEN CURRSTAT IN (5, 11) THEN 1 END) as protestCount,
                COUNT(CASE WHEN DUEDATE < DATEADD(day, -2, GETDATE()) AND CURRSTAT IN (1, 3, 6) THEN 1 END) as overdueCount
            FROM ${cscardTable}
            WHERE DOC IN (1, 2, 3, 4)
        `;

        const result = await sql.query(query);
        const stats = result.recordset[0];

        res.json({
            portfolio: { total: stats.portfolioTotal || 0, count: stats.portfolioCount || 0 },
            bank: { total: stats.bankTotal || 0, count: stats.bankCount || 0 },
            endorsed: { total: stats.endorsedTotal || 0, count: stats.endorsedCount || 0 },
            protest: { total: stats.protestTotal || 0, count: stats.protestCount || 0 },
            overdue: { total: stats.overdueTotal || 0, count: stats.overdueCount || 0 }
        });

    } catch (err) {
        console.error('❌ getCheckStats Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getOverdueChecks = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cscardTable = `LG_${firm}_${period}_CSCARD`;
        const clcardTable = `LG_${firm}_CLCARD`;
        const cstransTable = `LG_${firm}_${period}_CSTRANS`;

        // We want checks with DueDate < Today (and not paid/closed/void completely)
        // DOC 1: Customer Check
        // DOC 3: Own Check

        // Categories:
        // 1. Own Checks (Vadesi Geçmiş Kendi Çeklerimiz) -> Status 7 (Issued), 9 (Karşılıksız), 11 (Protestolu) 
        //    (Excluded: 8 Paid, 10 Returned, 12 Cancelled in some contexts?)
        //    Usually Own check is Open/Issued if status is 7. 

        // 2. Customer Checks (Vadesi Geçmiş Müşteri Çekleri)
        //    - Portfolio (Portföyde) -> Status 1
        //    - Endorsed (Ciro Edildi) -> Status 2
        //    - Also: Bank (3, 6), Protested (5), Unpaid (11) if relevant.
        //    For now, user explicitly asked for "Portfolio" and "Endorsed" separate in Customer Checks.

        const query = `
            SELECT 
                C.LOGICALREF as id,
                C.NEWSERINO as serialNo,
                C.PORTFOYNO as portfolioNo,
                C.DUEDATE as dueDate,
                C.AMOUNT as amount,
                C.CURRSTAT as status,
                C.DOC as docType,
                C.BANKNAME as bankName,
                CA.DEFINITION_ as clientName,
                C.OWING as debtorName
            FROM ${cscardTable} C
            OUTER APPLY (
                SELECT TOP 1 CARDREF FROM ${cstransTable} 
                WHERE CSREF = C.LOGICALREF AND STATUS IN (1, 7)
                ORDER BY DATE_ ASC, LOGICALREF ASC
            ) T
            LEFT JOIN ${clcardTable} CA ON T.CARDREF = CA.LOGICALREF
            WHERE 
                C.DUEDATE < CAST(GETDATE() AS DATE) -- Overdue
                AND (
                    -- Customer Checks: Portfolio (1), Endorsed (2), Bank (3,6), Protest (5), Unpaid (11)
                    (C.DOC = 1 AND C.CURRSTAT IN (1, 2, 3, 5, 6, 11))
                    OR
                    -- Own Checks: Issued (7), Protest (11), Unpaid/Dishonored (9)
                    (C.DOC = 3 AND C.CURRSTAT IN (7, 9, 11))
                )
            ORDER BY C.DUEDATE ASC
        `;

        const result = await sql.query(query);

        const checks = result.recordset.map(c => {
            let category = 'other';
            let categoryLabel = 'Diğer';

            // Identify Category
            if (c.docType === 3) {
                category = 'own_overdue';
                categoryLabel = 'Şirket Çeki (Vadesi Geçmiş)';
            } else if (c.docType === 1) {
                if (c.status === 1) {
                    category = 'customer_portfolio';
                    categoryLabel = 'Müşteri Çeki (Portföyde)';
                } else if (c.status === 2) {
                    category = 'customer_endorsed';
                    categoryLabel = 'Müşteri Çeki (Cirolu)';
                } else {
                    category = 'customer_other';
                    categoryLabel = 'Müşteri Çeki (Diğer)';
                }
            }

            const mapStatus = (status, type) => {
                if (type === 3) { // Own
                    if (status === 7) return 'Portföyde (Kendi)';
                    if (status === 9) return 'Karşılıksız';
                    if (status === 11) return 'Protestolu';
                    return 'İşlemde';
                }
                // Customer
                if (status === 1) return 'Portföyde';
                if (status === 2) return 'Ciro Edildi';
                if (status === 3) return 'Bankada (Tahsil)';
                if (status === 6) return 'Bankada (Teminat)';
                if (status === 5) return 'Protestolu';
                if (status === 11) return 'Karşılıksız';
                return 'Diğer';
            };

            return {
                ...c,
                dueDate: c.dueDate ? c.dueDate.toISOString().split('T')[0] : null,
                statusLabel: mapStatus(c.status, c.docType),
                category,
                categoryLabel,
                clientName: c.clientName || c.debtorName || 'Bilinmeyen Cari'
            };
        });

        res.json(checks);

    } catch (err) {
        console.error('❌ getOverdueChecks Error:', err.message);
        res.status(500).json({ error: err.message });
    }

};

exports.getCheckTrend = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cscardTable = `LG_${firm}_${period}_CSCARD`;

        // Period mapping: daily, weekly, monthly, yearly
        const timePeriod = req.query.period || 'weekly';

        let groupByClause = 'DUEDATE';
        let selectDate = 'DUEDATE';
        let orderByClause = 'DUEDATE';
        let whereClause = "WHERE DOC IN (1, 2)"; // Customer Checks

        // Dynamic SQL configuration based on period
        switch (timePeriod) {
            case 'daily':
                whereClause += ` AND DUEDATE >= DATEADD(day, -30, GETDATE()) AND DUEDATE <= DATEADD(day, 60, GETDATE())`;
                selectDate = "FORMAT(DUEDATE, 'yyyy-MM-dd')";
                groupByClause = "DUEDATE";
                break;

            case 'weekly':
                whereClause += ` AND DUEDATE >= DATEADD(week, -12, GETDATE()) AND DUEDATE <= DATEADD(week, 12, GETDATE())`;
                selectDate = "FORMAT(DATEADD(week, DATEDIFF(week, 0, DUEDATE), 0), 'yyyy-MM-dd')";
                groupByClause = "DATEADD(week, DATEDIFF(week, 0, DUEDATE), 0)";
                break;

            case 'monthly':
                whereClause += ` AND DUEDATE >= DATEADD(month, -12, GETDATE()) AND DUEDATE <= DATEADD(month, 12, GETDATE())`;
                selectDate = "FORMAT(DUEDATE, 'yyyy-MM')";
                groupByClause = "YEAR(DUEDATE), MONTH(DUEDATE), FORMAT(DUEDATE, 'yyyy-MM')";
                orderByClause = "YEAR(DUEDATE), MONTH(DUEDATE)";
                break;

            case 'yearly':
                selectDate = "CAST(YEAR(DUEDATE) AS VARCHAR)";
                groupByClause = "YEAR(DUEDATE)";
                break;

            default:
                whereClause += ` AND DUEDATE >= DATEADD(week, -12, GETDATE())`;
                selectDate = "FORMAT(DATEADD(week, DATEDIFF(week, 0, DUEDATE), 0), 'yyyy-MM-dd')";
                groupByClause = "DATEADD(week, DATEDIFF(week, 0, DUEDATE), 0)";
                break;
        }

        const query = `
            SELECT 
                ${selectDate} as date,
                SUM(AMOUNT) as amount,
                COUNT(*) as count
            FROM ${cscardTable}
            ${whereClause}
            GROUP BY ${groupByClause}
            ORDER BY ${groupByClause} ASC
        `;

        const result = await sql.query(query);
        const formatted = result.recordset.map(item => ({
            date: item.date,
            amount: item.amount || 0,
            count: item.count || 0
        }));

        res.json(formatted);

    } catch (err) {
        console.error('❌ getCheckTrend Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getTopCheckIssuers = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cscardTable = `LG_${firm}_${period}_CSCARD`;
        const cstransTable = `LG_${firm}_${period}_CSTRANS`;
        const clcardTable = `LG_${firm}_CLCARD`;

        // Top 5 Customers by Due Amount (Customer Checks - DOC 1/2)
        const query = `
            SELECT TOP 5
                CA.DEFINITION_ as name,
                SUM(C.AMOUNT) as value
            FROM ${cscardTable} C
            OUTER APPLY (
                SELECT TOP 1 CARDREF FROM ${cstransTable} 
                WHERE CSREF = C.LOGICALREF AND STATUS IN (1, 7)
                ORDER BY DATE_ ASC, LOGICALREF ASC
            ) T
            LEFT JOIN ${clcardTable} CA ON T.CARDREF = CA.LOGICALREF
            WHERE C.DOC IN (1, 2)
            GROUP BY CA.DEFINITION_
            ORDER BY value DESC
        `;

        const result = await sql.query(query);
        const formatted = result.recordset.map(item => ({
            name: item.name || 'Bilinmeyen Cari',
            value: item.value || 0
        }));

        res.json(formatted);
    } catch (err) {
        console.error('❌ getTopCheckIssuers Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

/* --- PLAN PERSISTENCE --- */

exports.getPlans = (req, res) => {
    try {
        const plans = readPlans();
        // Sort by date desc
        plans.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(plans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.savePlan = (req, res) => {
    try {
        const { id, name, receiverName, checks, date } = req.body;

        if (!name || !checks || !Array.isArray(checks)) {
            return res.status(400).json({ error: 'Invalid plan data' });
        }

        const plans = readPlans();

        // Use provided ID or generate
        const planId = id || Date.now().toString();
        const existingIndex = plans.findIndex(p => p.id === planId);

        const newPlan = {
            id: planId,
            name,
            receiverName,
            date: date || new Date().toISOString(),
            checks, // Array of check objects
            totalAmount: checks.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0),
            count: checks.length
        };

        if (existingIndex >= 0) {
            plans[existingIndex] = newPlan;
        } else {
            plans.push(newPlan);
        }

        if (writePlans(plans)) {
            res.json({ success: true, plan: newPlan });
        } else {
            res.status(500).json({ error: 'Failed to save plan' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deletePlan = (req, res) => {
    try {
        const { id } = req.params;
        let plans = readPlans();
        const initialLen = plans.length;
        plans = plans.filter(p => p.id !== id);

        if (plans.length === initialLen) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        if (writePlans(plans)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to delete plan' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

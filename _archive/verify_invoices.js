const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`Status Code: ${res.statusCode}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function test() {
    const baseUrl = 'http://localhost:3001/api';

    console.log('Testing /api/invoices...');
    try {
        const data = await get(`${baseUrl}/invoices?limit=5`);
        console.log(`✅ Invoices fetched: ${data.length} items (Default Yearly)`);

        // Test Date Filter
        const today = new Date().toISOString().split('T')[0];
        console.log(`Testing /api/invoices?startDate=${today}&endDate=${today}...`);
        const dailyData = await get(`${baseUrl}/invoices?startDate=${today}&endDate=${today}`);
        console.log(`✅ Date Filter fetched: ${dailyData.length} items`);

        if (data.length > 0) {
            console.log('Sample invoice type:', data[0].type);
            const id = data[0].id;
            console.log(`Testing /api/invoices/${id}...`);
            const detail = await get(`${baseUrl}/invoices/${id}`);
            console.log('✅ Invoice Details fetched. Grand Total:', detail.summary.grandTotal);
        }
    } catch (e) {
        console.error('❌ Error fetching invoices:', e.message);
    }

    console.log('Testing /api/invoices/stats...');
    try {
        const stats = await get(`${baseUrl}/invoices/stats`);
        console.log('✅ Stats fetched:', JSON.stringify(stats));
    } catch (e) {
        console.error('❌ Error fetching stats:', e.message);
    }
}

test();

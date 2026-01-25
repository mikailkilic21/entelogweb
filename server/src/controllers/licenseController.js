const fs = require('fs');
const path = require('path');

const applicationsFile = path.join(__dirname, '../../data/applications.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

exports.apply = (req, res) => {
    try {
        const { companyName, officialName, phone, email, taxNo } = req.body;

        if (!companyName || !phone) {
            return res.status(400).json({ success: false, message: 'Firma adı ve telefon zorunludur.' });
        }

        let applications = [];
        if (fs.existsSync(applicationsFile)) {
            const data = fs.readFileSync(applicationsFile, 'utf8');
            try {
                applications = JSON.parse(data);
            } catch (e) {
                console.error('Error parsing application file:', e);
                applications = [];
            }
        }

        const newApplication = {
            id: Date.now(), // simple ID
            companyName,
            officialName,
            phone,
            email,
            taxNo,
            status: 'pending', // pending, approved, rejected
            createdAt: new Date().toISOString()
        };

        applications.push(newApplication);

        fs.writeFileSync(applicationsFile, JSON.stringify(applications, null, 2), 'utf8');

        // Note: Email sending removed as per new requirement (sending via WhatsApp on client side).
        // This controller just saves the record for tracking purposes.

        res.json({ success: true, applicationId: newApplication.id, message: 'Başvuru alındı.' });

    } catch (err) {
        console.error('License Apply Error:', err);
        res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
};

exports.checkStatus = (req, res) => {
    try {
        const { taxNumber } = req.params;
        if (!fs.existsSync(applicationsFile)) {
            return res.json({ status: 'not_found' });
        }

        const data = fs.readFileSync(applicationsFile, 'utf8');
        const applications = JSON.parse(data);
        const app = applications.find(a => a.taxNo === taxNumber);

        if (app) {
            res.json({ status: app.status, application: app });
        } else {
            res.json({ status: 'not_found' });
        }

    } catch (err) {
        console.error('License Status Error:', err);
        res.status(500).json({ status: 'error' });
    }
};

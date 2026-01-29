const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '../../data/users.json');

// Helper to read users
const getUsersData = () => {
    if (!fs.existsSync(usersFile)) return [];
    try {
        const data = fs.readFileSync(usersFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading users.json:', err);
        return [];
    }
};

// Helper to write users
const saveUsersData = (users) => {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 4), 'utf8');
        return true;
    } catch (err) {
        console.error('Error writing users.json:', err);
        return false;
    }
};

exports.login = (req, res) => {
    console.log('🔔 LOGIN REQUEST RECEIVED:', req.body);
    const { username, password } = req.body;
    const users = getUsersData();

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Return user info (exclude password)
        const { password, ...userInfo } = user;
        return res.json({
            success: true,
            user: userInfo,
            token: `mock-jwt-token-${user.role}-user`
        });
    }

    return res.status(401).json({ success: false, message: 'Geçersiz kullanıcı adı veya şifre' });
};

// --- CRUD Operations ---

exports.getUsers = (req, res) => {
    const users = getUsersData();
    // Return users without passwords
    const safeUsers = users.map(u => {
        const { password, ...rest } = u;
        return rest;
    });
    res.json(safeUsers);
};

exports.createUser = (req, res) => {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
        return res.status(400).json({ error: 'Kullanıcı adı, şifre ve isim zorunludur.' });
    }

    const users = getUsersData();
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor.' });
    }

    const newUser = {
        id: Date.now(),
        username,
        password, // In a real app, hash this!
        name,
        role: role || 'user',
        created_at: new Date().toISOString()
    };

    users.push(newUser);
    saveUsersData(users);

    const { password: _, ...safeUser } = newUser;
    res.json(safeUser);
};

exports.updateUser = (req, res) => {
    const { id } = req.params;
    const { password, name, role } = req.body;

    const users = getUsersData();
    const index = users.findIndex(u => u.id == id);

    if (index === -1) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Update fields if provided
    if (name) users[index].name = name;
    if (role) users[index].role = role;
    if (password) users[index].password = password; // In real app, hash this

    saveUsersData(users);

    const { password: _, ...safeUser } = users[index];
    res.json(safeUser);
};

exports.deleteUser = (req, res) => {
    const { id } = req.params;
    let users = getUsersData();

    const initialLength = users.length;
    users = users.filter(u => u.id != id);

    if (users.length === initialLength) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    saveUsersData(users);
    res.json({ success: true, message: 'Kullanıcı silindi.' });
};

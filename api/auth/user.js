const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const JWT_SECRET = process.env.JWT_SECRET || 'laro-ng-lahi-secret-key-change-this-in-production';

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse cookies
        const cookies = cookie.parse(req.headers.cookie || '');
        const token = cookies['auth-token'];

        if (!token) {
            return res.status(200).json({ authenticated: false });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);

        return res.status(200).json({
            authenticated: true,
            user: {
                uid: decoded.uid,
                email: decoded.email,
                username: decoded.username,
                displayname: decoded.displayname
            }
        });
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(200).json({ authenticated: false });
    }
};

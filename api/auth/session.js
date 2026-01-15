const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const JWT_SECRET = process.env.JWT_SECRET || 'laro-ng-lahi-secret-key-change-this-in-production';

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { uid, email, username, displayname } = req.body;

        if (!uid || !email) {
            return res.status(400).json({
                success: false,
                message: 'Missing user data'
            });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                uid,
                email,
                username: username || email.split('@')[0],
                displayname: displayname || 'Player'
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set HTTP-only cookie
        res.setHeader(
            'Set-Cookie',
            cookie.serialize('auth-token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60, // 24 hours
                path: '/'
            })
        );

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Session creation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Session error'
        });
    }
};

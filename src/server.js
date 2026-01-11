const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
// In production, use a persistent store like connect-mongo or redis
app.use(session({
    secret: 'laro-ng-lahi-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static Files
app.use(express.static(path.join(__dirname, '../public')));

// Authentication Routes

// Get Current User
app.get('/api/auth/user', (req, res) => {
    if (req.session.user) {
        res.json({
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Create Session (Login)
app.post('/api/auth/session', (req, res) => {
    const { uid, email, username, displayname } = req.body;

    if (!uid || !email) {
        return res.status(400).json({ success: false, message: 'Missing user data' });
    }

    req.session.user = {
        uid,
        email,
        username: username || email.split('@')[0],
        displayname: displayname || 'Player'
    };

    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ success: false, message: 'Session error' });
        }
        res.json({ success: true });
    });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout error' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// Fallback for SPA or unknown routes (Redirect to login if not found, or serve index)
// For now, let's just 404 or redirect to login.html if root is accessed without index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/landing.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

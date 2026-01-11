/**
 * Session Handler
 * Replaces PHP top-of-page session checks.
 * Include this script on every authenticated page.
 */

(async function checkSession() {
    // Skip check on login or register pages
    const path = window.location.pathname;
    if (path.includes('login.html') || path.includes('register.html') || path.includes('verify_email.html')) {
        return;
    }

    // Check for Guest Mode first
    const isGuest = localStorage.getItem('guestMode') === 'true';
    if (isGuest) {
        console.log('Guest mode active');
        window.userData = {
            id: 'guest',
            displayname: 'Guest Player',
            isGuest: true
        };
        window.currentUser = window.userData;
        window.dispatchEvent(new CustomEvent('user-ready', { detail: window.userData }));
        return;
    }

    try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();

        if (!data.authenticated) {
            console.log('User not authenticated, redirecting to login...');
            window.location.href = '/login.html';
        } else {
            console.log('Logged in as:', data.user.displayname);
            // Dispatch event for other scripts to use user data
            window.userData = data.user;
            // Also set currentUser for backward compatibility/ease of use
            window.currentUser = {
                id: data.user.username,
                displayname: data.user.displayname,
                isGuest: false
            };
            window.dispatchEvent(new CustomEvent('user-ready', { detail: data.user }));
        }
    } catch (error) {
        console.error('Session check failed:', error);
        // If fetch fails and not guest, maybe redirect? For now sticking to safe default.
    }
})();

// Logout helper
async function logout() {
    try {
        localStorage.removeItem('guestMode'); // Clear guest flag
        await fetch('/api/auth/logout', { method: 'POST' });
        if (window.Auth && window.Auth.logout) {
            // Call firebase logout if available
        }
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout failed:', error);
        localStorage.removeItem('guestMode'); // Ensure cleared even on error
        window.location.href = '/login.html';
    }
}

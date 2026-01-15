// Import Firebase functions (using ES modules via CDN for simplicity in this setup)
// Note: In a build step environment these would be npm imports.
// For this PHP setup, we'll rely on global `firebase` object or specific imports in the HTML files 
// that load the SDKs before this file. 

// Standard Firebase Web SDK imports are usually done in the HTML head for simple PHP apps:
// <script type="module">
//   import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
//   import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
//   import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// </script>

const Auth = {
    // Current user state
    user: null,

    // Login function
    login: async function (email, password) {
        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Check if email is verified
            if (!user.emailVerified) {
                await firebase.auth().signOut();
                return { success: false, message: "Please verify your email address before logging in. Check your inbox." };
            }

            // Get additional user data from Firestore
            const db = firebase.firestore();
            const userDoc = await db.collection('users').doc(user.uid).get();
            let userData = userDoc.exists ? userDoc.data() : {};

            // Sync with PHP Session
            await this.syncSession({
                uid: user.uid,
                email: user.email,
                username: userData.username,
                displayname: userData.displayname
            });

            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);

            // Handle specific error codes
            // 'auth/invalid-credential' is the unified error for wrong email/password in newer protocols
            if (error.code === 'auth/user-not-found' ||
                error.code === 'auth/wrong-password' ||
                error.code === 'auth/invalid-credential') {
                return { success: false, message: "Invalid email or password." };
            }

            // Handle raw API errors (like the one user reported) which might be in the message
            if (error.message && (error.message.includes("INVALID_LOGIN_CREDENTIALS") || error.message.includes("EMAIL_NOT_FOUND"))) {
                return { success: false, message: "Invalid email or password." };
            }

            return { success: false, message: error.message };
        }
    },

    // Register function
    register: async function (email, password, username, displayname) {
        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Send Verification Email
            await user.sendEmailVerification();

            // Create user document in Firestore
            const db = firebase.firestore();
            await db.collection('users').doc(user.uid).set({
                username: username,
                displayname: displayname,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Sign out immediately so they have to login after verifying
            await firebase.auth().signOut();

            return { success: true, message: "Registration successful! Verification email sent. Please check your inbox." };
        } catch (error) {
            console.error("Registration Error:", error);
            return { success: false, message: error.message };
        }
    },

    // Logout function
    logout: async function () {
        try {
            await firebase.auth().signOut();
            // Call Node API to clear session
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            if (response.ok) {
                // Force reload to login page
                window.location.replace('login.html');
            }
        } catch (error) {
            console.error("Logout Error:", error);
            // Fallback redirect even if API fails
            window.location.replace('login.html');
        }
    },

    // Helper to call Node.js API
    syncSession: async function (data) {
        const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
};

// Make available globally
window.Auth = Auth;

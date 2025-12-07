// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDV0vlEe1R4gXLeQ2jq6aCetMsYIcRSsVE",
    authDomain: "laro-ng-lahi-409b8.firebaseapp.com",
    databaseURL: "https://laro-ng-lahi-409b8-default-rtdb.asia-southeast1.firebasedatabase.app/", // Add this!
    projectId: "laro-ng-lahi-409b8",
    storageBucket: "laro-ng-lahi-409b8.firebasestorage.app",
    messagingSenderId: "940109405312",
    appId: "1:940109405312:web:f2de27f0f9017c1caeda65"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth, signInAnonymously };
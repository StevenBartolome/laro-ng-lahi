// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDV0vlEe1R4gXLeQ2jq6aCetMsYIcRSsVE",
    authDomain: "laro-ng-lahi-409b8.firebaseapp.com",
    databaseURL: "https://laro-ng-lahi-409b8-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "laro-ng-lahi-409b8",
    storageBucket: "laro-ng-lahi-409b8.firebasestorage.app",
    messagingSenderId: "940109405312",
    appId: "1:940109405312:web:f2de27f0f9017c1caeda65"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make Firebase services globally available
window.database = firebase.database();

// Also create non-window references for backwards compatibility
const database = window.database;

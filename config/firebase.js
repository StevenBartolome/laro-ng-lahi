// Import Firebase SDK functions
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // for Realtime Database
// import { getFirestore } from "firebase/firestore"; // optional if using Firestore

// Your Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyDgQK-SQh7nNCAM0DfTAA-_N95ReMaPZZ0",
  authDomain: "laro-ng-lahi.firebaseapp.com",
  projectId: "laro-ng-lahi",
  storageBucket: "laro-ng-lahi.firebasestorage.app",
  messagingSenderId: "859396070006",
  appId: "1:859396070006:web:84191c52a04601c27cdd57"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services to use in your app
export const auth = getAuth(app);
export const database = getDatabase(app);
// export const firestore = getFirestore(app); // if using Firestore
export default app;

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBkI2a3qSKYw1H7C3QbYb8jVzOhAcjfO-s",
  authDomain: "ernig-earn.firebaseapp.com",
  databaseURL: "https://ernig-earn-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ernig-earn",
  storageBucket: "ernig-earn.firebasestorage.app",
  messagingSenderId: "696553451647",
  appId: "1:696553451647:web:13d78c28add97515954f4a",
  measurementId: "G-1C6GER3HTD"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

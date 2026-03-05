//src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  getIdToken,
} from "firebase/auth";
import { http } from "./api/http";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
const provider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Get Firebase ID token
    const token = await getIdToken(user);

    // Send token to backend
    const response = await http.post(
      "/auth/google-login",
      { token }
    );

    // Save JWT token from backend
    localStorage.setItem("auth", JSON.stringify(response.data.token));

    return response.data.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw new Error("Google sign-in failed. Please try again.");
  }
};

export { auth, provider, signInWithPopup, signInWithGoogle };

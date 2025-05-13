// src/components/Login.js
import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const Login = () => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save or update user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        lastLogin: new Date().toISOString(),
      }, { merge: true });

      console.log("User logged in and saved.");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Login to Your Budget App</h2>
      <button onClick={handleLogin}>Sign in with Google</button>
    </div>
  );
};

export default Login;


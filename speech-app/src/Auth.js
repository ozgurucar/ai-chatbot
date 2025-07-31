import React, { useState, useEffect } from "react";
import { 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth } from "./firebase";

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: "#fee",
      color: "#b00",
      border: "1px solid #fcc",
      padding: "12px 20px",
      borderRadius: "8px",
      marginTop: "1em",
      fontWeight: 500
    }}>
      {message}
    </div>
  );
}

function Auth({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [setUser]);

  const handleSignup = async () => {
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setUser(auth.currentUser);
    } catch (err) {
      setError(parseFirebaseError(err));
    }
  };

  const handleLogin = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setUser(auth.currentUser);
    } catch (err) {
      setError(parseFirebaseError(err));
    }
  };

  const handleLogout = async () => {
    setError("");
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      setError("Çıkış yapılamadı.");
    }
  };

  return (
    <div>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSignup}>Kayıt Ol</button>
      <button onClick={handleLogin}>Giriş Yap</button>
      <button onClick={handleLogout}>Çıkış</button>
      <ErrorMessage message={error} />
    </div>
  );
}

function parseFirebaseError(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error.code) {
    switch (error.code) {
      case "auth/email-already-in-use": return "Bu email adresi zaten kayıtlı.";
      case "auth/invalid-email": return "Geçersiz email adresi.";
      case "auth/weak-password": return "Şifreniz en az 6 karakter olmalı.";
      case "auth/invalid-credential": return "Şifre veya E-posta hatalı.";
      case "auth/user-not-found": return "Kullanıcı bulunamadı.";
      case "auth/wrong-password": return "Şifre yanlış.";
      case "auth/invalid-api-key": return "API anahtarınız hatalı.";
      default: return error.message || "Bir hata oluştu.";
    }
  }
  return error.message || "Bilinmeyen hata";
}

export default Auth;

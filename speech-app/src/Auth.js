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
      background: "#ffeded",
      color: "#b4002d",
      border: "1.5px solid #fbb",
      padding: "11px 18px",
      borderRadius: 10,
      marginTop: 18,
      fontWeight: 500,
      width: "100%",
      textAlign: "center"
    }}>
      {message}
    </div>
  );
}

export default function Auth({ setUser }) {
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

  // --- Stil ayarları
  const container = {
    minHeight: "100vh",
    width: "100vw",
    background: "linear-gradient(120deg, #23273a 0%, #0f2027 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  const card = {
    background: "#21263aee",
    borderRadius: 26,
    boxShadow: "0 4px 24px #0028",
    padding: "44px 38px 36px 38px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 320,
    maxWidth: 420
  };

  const input = {
    width: "100%",
    padding: "12px 15px",
    fontSize: 16,
    borderRadius: 15,
    border: "1.5px solid #19bfff",
    background: "#131728",
    color: "#eaf7fa",
    marginBottom: 18,
    outline: "none",
    transition: "border 0.13s"
  };

  const btnRow = {
    display: "flex",
    gap: 10,
    width: "100%",
    marginTop: 5,
    justifyContent: "center"
  };

  const btn = {
    flex: 1,
    padding: "12px 0",
    fontSize: 16,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(90deg, #00cfff, #19bfff)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 10px #0092",
    transition: "opacity 0.13s"
  };
  const logoutBtn = {
    ...btn,
    background: "linear-gradient(90deg, #ff0066 30%, #a2004a 100%)"
  };

  return (
    <div style={container}>
      <form
        style={card}
        onSubmit={e => { e.preventDefault(); handleLogin(); }}
        autoComplete="off"
      >
        <h2 style={{
          color: "#1cd7fa",
          fontWeight: 700,
          marginBottom: 28,
          fontSize: 26,
          letterSpacing: "0.04em"
        }}>
          Giriş / Kayıt Ol
        </h2>
        <input
          style={input}
          placeholder="E-posta adresi"
          type="email"
          autoFocus
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          style={input}
          placeholder="Şifre"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <div style={btnRow}>
          <button type="button" style={btn} onClick={handleLogin}>
            Giriş Yap
          </button>
          <button type="button" style={btn} onClick={handleSignup}>
            Kayıt Ol
          </button>
        </div>
        <button
          type="button"
          style={{ ...logoutBtn, marginTop: 16 }}
          onClick={handleLogout}
        >
          Çıkış
        </button>
        <ErrorMessage message={error} />
      </form>
    </div>
  );
}

// Hata mesajlarını çevirir:
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

// components/ChatWindow.js
import React, { useEffect, useState, useRef } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";

export default function ChatWindow({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!chatId) return;
    const msgRef = collection(db, "chats", chatId, "messages");
    const q = query(msgRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data());
      setMessages(msgs);
    });
    return unsubscribe;
  }, [chatId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");

    await addDoc(collection(db, "chats", chatId, "messages"), {
      from: "user",
      text: userMsg,
      timestamp: serverTimestamp(),
    });

    // AI cevabı (sadece örnek - gerçek API ile değiştirilebilir)
    await addDoc(collection(db, "chats", chatId, "messages"), {
      from: "bot",
      text: "Bot cevabı burada (simülasyon).",
      timestamp: serverTimestamp(),
    });
  };

  return (
    <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 12, alignSelf: msg.from === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              background: msg.from === "user" ? "#0af" : "#444",
              color: "#fff",
              padding: 10,
              borderRadius: 10,
              maxWidth: "70%",
            }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: 10, borderRadius: 6 }}
          placeholder="Mesaj yaz..."
        />
        <button type="submit">Gönder</button>
      </form>
    </div>
  );
}

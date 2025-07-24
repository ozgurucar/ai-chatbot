// src/Chat.js
import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot } from "firebase/firestore";

function Chat() {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);

  // Kullanıcıya özel mesajları dinle
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "messages"),
      where("uid", "==", auth.currentUser.uid),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => doc.data()));
    });
    return unsubscribe;
  }, []);

  // Mesaj gönder
  const sendMessage = async () => {
    await addDoc(collection(db, "messages"), {
      uid: auth.currentUser.uid,
      text: msg,
      timestamp: new Date(),
    });
    setMsg("");
  };

  return (
    <div>
      <div>
        {messages.map((m, i) => (
          <div key={i}>{m.text}</div>
        ))}
      </div>
      <input value={msg} onChange={e=>setMsg(e.target.value)} />
      <button onClick={sendMessage}>Gönder</button>
    </div>
  );
}
export default Chat;

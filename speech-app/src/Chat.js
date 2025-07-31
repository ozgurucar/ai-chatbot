import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

function Chat({ selectedChatId }) {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!auth.currentUser || !selectedChatId) return;

    const q = query(
      collection(db, "chats", selectedChatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => doc.data()));
    });

    return unsubscribe;
  }, [selectedChatId]);

  const sendMessage = async () => {
    if (!msg.trim()) return;
    await addDoc(collection(db, "chats", selectedChatId, "messages"), {
      from: "user",
      text: msg,
      timestamp: serverTimestamp(),
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
      <input value={msg} onChange={e => setMsg(e.target.value)} />
      <button onClick={sendMessage}>Gönder</button>
    </div>
  );
}

export default Chat;

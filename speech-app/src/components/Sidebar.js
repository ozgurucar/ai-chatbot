// components/Sidebar.js
import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";

export default function Sidebar({ selectedChat, setSelectedChat }) {
  const [chats, setChats] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "chats"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatList);
    });

    return unsubscribe;
  }, [user]);

  const createNewChat = async () => {
    const docRef = await addDoc(collection(db, "chats"), {
      uid: user.uid,
      title: "Yeni Sohbet",
      createdAt: serverTimestamp(),
    });
    setSelectedChat(docRef.id);
  };

  return (
    <div style={{ width: 240, background: "#1e1f2b", color: "#fff", padding: 16, height: "100vh" }}>
      <button onClick={createNewChat} style={{ marginBottom: 16 }}>+ Yeni Sohbet</button>
      {chats.map(chat => (
        <div
          key={chat.id}
          onClick={() => setSelectedChat(chat.id)}
          style={{
            padding: "8px 12px",
            background: selectedChat === chat.id ? "#333951" : "transparent",
            borderRadius: 6,
            cursor: "pointer",
            marginBottom: 6,
          }}
        >
          {chat.title || "Sohbet"}
        </div>
      ))}
    </div>
  );
}

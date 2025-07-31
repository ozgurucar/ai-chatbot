// pages/ChatPage.js
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar selectedChat={selectedChat} setSelectedChat={setSelectedChat} />
      <ChatWindow chatId={selectedChat} />
    </div>
  );
}

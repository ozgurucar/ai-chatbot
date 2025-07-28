// src/App.js
import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";
import Chat from "./Chat";
import RobotMascotChat from "./components/RobotMascot";
import ProfilePage from "./components/ProfilePage"; // ekle
import { Routes, Route } from "react-router-dom"; // ekle

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <Routes>
      {!user ? (
        <Route path="*" element={<Auth setUser={setUser} />} />
      ) : (
        <>
          <Route path="/" element={<RobotMascotChat />} />
          <Route path="/profile" element={<ProfilePage />} />
        </>
      )}
    </Routes>
  );
}

export default App;

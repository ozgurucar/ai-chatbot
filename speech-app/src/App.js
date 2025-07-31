// App.js
import React, { useState, useEffect } from "react";
import {
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";
import RobotMascotChat from "./components/RobotMascot";
import ProfilePage from "./components/ProfilePage";
import { Routes, Route } from "react-router-dom";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      minWidth: "100vw",
      minHeight: "100vh",
      maxWidth: "100vw",
      maxHeight: "100vh",
      margin: 0,
      padding: 0,
      overflow: "hidden",
      background: "linear-gradient(120deg, #27293d 0%, #0f2027 100%)",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      boxSizing: "border-box",
    }}>
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
    </div>
  );
}

export default App;
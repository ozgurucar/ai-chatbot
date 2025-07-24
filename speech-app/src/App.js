// src/App.js
import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth.js";
import Chat from "./Chat.js";
import RobotMascotChat from "./components/RobotMascot.js";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <div>
      {user ? <RobotMascotChat /> : <Auth setUser={setUser} />}
    </div>
  );
}
export default App;

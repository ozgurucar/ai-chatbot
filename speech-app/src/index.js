// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom"; // ⬅️ Bu satırı ekle

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>       {/* ⬅️ Router'a sar */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

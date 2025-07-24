import React, { useRef, useState, useEffect } from "react";
import robotImage from "./assets/robot.png";
import { db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth"; 
import { getAuth, signOut } from "firebase/auth";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where } from "firebase/firestore";


// --- Maskotun ağız oranları (PNG'ye göre ayarla!) ---
const MOUTH_PROP = {
  x: 0.42,   // sola olan oran (ör: 0.42 = %42)
  y: 0.27,   // yukarıdan olan oran (ör: 0.55 = %55)
  width: 0.15,  // ağız genişliği oranı
  height: 0.09, // ağız yüksekliği oranı
};

const auth = getAuth();
function handleLogout() { signOut(auth); }

function getMouth(open) {
  return open ? (
    <g>
      <rect x="4" y="7" width="30" height="12" rx="7" fill="#3c4152" stroke="#a0e7f5" strokeWidth="2"/>
      <ellipse cx="19" cy="13" rx="12" ry="5" fill="#b8f6ff" opacity="0.6"/>
      <rect x="10" y="13" width="18" height="4" rx="2" fill="#3df57a" opacity="0.7"/>
      <rect x="12" y="15" width="4" height="2" rx="1" fill="#e7ffe2"/>
      <rect x="22" y="15" width="4" height="2" rx="1" fill="#e7ffe2"/>
    </g>
  ) : (
    <g>
      <rect x="7" y="16" width="24" height="4" rx="2" fill="#2d3141" stroke="#8acfd7" strokeWidth="1"/>
      <ellipse cx="19" cy="18" rx="11" ry="2" fill="#b8f6ff" opacity="0.25"/>
    </g>
  );
}

export default function RobotMascotChat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [input, setInput] = useState("");
  const [mouthOpen, setMouthOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Merhaba! Ben KoSistem robot maskotuyum. Size nasıl yardımcı olabilirim?" }
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "messages"),
      where("uid", "==", currentUser.uid),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data());
      setMessages(
        msgs.length === 0
          ? [{ from: "bot", text: "Merhaba! Ben KoçSistem robot maskotuyum. Size nasıl yardımcı olabilirim?" }]
          : msgs
      );
    });
    return unsubscribe;
  }, [currentUser]);


// --- Firestore'dan mesajları çek (component mount olduğunda) ---


  const synthRef = useRef(null);
  const maskotRef = useRef(null);
  const [imgSize, setImgSize] = useState({ width: 256, height: 256 });

  // Görsel boyutunu her window resize'da ölç
  useEffect(() => {
    function updateSize() {
      if (maskotRef.current) {
        setImgSize({
          width: maskotRef.current.offsetWidth,
          height: maskotRef.current.offsetHeight,
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Görsel yüklendiğinde de ölç
  const handleImgLoad = () => {
    if (maskotRef.current) {
      setImgSize({
        width: maskotRef.current.offsetWidth,
        height: maskotRef.current.offsetHeight,
      });
    }
  };

  // Ağız overlay’i görsele tam yerleştir
  function getMouthStyle() {
    return {
      position: "absolute",
      left: imgSize.width * MOUTH_PROP.x,
      top: imgSize.height * MOUTH_PROP.y,
      width: imgSize.width * MOUTH_PROP.width,
      height: imgSize.height * MOUTH_PROP.height,
      transition: "all 0.13s",
      pointerEvents: "none",
      zIndex: 2,
    };
  }

  // Sesli konuşma + ağız animasyonu
  const speakAndAnimate = (text) => {
    setIsSpeaking(true);
    setMouthOpen(false);

    const synth = window.speechSynthesis;
    synthRef.current = synth;
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = "tr-TR";

    utter.onboundary = (event) => {
      if (event.name === "word") {
        setMouthOpen(true);
        setTimeout(() => setMouthOpen(false), 180);
      }
    };

    utter.onstart = () => setMouthOpen(true);
    utter.onend = () => {
      setIsSpeaking(false);
      setMouthOpen(false);
    };

    synth.speak(utter);
  };

  // Kullanıcı mesajı ekle ve robotu cevapla
const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;
    const userMsg = input.trim();

    await addDoc(collection(db, "messages"), {
      from: "user",
      text: userMsg,
      uid: currentUser.uid,
      timestamp: serverTimestamp()
    });
    setInput("");

    setTimeout(async () => {
      const botText = userMsg;
      await addDoc(collection(db, "messages"), {
        from: "bot",
        text: botText,
        uid: currentUser.uid,
        timestamp: serverTimestamp()
      });
      speakAndAnimate(botText);
    }, 600);
  };
  // Unmount olunca sesi kapat
  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // UI stil kodları
  const containerStyle = {
    width: "100vw",
    minHeight: "100vh",
    background: "linear-gradient(120deg, #27293d 0%, #0f2027 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  };

  const cardStyle = {
    background: "#222844ee",
    borderRadius: 28,
    boxShadow: "0 4px 32px #0005",
    padding: "32px 24px 24px 24px",
    width: "min(96vw, 420px)",
    marginTop: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const chatListStyle = {
    width: "100%",
    maxHeight: 260,
    overflowY: "auto",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const inputRowStyle = {
    width: "100%",
    display: "flex",
    gap: 6,
    alignItems: "center",
  };

  const inputStyle = {
    flex: 1,
    padding: "11px 16px",
    fontSize: 16,
    borderRadius: 18,
    border: "1.5px solid #2ed3fc",
    background: "#11131a",
    color: "#f7f7f7",
    outline: "none",
    marginRight: 4,
  };

  const sendBtnStyle = {
    padding: "11px 18px",
    fontSize: 16,
    borderRadius: 18,
    border: "none",
    background: "#00cfff",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.13s",
    opacity: isSpeaking ? 0.4 : 1,
  };

  const balloonUser = {
    alignSelf: "flex-end",
    background: "linear-gradient(90deg, #31ffc2 10%, #09afff 90%)",
    color: "#052329",
    borderRadius: "16px 18px 2px 18px",
    padding: "10px 18px",
    maxWidth: "85%",
    fontSize: 15,
    boxShadow: "0 2px 10px #0032",
  };
  const balloonBot = {
    alignSelf: "flex-start",
    background: "linear-gradient(90deg, #3c4c73 10%, #222844 90%)",
    color: "#caf1ff",
    borderRadius: "18px 16px 18px 4px",
    padding: "10px 18px",
    maxWidth: "85%",
    fontSize: 15,
    boxShadow: "0 2px 10px #0012",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ position: "relative", marginBottom: 22, width: "clamp(160px, 34vw, 260px)" }}>
          <img
            ref={maskotRef}
            src={robotImage}
            alt="robot"
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              borderRadius: 32,
              boxShadow: "0 6px 22px #00b8e89c"
            }}
            onLoad={handleImgLoad}
          />
          <svg style={getMouthStyle()} viewBox="0 0 38 24">
            {getMouth(mouthOpen)}
          </svg>
        </div>
        <div style={chatListStyle}>
          {messages.map((msg, i) =>
            <div key={i} style={msg.from === "bot" ? balloonBot : balloonUser}>
              {msg.text}
            </div>
          )}
        </div>
        <form onSubmit={handleSend} style={inputRowStyle} autoComplete="off">
          <input
            type="text"
            value={input}
            placeholder="Bir mesaj yaz..."
            onChange={e => setInput(e.target.value)}
            style={inputStyle}
            disabled={isSpeaking}
          />
          <button type="submit" style={sendBtnStyle} disabled={!input || isSpeaking}>
            Gönder
          </button>
        </form>
        <div style={{ color: "#7ee9fa", fontSize: 13, marginTop: 10 }}>
          {isSpeaking ? "Maskot konuşuyor..." : "Hazır"}
          <button style={sendBtnStyle} onClick={handleLogout}>Çıkış</button>
        </div>
      </div>
    </div>
  );
}

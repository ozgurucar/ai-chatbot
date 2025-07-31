import React, { useRef, useState, useEffect } from "react";
import robotImage from "./assets/robot.png";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import {
  collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot, where,
  doc, getDoc
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "firebase/auth";



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
      <rect x="4" y="7" width="30" height="12" rx="7" fill="#3c4152" stroke="#a0e7f5" strokeWidth="2" />
      <ellipse cx="19" cy="13" rx="12" ry="5" fill="#b8f6ff" opacity="0.6" />
      <rect x="10" y="13" width="18" height="4" rx="2" fill="#3df57a" opacity="0.7" />
      <rect x="12" y="15" width="4" height="2" rx="1" fill="#e7ffe2" />
      <rect x="22" y="15" width="4" height="2" rx="1" fill="#e7ffe2" />
    </g>
  ) : (
    <g>
      <rect x="7" y="16" width="24" height="4" rx="2" fill="#2d3141" stroke="#8acfd7" strokeWidth="1" />
      <ellipse cx="19" cy="18" rx="11" ry="2" fill="#b8f6ff" opacity="0.25" />
    </g>
  );
}

export default function RobotMascotChat() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognizer, setRecognizer] = useState(null);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Merhaba! Ben KoçSistem robot maskotuyum. Size nasıl yardımcı olabilirim?" }
  ]);




  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Eğer seçili bir chat yoksa ve chat listesinde en az bir chat varsa, ilkini seç
    if (!selectedChatId && chats.length > 0) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);

  // Mikrofonu başlatır
  const startListening = () => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      process.env.REACT_APP_AZURE_SPEECH_API_KEY,
      process.env.REACT_APP_AZURE_SPEECH_REGION
    );
    speechConfig.speechRecognitionLanguage = "tr-TR";
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const rec = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    // Canlı olarak konuşmayı input’a yaz
    rec.recognizing = (s, e) => {
      setInput(e.result.text);
    };

    // Konuşma tamamlandığında input’a tam sonucu yaz
    rec.recognized = (s, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        setInput(e.result.text);
      }
    };

    rec.canceled = (s, e) => {
      setIsListening(false);
      rec.stopContinuousRecognitionAsync();
      setRecognizer(null);
    };

    rec.sessionStopped = (s, e) => {
      setIsListening(false);
      rec.stopContinuousRecognitionAsync();
      setRecognizer(null);
    };

    rec.startContinuousRecognitionAsync();
    setRecognizer(rec);
    setIsListening(true);
  };

  // Mikrofonu durdurur
  const stopListening = () => {
    if (recognizer) {
      recognizer.stopContinuousRecognitionAsync(() => {
        setIsListening(false);
        setRecognizer(null);
      });
    }
  };

  // Mikrofon butonu (toggle)
  const handleMicClick = () => {
    if (isListening) stopListening();
    else startListening();
  };

  useEffect(() => {
    return () => {
      if (recognizer) {
        recognizer.close();
      }
    };
  }, [recognizer]);

  const createNewChatWithTitle = async (title) => {
    if (!currentUser) return null;
    const chatRef = await addDoc(collection(db, "chats"), {
      uid: currentUser.uid,
      title: title,
      createdAt: serverTimestamp()
    });
    return chatRef.id;
  };

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "chats"),
      where("uid", "==", currentUser.uid)
      // orderBy yok!
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      // Client-side sort by createdAt (desc)
      chatsData.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setChats(chatsData);
    });

    return unsubscribe;
  }, [currentUser, selectedChatId]);


useEffect(() => {
  if (!selectedChatId || selectedChatId === "NEW") {
    setMessages([]); // yeni sohbet ekranı için mesajları temizle
    return;
  }
  // normalde olduğu gibi firestore'dan mesajları çek
  const q = query(
    collection(db, "chats", selectedChatId, "messages"),
    orderBy("timestamp", "asc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map((doc) => doc.data());
    setMessages(msgs);
  });

  return unsubscribe;
}, [selectedChatId]);


  const [photoURL, setPhotoURL] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    const fetchProfilePicture = async () => {
      try {
        const docRef = doc(db, "userdetails", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.profilePicture) {
            setPhotoURL(data.profilePicture);
          }
        }
      } catch (error) {
        console.error("Profil fotoğrafı çekilemedi:", error);
      }
    };

    fetchProfilePicture();
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
    setInput("");

    let chatIdToUse = selectedChatId;
    // Eğer yeni sohbetse
    if (!chatIdToUse || chatIdToUse === "NEW") {
      let title = userMsg.length > 40 ? userMsg.slice(0, 40) + "..." : userMsg;
      chatIdToUse = await createNewChatWithTitle(title);
      setSelectedChatId(chatIdToUse); // burası gerçek chat id'yi günceller
    }

    // Mesajı yeni chat'e ekle
    try {
      await addDoc(collection(db, "chats", chatIdToUse, "messages"), {
        from: "user",
        text: userMsg,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Kullanıcı mesajı kaydedilemedi:", err);
      return;
    }

    // Bot cevabı için LLM API çağrısı
    let botText = "Cevap alınamadı.";
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": process.env.REACT_APP_qroq_API_KEY
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "system",
              content: `
Sen bir KoçSistem dijital asistanısın.
Sadece KoçSistem'in verdiği hizmetler, ürünler ve kurumsal kültürü hakkında bilgi ver.
Kurumsal ve yardımsever bir dil kullan, asla başka bir markayı övme veya kötüleme.
Bilmediğin sorulara "Bu konuda yardımcı olamıyorum" diye cevap ver.
`
            },
            {
              role: "user",
              content: userMsg
            }
          ]
        }),
      });

      const data = await response.json();
      botText = data.choices?.[0]?.message?.content || "Cevap alınamadı.";
    } catch (err) {
      botText = "Bot bir hata ile karşılaştı: " + (err.message || String(err));
      console.error("Bot API hatası:", err);
    }

    // Bot mesajını Firestore'a ekle (chatIdToUse!)
    try {
      await addDoc(collection(db, "chats", chatIdToUse, "messages"), {
        from: "bot",
        text: botText,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Bot mesajı kaydedilemedi:", err);
    }

    speakAndAnimate(botText);
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
    height: "100vh",
    margin: 0,
    padding: 0,
    background: "linear-gradient(120deg, #27293d 0%, #0f2027 100%)",
    display: "flex",
    overflow: "hidden",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    position: "fixed", // Bu satırı ekleyin
    top: 0,
    left: 0,
  };

  const cardStyle = {
    background: "#222844ee",
    borderRadius: 28,
    boxShadow: "0 4px 32px #0005",
    padding: "32px 24px 24px 24px",
    maxWidth: "96%",
    width: 420,
    minWidth: 320,
    marginTop: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const chatListStyle = {
    width: "100%",
    maxHeight: "260px",
    minHeight: "180px",
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
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 99 }}>
        <img
          src={photoURL || currentUser?.photoURL || "https://ui-avatars.com/api/?name=User"}
          alt="avatar"
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            cursor: "pointer",
            border: "2px solid #00cfff",
            boxShadow: "0 0 8px #00cfff88",
          }}
        />
        {showMenu && (
          <div style={{
            marginTop: 8,
            background: "#1f2333",
            borderRadius: 10,
            padding: 10,
            boxShadow: "0 0 12px #0006",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 6,
            position: "absolute",
            right: 0,
            top: 48,
            minWidth: 140,
          }}>
            <button
              onClick={() => {
                navigate("/profile");
                setShowMenu(false);
              }}
              style={{
                background: "none",
                color: "#fff",
                border: "none",
                padding: "6px 10px",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
            >
              Profilim
            </button>
            <button
              onClick={() => {
                handleLogout();
                setShowMenu(false);
              }}
              style={{
                background: "none",
                color: "#ffb3b3",
                border: "none",
                padding: "6px 10px",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
            >
              Çıkış Yap
            </button>
          </div>
        )}
      </div>
      <div style={{ display: "flex", width: "100%", height: "100vh", margin: 0, padding: 0 }}>
        <div style={{
          width: 260,
          background: "#1f2333",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          borderRight: "1px solid #333",
          height: "100vh",
          overflowY: "auto",
          boxSizing: "border-box"
        }}>
          <button onClick={() => setSelectedChatId("NEW")} style={{ marginBottom: 12 }}>➕ Yeni Sohbet</button>

          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              style={{
                background: chat.id === selectedChatId ? "#00cfff" : "#2c2f4a",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: 500,
              }}
            >
              {chat.title || "Adsız Sohbet"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          {/* Buraya mevcut chat içerik kartını koy */}
          {<div style={cardStyle}>
            <div style={{ position: "relative", marginBottom: 22, width: "clamp(160px, 34%, 260px)" }}>
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
              {selectedChatId === "NEW"
                ? null // veya boş mesaj
                : messages.map((msg, i) =>
                  <div key={i} style={msg.from === "bot" ? balloonBot : balloonUser}>
                    {msg.text}
                  </div>
                )
              }
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

              {isSpeaking ? (
                <button
                  onClick={() => {
                    speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }}
                  style={{
                    marginLeft: 10,
                    padding: "2px 6px",
                    cursor: "pointer",
                    background: "#ff4d4d",
                    border: "none",
                    borderRadius: 4,
                    color: "white",
                  }}
                >
                  Durdur
                </button>
              ) : null}

              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
                {/* Mikrofon Butonu */}
                <button
                  onClick={handleMicClick}
                  style={{
                    padding: "11px 14px",
                    borderRadius: 18,
                    border: "none",
                    background: isListening ? "#ff4444" : "#00cfff",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                >
                  {isListening ? "🎤 Dinleniyor..." : "🎤"}
                </button>

                {/* Çıkış Yap Butonu */}
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "11px 18px",
                    fontSize: 16,
                    borderRadius: 18,
                    border: "none",
                    background: "#ff0066",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Çıkış Yap
                </button>
              </div>
            </div>


          </div>}
        </div>
      </div>



    </div>
  );
}

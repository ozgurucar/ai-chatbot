// src/pages/ProfilePage.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;
    const [form, setForm] = useState({
        username: "",
        birthdate: "",
        address: "",
        profilePicture: "",
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            const ref = doc(db, "userdetails", user.uid);
            const snap = await getDoc(ref);
            if (snap.exists()) setForm(prev => ({ ...prev, ...snap.data() }));
        };
        fetchData();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setForm({ ...form, profilePicture: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setMessage("");
        try {
            await setDoc(doc(db, "userdetails", user.uid), form);
            setMessage("Profil başarıyla kaydedildi!");
        } catch {
            setMessage("Bir hata oluştu, tekrar deneyin.");
        }
        setSaving(false);
    };

    // --- Styles ---
    const container = {
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        background: "linear-gradient(120deg, #23273a 0%, #0f2027 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
    };

    const card = {
        background: "#21263aee",
        borderRadius: 26,
        boxShadow: "0 4px 24px #0028",
        padding: "38px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 340,
        maxWidth: 410,
        width: "96%",
        position: "relative"
    };

    const avatarStyle = {
        width: 110,
        height: 110,
        borderRadius: "50%",
        border: "3px solid #1cd7fa",
        objectFit: "cover",
        boxShadow: "0 2px 12px #1cd7fa33",
        marginBottom: 16,
        background: "#2c344d"
    };

    const inputStyle = {
        width: "100%",
        padding: "12px 15px",
        fontSize: 15,
        borderRadius: 14,
        border: "1.5px solid #19bfff",
        background: "#131728",
        color: "#eaf7fa",
        marginBottom: 17,
        outline: "none",
        transition: "border 0.13s"
    };

    const btn = {
        padding: "11px 38px",
        fontSize: 16,
        borderRadius: 16,
        border: "none",
        background: "linear-gradient(90deg, #00cfff, #19bfff)",
        color: "#fff",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 2px 10px #0092",
        transition: "opacity 0.13s",
        marginTop: 10
    };

    const returnBtn = {
        position: "absolute",
        left: 22,
        top: 22,
        background: "#23273a",
        color: "#1cd7fa",
        border: "none",
        fontWeight: 600,
        fontSize: 15,
        borderRadius: 7,
        padding: "5px 16px",
        cursor: "pointer",
        boxShadow: "0 1px 6px #0024",
        zIndex: 5
    };

    return (
        <div style={container}>
            <div style={card}>
                <button style={returnBtn} onClick={() => navigate("/")}>
                    ← Anasayfa
                </button>
                <h2 style={{
                    color: "#1cd7fa",
                    fontWeight: 700,
                    fontSize: 24,
                    marginBottom: 8,
                    marginTop: 4,
                    letterSpacing: "0.03em"
                }}>
                    Profil Bilgilerim
                </h2>
                {form.profilePicture &&
                    <img src={form.profilePicture} alt="Profil" style={avatarStyle} />
                }
                {!form.profilePicture &&
                    <div style={{
                        ...avatarStyle,
                        display: "flex", alignItems: "center", justifyContent: "center", color: "#fff8", fontSize: 38, fontWeight: 700
                    }}>
                        <span>👤</span>
                    </div>
                }
                <form style={{ width: "100%", marginTop: 6 }} onSubmit={handleSave} autoComplete="off">
                    <input
                        style={inputStyle}
                        name="username"
                        placeholder="Kullanıcı adı"
                        value={form.username}
                        onChange={handleChange}
                        autoFocus
                        required
                    />
                    <input
                        style={inputStyle}
                        name="birthdate"
                        type="date"
                        value={form.birthdate}
                        onChange={handleChange}
                    />
                    <input
                        style={inputStyle}
                        name="address"
                        placeholder="Adres"
                        value={form.address}
                        onChange={handleChange}
                    />
                    <div style={{
                        color: "#1cd7fa",
                        marginTop: 16,
                        fontWeight: 500,
                    }}>
                        {<p>Profil Fotoğrafı</p>}
                    </div>
                    <input
                        style={{ ...inputStyle, padding: 0, background: "none", color: "#7ee9fa", marginBottom: 19, border: "none" }}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <button type="submit" style={btn} disabled={saving}>
                        {saving ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                </form>
                {message &&
                    <div style={{
                        background: "#162e32",
                        color: "#1cd7fa",
                        border: "1.5px solid #19bfff88",
                        padding: "12px 16px",
                        borderRadius: 8,
                        marginTop: 16,
                        fontWeight: 500,
                        textAlign: "center"
                    }}>
                        {message}
                    </div>
                }
            </div>
        </div>
    );
}

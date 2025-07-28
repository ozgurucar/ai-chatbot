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

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            const ref = doc(db, "userdetails", user.uid);
            const snap = await getDoc(ref);
            if (snap.exists()) setForm(snap.data());
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
            setForm({ ...form, profilePicture: reader.result }); // base64 string
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;
        await setDoc(doc(db, "userdetails", user.uid), form);
        alert("Profil kaydedildi!");
    };

    return (
        <div style={{ padding: 24 }}>
           <button onClick={() => {
            navigate("/");
           }}><p>Return</p></button> 
            <h2>Profil Bilgilerim</h2>
            <form onSubmit={handleSave}>
                <input name="username" placeholder="Kullanıcı adı" value={form.username} onChange={handleChange} /><br />
                <input name="birthdate" type="date" value={form.birthdate} onChange={handleChange} /><br />
                <input name="address" placeholder="Adres" value={form.address} onChange={handleChange} /><br />
                <input type="file" accept="image/*" onChange={handleFileChange} /><br />
                <button type="submit">Kaydet</button>
            </form>
            {form.profilePicture && (
                <div>
                    <p>Profil Resmi:</p>
                    <img src={form.profilePicture} alt="Profil" width={120} />
                </div>
            )}
        </div>
    );
}

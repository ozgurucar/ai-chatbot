// src/components/UserDetailsForm.js
import React, { useState } from "react";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const UserDetailsForm = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const [formData, setFormData] = useState({
    username: "",
    birthdate: "",
    address: "",
    profilePicture: "", // base64 olarak tutulacak
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "profilePicture" && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Kullanıcı oturumu yok!");
      return;
    }

    try {
      await setDoc(doc(db, "userdetails", user.uid), formData);
      alert("Profil başarıyla kaydedildi.");
    } catch (err) {
      console.error("Kayıt hatası:", err);
      alert("Hata: " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <input
        name="username"
        placeholder="Kullanıcı adı"
        value={formData.username}
        onChange={handleChange}
        required
      />
      <input
        name="birthdate"
        type="date"
        value={formData.birthdate}
        onChange={handleChange}
        required
      />
      <input
        name="address"
        placeholder="Adres"
        value={formData.address}
        onChange={handleChange}
        required
      />
      <input
        name="profilePicture"
        type="file"
        accept="image/*"
        onChange={handleChange}
      />
      <button type="submit">Kaydet</button>

      {formData.profilePicture && (
        <img
          src={formData.profilePicture}
          alt="Seçilen Profil"
          style={{ width: 120, marginTop: 10 }}
        />
      )}
    </form>
  );
};

export default UserDetailsForm;

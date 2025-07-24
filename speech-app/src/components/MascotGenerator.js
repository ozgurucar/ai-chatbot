import React, { useState } from "react";

function ReplicateMascotGenerator() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const generateMascot = async () => {
    setLoading(true);
    setImageUrl("");
    try {
      // Prediction başlat
      const response = await fetch("http://localhost:5003/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();

      if (!data.id) {
        throw new Error("Prediction başlatılamadı: " + JSON.stringify(data));
      }

      // Sadece proxy’ye poll atıyoruz
      let status = data.status;
      let result = data;
      while (
        status !== "succeeded" &&
        status !== "failed" &&
        status !== "canceled"
      ) {
        await new Promise((res) => setTimeout(res, 2000));
        const pollRes = await fetch(
          `http://localhost:5003/poll/${data.id}`,
          { headers: { "Content-Type": "application/json" } }
        );
        result = await pollRes.json();
        status = result.status;
      }

      if (status === "succeeded" && result.output && result.output.length > 0) {
        setImageUrl(result.output[result.output.length - 1]);
      } else {
        throw new Error("Görsel üretilemedi: " + JSON.stringify(result));
      }
    } catch (e) {
      alert("Bir hata oluştu: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <h2>AI Maskot Oluşturucu (Replicate)</h2>
      <input
        type="text"
        value={prompt}
        placeholder="Maskotunu tarif et (ör: sevimli mavi robot)"
        onChange={(e) => setPrompt(e.target.value)}
        style={{ width: 300, padding: 8, fontSize: 16 }}
      />
      <br />
      <button
        style={{ margin: 16, padding: 12, fontSize: 18 }}
        onClick={generateMascot}
        disabled={loading || !prompt}
      >
        {loading ? "Yükleniyor..." : "Maskot Üret"}
      </button>
      <div>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="AI Maskot"
            style={{
              marginTop: 24,
              maxWidth: 360,
              borderRadius: 20,
              boxShadow: "0 4px 24px #0002",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default ReplicateMascotGenerator;

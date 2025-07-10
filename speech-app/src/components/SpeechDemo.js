import React from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

export default function SpeechDemo() {
  const recognizeSpeech = () => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription("15NOmR02IOQSZiy36AIRJnjzeFRUAz8DLdQP297MrBLFaKWOcrRFJQQJ99BGAC5T7U2XJ3w3AAAYACOG194o", "francecentral");
    speechConfig.speechRecognitionLanguage = "tr-TR";
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizeOnceAsync(result => {
      alert("Algılanan: " + result.text);
    });
  };

  return (
    <div className="p-4">
      <h2>Konuşma Tanıma</h2>
      <button onClick={recognizeSpeech} className="bg-blue-500 text-white px-4 py-2 rounded">
        Konuşmayı Başlat
      </button>
    </div>
  );
}

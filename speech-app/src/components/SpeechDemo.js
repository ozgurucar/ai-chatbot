import React from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

export default function SpeechDemo() {
  const recognizeSpeech = () => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(process.env.REACT_APP_AZURE_SPEECH_API_KEY, process.env.REACT_APP_AZURE_SPEECH_REGION);
    speechConfig.speechRecognitionLanguage = "tr-TR";
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizeOnceAsync(result => {
      alert("Algılanan: " + result.text);
    });
  };

  return (
    null
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Sesli arama (Web Speech API) — QuickEcommerce search-bar kalibinin uyarlamasi.
 * Fark: interimResults ACIK — kullanici konusurken canli transcript akar
 * (QE'de kapaliydi, 1-2 sn bos kirmizi buton gorunuyordu).
 * API sadece Chrome/Edge/Safari'de var; desteklenmeyen tarayicida buton gizlenir.
 */
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onstart: (() => void) | null;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void)
    | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function voiceErrorMessage(code?: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Mikrofon izni verilmedi. Adres çubuğundaki kilit simgesinden mikrofona izin verin.";
    case "no-speech":
      return "Ses algılanamadı, tekrar deneyin.";
    case "audio-capture":
      return "Mikrofon bulunamadı.";
    case "network":
      return "Ses tanıma servisine ulaşılamadı, bağlantınızı kontrol edin.";
    case "aborted":
      return "";
    default:
      return "Sesli arama başlatılamadı, tekrar deneyin.";
  }
}

export interface VoiceSearch {
  supported: boolean;
  listening: boolean;
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

export function useVoiceSearch(onFinal: (transcript: string) => void): VoiceSearch {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const gotSpeechRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  // SSR hydration uyusmazligi olmasin diye effect icinde tespit edilir.
  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
    return () => {
      try {
        recognitionRef.current?.abort?.();
      } catch {
        /* mikrofon acik kalmasin — hata onemsiz */
      }
    };
  }, []);

  const stop = useCallback(() => {
    gotSpeechRef.current = true; // manuel durdurmada "ses algilanamadi" uyarisi cikmasin
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setError("Tarayıcınız sesli aramayı desteklemiyor.");
      return;
    }
    setError(null);
    setInterim("");
    gotSpeechRef.current = false;
    try {
      const rec = new SR();
      rec.lang = "tr-TR";
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onstart = () => setListening(true);
      rec.onresult = (event) => {
        let interimText = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) finalText += result[0].transcript;
          else interimText += result[0].transcript;
        }
        if (interimText) setInterim(interimText);
        if (finalText) {
          gotSpeechRef.current = true;
          setInterim("");
          setListening(false);
          onFinalRef.current(finalText.trim());
        }
      };
      rec.onerror = (event) => {
        setListening(false);
        setInterim("");
        setError(voiceErrorMessage(event?.error) || null);
      };
      rec.onend = () => {
        setListening(false);
        setInterim("");
        if (!gotSpeechRef.current) {
          setError((prev) => prev ?? "Ses algılanamadı, tekrar deneyin.");
        }
      };
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      setError("Sesli arama başlatılamadı, tekrar deneyin.");
    }
  }, []);

  return { supported, listening, interim, error, start, stop };
}

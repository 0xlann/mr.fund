"use client";

import { ArrowUpRight, AudioLines, Check, Mic, MicOff, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface RecognitionResultEvent {
  results: { length: number; [index: number]: { 0: { transcript: string }; isFinal: boolean } };
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export function VoicePanel({
  onSend,
  onNotice,
}: {
  onSend: (text: string) => void;
  onNotice: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("en-US");
  const [error, setError] = useState("");
  const [sample, setSample] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  useEffect(
    () => () => {
      recognition.current?.abort();
    },
    [],
  );

  function listen() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const browser = window as SpeechWindow;
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) {
      setError(
        "Voice input isn't available in this browser. Type below, or try the labelled sample.",
      );
      return;
    }
    const session = new Constructor();
    session.lang = language;
    session.continuous = false;
    session.interimResults = true;
    session.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++)
        text += `${event.results[i]?.[0].transcript ?? ""} `;
      setTranscript(text.trim());
      setSample(false);
    };
    session.onerror = (event) => {
      setListening(false);
      setError(
        event.error === "not-allowed"
          ? "Microphone permission wasn't granted. You can still type your question below."
          : event.error === "no-speech"
            ? "I didn't catch that. Try again, or type your question."
            : "Voice input stopped. Check your browser's microphone access and try again.",
      );
    };
    session.onend = () => setListening(false);
    recognition.current = session;
    setError("");
    setSample(false);
    try {
      session.start();
      setListening(true);
    } catch {
      setListening(false);
      setError("Couldn't start the microphone. Please try again.");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6">
      <div className="flex justify-center gap-1.5">
        {(
          [
            { id: "en-US", label: "English" },
            { id: "id-ID", label: "Bahasa Indonesia" },
          ] as const
        ).map((item) => (
          <button
            type="button"
            key={item.id}
            disabled={listening}
            aria-pressed={language === item.id}
            onClick={() => setLanguage(item.id)}
            className={`rounded-full border px-3 py-2 text-[10px] font-semibold ${language === item.id ? "border-[#26314a] bg-[#26314a] text-[#fff8e7]" : "border-[#dce1d0] bg-transparent text-[#8b957d]"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="relative mx-auto my-7 flex size-[150px] items-center justify-center rounded-full border border-[#e8dbc6] bg-[#faf0df]">
        <div
          className={`absolute inset-3 rounded-full border-2 border-dashed border-[#e6c9ad] ${listening ? "animate-spin [animation-duration:12s] motion-reduce:animate-none" : ""}`}
        />
        <button
          type="button"
          aria-label={listening ? "Stop listening" : "Start voice input"}
          onClick={listen}
          className={`relative grid size-[86px] place-items-center rounded-[30px] border-2 border-[#26314a] shadow-[0_6px_0_#26314a] transition-transform active:translate-y-1 active:shadow-none ${listening ? "bg-[#dbf884]" : "bg-[#ff643b]"}`}
        >
          {listening ? <Square size={29} strokeWidth={1.8} /> : <Mic size={34} strokeWidth={1.8} />}
        </button>
      </div>
      <h3 className="text-center font-[family-name:var(--font-display)] text-[28px] font-semibold tracking-[-.8px]">
        {listening ? "Go ahead. I'm listening." : "Some things are easier said."}
      </h3>
      <p className="mt-2! text-center text-[11px] leading-relaxed text-[#939c85]">
        {listening
          ? "Tap the square when you're finished."
          : "Tap the mic, ask a question, then review it before sending."}
      </p>
      <div className="my-5 flex h-7 items-center justify-center gap-1" aria-hidden="true">
        {[12, 20, 14, 27, 18, 24, 10, 22, 16, 27, 14, 20, 12].map((h, i) => (
          <span
            key={`${h}-${String(i)}`}
            className={`w-1 rounded-full bg-[#dfcab0] ${listening ? "animate-pulse bg-[#ff643b]!" : ""}`}
            style={{ height: `${h}px`, animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      {error && (
        <p
          role="alert"
          className="mb-4! rounded-xl border border-[#e9c9b5] bg-[#fff0e4] p-3 text-[11px] leading-relaxed text-[#a26842]"
        >
          <MicOff size={14} className="mr-1 inline" />
          {error}
        </p>
      )}
      <label className="text-[10px] font-bold text-[#7d886e]" htmlFor="voice-transcript">
        {sample ? "SAMPLE TRANSCRIPT · SIMULATED" : "YOUR WORDS"}
      </label>
      <textarea
        id="voice-transcript"
        value={transcript}
        onChange={(event) => {
          setTranscript(event.target.value.slice(0, 500));
          setSample(false);
        }}
        placeholder={
          language === "id-ID" ? "Kalau harga NEAR turun 20%, gimana?" : "What if NEAR drops 20%?"
        }
        rows={3}
        maxLength={500}
        className="mt-2 resize-none rounded-xl border border-[#dce1d0] bg-[#f6f7ef] p-3 font-[family-name:var(--font-body)] text-xs leading-relaxed outline-[#284bdf]"
      />
      <button
        type="button"
        disabled={!transcript.trim() || listening}
        onClick={() => {
          recognition.current?.abort();
          onSend(transcript);
          onNotice(
            sample
              ? "A labelled voice sample was sent to the scripted demo chat."
              : "Your transcript was sent to Mr.Fund's demo chat.",
          );
        }}
        className="mt-3 flex items-center justify-between rounded-xl border-0 bg-[#284bdf] px-4 py-3 text-xs font-bold text-white disabled:opacity-40"
      >
        <span className="flex items-center gap-2">
          <Check size={16} />
          Send my question
        </span>
        <ArrowUpRight size={17} />
      </button>
      <button
        type="button"
        onClick={() => {
          setTranscript(
            language === "id-ID"
              ? "Kalau harga NEAR turun 20%, aku aman?"
              : "What if NEAR drops 20%?",
          );
          setSample(true);
        }}
        className="mt-4 flex items-center justify-center gap-1.5 border-0 bg-transparent text-[10px] font-semibold text-[#8c967c]"
      >
        <AudioLines size={13} />
        Try a demo transcript
      </button>
      <p className="mt-5! text-center text-[8px] leading-relaxed text-[#a1a88f]">
        Voice uses your browser's speech service; its provider may process audio. Mr.Fund's replies
        are scripted in this demo. No transaction is authorized by speaking.
      </p>
    </div>
  );
}

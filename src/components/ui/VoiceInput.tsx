import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "./Toast";

// Minimal typings for the Web Speech API (not in standard lib.d.ts)
interface SRResultAlt { transcript: string; confidence: number }
interface SRResult { 0: SRResultAlt; isFinal: boolean; length: number }
interface SRResults { 0: SRResult; length: number }
interface SRErrorEvent { error: string; message?: string }
interface SREvent { results: SRResults; resultIndex: number }
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

function getRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

interface VoiceInputProps {
  field: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ field, label, value, onChange, disabled }: VoiceInputProps) {
  const { t, i18n } = useTranslation();
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => getRecognition() !== null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => {
      try { recRef.current?.abort(); } catch { /* noop */ }
    };
  }, []);

  const start = () => {
    if (!supported) {
      toast.error(t("voice.notSupported"));
      return;
    }

    // Clean up any prior instance
    try { recRef.current?.abort(); } catch { /* noop */ }

    const rec = getRecognition();
    if (!rec) return;
    rec.lang = i18n.language === "am" ? "am-ET" : "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);

    rec.onresult = (e: SREvent) => {
      // results[i][j] — i is the utterance index, j is the alternative
      const result = e.results[0];
      if (result && result.length > 0) {
        const transcript = result[0].transcript.trim();
        if (transcript) {
          onChange(value ? `${value} ${transcript}` : transcript);
        }
      }
    };

    rec.onerror = (e: SRErrorEvent) => {
      if (e.error === "no-speech") {
        toast.error(t("voice.noSpeech"));
      } else if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error(t("voice.permissionDenied"));
      } else if (e.error === "audio-capture") {
        toast.error(t("voice.audioCapture"));
      } else if (e.error === "network") {
        toast.error(t("voice.network"));
      } else {
        toast.error(t("voice.error"));
      }
      setListening(false);
    };

    rec.onend = () => setListening(false);

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setListening(false);
      toast.error(t("voice.error"));
    }
  };

  const stop = () => {
    try { recRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled
          title={t("voice.notSupported")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
        >
          <Mic className="w-3.5 h-3.5" />
          {t("register.voiceInput")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        data-field={field}
        onClick={listening ? stop : start}
        disabled={disabled}
        title={label}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border ${
          listening
            ? "bg-error-50 border-error-300 text-error-700 animate-pulse-soft"
            : "bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {listening ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        {listening ? t("register.listening") : t("register.voiceInput")}
      </button>
    </div>
  );
}

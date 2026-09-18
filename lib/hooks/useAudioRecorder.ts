"use client";

import { useRef, useState } from "react";

export type RecorderMode = "idle" | "recording" | "preview";

// Shared recording logic — used by both the buyer's request sheet and the
// seller's reply flow, so the actual MediaRecorder handling exists in one
// place instead of being duplicated. Requires a real mic (getUserMedia),
// works on localhost/HTTPS in any modern mobile or desktop browser.
export function useAudioRecorder() {
  const [mode, setMode] = useState<RecorderMode>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        setMode("preview");
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setMode("recording");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return true;
    } catch {
      // Mic permission denied, unavailable, or blocked — fail quietly,
      // caller decides what to show instead of a broken recording state.
      setMode("idle");
      return false;
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSeconds(0);
    setMode("idle");
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  return { mode, audioUrl, seconds, start, stop, reset };
}

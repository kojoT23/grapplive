"use client";

import { useState } from "react";
import { IconX, IconMicrophone, IconPlayerStopFilled, IconSend } from "@tabler/icons-react";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";

type Screen = "idle" | "recording" | "preview";

export function SellerReplyModal({
  isOpen,
  onClose,
  buyerLabel,
  onSend,
}: {
  isOpen: boolean;
  onClose: () => void;
  buyerLabel: string;
  onSend: (audioUrl: string) => void;
}) {
  const recorder = useAudioRecorder();
  const [screen, setScreen] = useState<Screen>("idle");

  const handleClose = () => {
    recorder.reset();
    setScreen("idle");
    onClose();
  };

  const handleStart = async () => {
    setScreen("recording");
    const started = await recorder.start();
    if (!started) setScreen("idle");
  };

  const handleStop = () => {
    recorder.stop();
    setScreen("preview");
  };

  const handleSend = () => {
    if (!recorder.audioUrl) return;
    onSend(recorder.audioUrl);
    recorder.reset();
    setScreen("idle");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] md:max-w-[720px] bg-white rounded-t-2xl px-4 pt-5 pb-6 relative"
      >
        <div className="w-9 h-1 bg-gl-border-strong rounded-full mx-auto mb-3 absolute left-1/2 -translate-x-1/2 top-2" />
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-semibold text-gl-text">Reply to {buyerLabel}</span>
          <button onClick={handleClose} aria-label="Close" className="active:opacity-60 transition-opacity">
            <IconX size={18} className="text-gl-text-secondary" />
          </button>
        </div>

        {screen === "idle" && (
          <button
            onClick={handleStart}
            className="w-full flex flex-col items-center gap-2 py-6 active:opacity-70 transition-opacity"
          >
            <div className="w-14 h-14 rounded-full bg-gl-brand flex items-center justify-center">
              <IconMicrophone size={24} className="text-white" />
            </div>
            <span className="text-[11px] font-semibold text-gl-text">Tap to record a reply</span>
          </button>
        )}

        {screen === "recording" && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 rounded-full bg-gl-red flex items-center justify-center mb-4 gl-live-pulse">
              <IconMicrophone size={26} className="text-white" />
            </div>
            <div className="text-[18px] font-semibold text-gl-text mb-4">
              0:{recorder.seconds.toString().padStart(2, "0")}
            </div>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 bg-gl-text text-white text-[12px] font-semibold px-5 py-2.5 rounded-lg active:opacity-80 transition-opacity"
            >
              <IconPlayerStopFilled size={14} />
              Stop
            </button>
          </div>
        )}

        {screen === "preview" && recorder.audioUrl && (
          <div className="flex flex-col items-center py-4">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio src={recorder.audioUrl} controls className="w-full mb-4" />
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  recorder.reset();
                  setScreen("idle");
                }}
                className="flex-1 border border-gl-border-strong text-gl-text text-[12px] font-semibold py-2.5 rounded-lg active:bg-gl-bg-muted transition-colors"
              >
                Re-record
              </button>
              <button
                onClick={handleSend}
                className="flex-1 bg-gl-brand text-white text-[12px] font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity"
              >
                <IconSend size={13} />
                Send reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

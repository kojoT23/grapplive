"use client";

import { useState } from "react";
import {
  IconMicrophone,
  IconVideo,
  IconX,
  IconPlayerStopFilled,
  IconSend,
  IconCircleCheck,
} from "@tabler/icons-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useBuyerRequestsStore } from "@/lib/store/useBuyerRequestsStore";
import { useAuthGate } from "@/lib/hooks/useAuthGate";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";

type Screen = "choose" | "recording" | "preview" | "sent";

export function BuyerRequestSheet({
  isOpen,
  onClose,
  productId,
  productName,
  sellerId,
}: {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  sellerId: string;
}) {
  const phone = useAppStore((s) => s.phone);
  const requireAuth = useAuthGate();
  const addRequest = useBuyerRequestsStore((s) => s.addRequest);
  const recorder = useAudioRecorder();
  const [screen, setScreen] = useState<Screen>("choose");

  const handleClose = () => {
    recorder.reset();
    setScreen("choose");
    onClose();
  };

  const handleStartRecording = () => {
    requireAuth(async () => {
      setScreen("recording");
      const started = await recorder.start();
      if (!started) setScreen("choose");
    });
  };

  const handleStopRecording = () => {
    recorder.stop();
    setScreen("preview");
  };

  const handleSendAudio = () => {
    if (!recorder.audioUrl) return;
    addRequest({
      productId,
      productName,
      sellerId,
      buyerPhone: phone,
      type: "audio",
      audioUrl: recorder.audioUrl,
      durationSeconds: recorder.seconds,
    });
    setScreen("sent");
  };

  const handleRequestVideoCall = () => {
    requireAuth(() => {
      addRequest({ productId, productName, sellerId, buyerPhone: phone, type: "video_call" });
      setScreen("sent");
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] md:max-w-[720px] bg-white rounded-t-2xl px-4 pt-5 pb-6 relative"
      >
        <div className="w-9 h-1 bg-gl-border-strong rounded-full mx-auto mb-3 absolute left-1/2 -translate-x-1/2 top-2" />
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] font-semibold text-gl-text">Ask about this item</span>
          <button onClick={handleClose} aria-label="Close" className="active:opacity-60 transition-opacity">
            <IconX size={18} className="text-gl-text-secondary" />
          </button>
        </div>
        <p className="text-[11px] text-gl-text-secondary mb-4 truncate">{productName}</p>

        {screen === "choose" && (
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleStartRecording}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gl-brand-soft-bg border border-gl-brand text-left active:opacity-80 transition-opacity"
            >
              <div className="w-11 h-11 rounded-full bg-gl-brand flex items-center justify-center shrink-0">
                <IconMicrophone size={20} className="text-white" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-gl-text">Send a voice note</div>
                <div className="text-[10px] text-gl-text-secondary">Ask your question out loud</div>
              </div>
            </button>
            <button
              onClick={handleRequestVideoCall}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gl-bg-muted text-left active:bg-gl-border transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-gl-navy flex items-center justify-center shrink-0">
                <IconVideo size={20} className="text-white" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-gl-text">Request a video call</div>
                <div className="text-[10px] text-gl-text-secondary">Seller will call you on WhatsApp</div>
              </div>
            </button>
          </div>
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
              onClick={handleStopRecording}
              className="flex items-center gap-2 bg-gl-text text-white text-[12px] font-semibold px-5 py-2.5 rounded-lg active:opacity-80 transition-opacity"
            >
              <IconPlayerStopFilled size={14} />
              Stop recording
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
                  setScreen("choose");
                }}
                className="flex-1 border border-gl-border-strong text-gl-text text-[12px] font-semibold py-2.5 rounded-lg active:bg-gl-bg-muted transition-colors"
              >
                Re-record
              </button>
              <button
                onClick={handleSendAudio}
                className="flex-1 bg-gl-brand text-white text-[12px] font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity"
              >
                <IconSend size={13} />
                Send
              </button>
            </div>
          </div>
        )}

        {screen === "sent" && (
          <div className="flex flex-col items-center py-6 text-center">
            <IconCircleCheck size={44} className="text-gl-green mb-3" />
            <p className="text-[12px] font-semibold text-gl-text mb-1">Sent to the seller</p>
            <p className="text-[10px] text-gl-text-secondary mb-4">They&apos;ll get back to you soon.</p>
            <button
              onClick={handleClose}
              className="bg-gl-brand text-white text-[12px] font-semibold px-6 py-2.5 rounded-lg active:opacity-80 transition-opacity"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

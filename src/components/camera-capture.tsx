"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export function CameraCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (photoBlob: Blob) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError(t("cameraAccessNeeded")));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL("image/jpeg", 0.85));
  }

  function handleRetake() {
    setCaptured(null);
  }

  function handleUsePhoto() {
    canvasRef.current?.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      "image/jpeg",
      0.85
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-ink">
      <div className="relative flex-1">
        {error ? (
          <div className="flex h-full items-center justify-center px-8 text-center text-sm text-paper/70">
            {error}
          </div>
        ) : captured ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={captured} alt="Captured proof of presence" className="h-full w-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex items-center justify-center gap-6 bg-ink px-6 py-6">
        {captured ? (
          <>
            <Button variant="secondary" onClick={handleRetake} className="!rounded-full !border-paper/40 !text-paper">
              <RotateCcw size={16} />
              {t("retake")}
            </Button>
            <Button onClick={handleUsePhoto} className="!rounded-full !bg-amber !border-amber !text-ink">
              <Check size={16} />
              {t("usePhoto")}
            </Button>
          </>
        ) : (
          <>
            <button onClick={onCancel} className="text-sm text-paper/70">
              {t("cancel")}
            </button>
            <button
              onClick={handleCapture}
              disabled={!!error}
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-paper/30 bg-paper disabled:opacity-40"
              aria-label="Capture photo"
            >
              <Camera size={22} className="text-ink" />
            </button>
            <span className="w-10" />
          </>
        )}
      </div>
    </div>
  );
}

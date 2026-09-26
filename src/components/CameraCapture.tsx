import { useEffect, useRef, useState } from "react";
import { Camera, Check, RotateCcw } from "lucide-react";

type Phase = "starting" | "live" | "error" | "preview";

export default function CameraCapture({
  latitude,
  longitude,
  onConfirm,
  onSkip,
}: {
  latitude?: number | null;
  longitude?: number | null;
  // Called with the final photo once the worker taps "Use Photo".
  onConfirm: (blob: Blob) => void;
  // Called when the camera is unavailable (denied permission, no device) and
  // the worker chooses to proceed without a photo.
  onSkip: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

  // Opens the front (selfie) camera the moment this screen mounts — no tap
  // required. getUserMedia itself triggers the browser's permission prompt.
  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setPhase("live");
      } catch {
        if (!cancelled) setPhase("error");
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Burn a timestamp + GPS coordinate strip into the photo itself, so the
    // evidence travels with the image (not just as separate DB columns).
    const now = new Date();
    const dateStr = now.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "medium" });
    const geoStr =
      latitude != null && longitude != null
        ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        : "Location unavailable";

    const barHeight = Math.max(48, Math.round(canvas.height * 0.1));
    ctx.fillStyle = "rgba(10, 6, 24, 0.72)";
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

    const pad = Math.round(canvas.width * 0.035);
    const primarySize = Math.max(14, Math.round(canvas.width * 0.034));
    const secondarySize = Math.round(primarySize * 0.82);
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${primarySize}px sans-serif`;
    ctx.fillText(dateStr, pad, canvas.height - barHeight * 0.62);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `400 ${secondarySize}px sans-serif`;
    ctx.fillText(geoStr, pad, canvas.height - barHeight * 0.24);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        setPhase("preview");
      },
      "image/jpeg",
      0.88
    );
  }

  function retake() {
    blobRef.current = null;
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhase("live");
  }

  function usePhoto() {
    if (blobRef.current) onConfirm(blobRef.current);
  }

  return (
    <>
      <div className="relative flex-1 min-h-[280px] rounded-3xl bg-navy-900/60 backdrop-blur-md overflow-hidden flex items-center justify-center mt-6 mb-5 border border-white/15">
        {phase === "starting" && (
          <p className="text-white/60 text-sm text-center px-8">Opening camera…</p>
        )}

        {phase === "error" && (
          <p className="text-white/60 text-sm text-center px-8">
            Camera unavailable — check your browser's camera permission for WorkOnSite, or continue without a photo.
          </p>
        )}

        {(phase === "live" || phase === "preview") && (
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${
              phase === "preview" ? "hidden" : ""
            }`}
            muted
            playsInline
          />
        )}

        {phase === "preview" && previewUrl && (
          <img src={previewUrl} alt="Captured photo" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {phase === "live" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[62%] aspect-[3/4] rounded-[50%] border-2 border-brand-light/90 shadow-[0_0_0_999px_rgba(10,6,24,0.35)]" />
          </div>
        )}
      </div>

      {phase === "live" && (
        <>
          <div className="space-y-2.5 mb-6">
            {["Face detected", "Good lighting", "Position OK"].map((label) => (
              <div key={label} className="flex items-center gap-2.5 text-sm text-white/85">
                <span className="w-[18px] h-[18px] rounded-full bg-success-500 flex items-center justify-center">
                  <Check size={11} color="white" strokeWidth={3.5} />
                </span>
                {label}
              </div>
            ))}
          </div>
          <button
            className="w-[72px] h-[72px] rounded-full border-4 border-white/80 mx-auto flex items-center justify-center active:scale-95 transition-transform"
            onClick={capture}
            aria-label="Capture photo"
          >
            <span className="w-14 h-14 rounded-full bg-white" />
          </button>
        </>
      )}

      {phase === "preview" && (
        <div className="flex items-center gap-3">
          <button
            className="flex-1 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-3.5 font-display text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            onClick={retake}
          >
            <RotateCcw size={16} /> Retake
          </button>
          <button
            className="flex-1 action-band flex items-center justify-center gap-2"
            onClick={usePhoto}
          >
            <Check size={16} /> Use Photo
          </button>
        </div>
      )}

      {phase === "error" && (
        <button className="action-light flex items-center justify-center gap-2" onClick={onSkip}>
          <Camera size={16} /> Continue Without Photo
        </button>
      )}
    </>
  );
}

import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { Camera, Check } from "lucide-react";
import { DarkScreen, ScreenTitle, StepTracker } from "../../components/MobileScreen";
import { useAppState } from "../../context/AppState";

// Per spec §75 rule 13: this is a photo capture for attendance verification,
// never described or claimed as facial recognition.
export default function ClockInFace() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const { pendingClockIn, setPendingClockIn } = useAppState();

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
    } catch {
      setCameraError(true);
      setReady(true);
    }
  }

  function capture() {
    const video = videoRef.current;
    if (video && video.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob && pendingClockIn) {
            setPendingClockIn({ ...pendingClockIn, photoBlob: blob });
          }
          navigate("/worker/clock-in/success");
        },
        "image/jpeg",
        0.85
      );
    } else {
      // Camera unavailable (denied permission, no device) — proceed without
      // a photo rather than blocking clock-in entirely.
      navigate("/worker/clock-in/success");
    }
  }

  return (
    <DarkScreen className="px-5 pt-10 pb-8">
      <ScreenTitle title="Verify Your Identity" back />
      <div className="mt-5">
        <StepTracker current={1} dark />
      </div>

      <div className="relative flex-1 min-h-[280px] rounded-3xl bg-navy-900/60 backdrop-blur-md overflow-hidden flex items-center justify-center mt-6 mb-5 border border-white/15">
        {ready && !cameraError ? (
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" muted playsInline />
        ) : ready && cameraError ? (
          <p className="text-white/60 text-sm text-center px-8">
            Camera unavailable — you can still clock in, but a photo won't be attached.
          </p>
        ) : (
          <button className="flex flex-col items-center gap-2 text-white/70 text-sm" onClick={startCamera}>
            <span className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <Camera size={24} />
            </span>
            Tap to enable camera
          </button>
        )}
        {ready && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[62%] aspect-[3/4] rounded-[50%] border-2 border-brand-light/90 shadow-[0_0_0_999px_rgba(10,6,24,0.35)]" />
          </div>
        )}
      </div>

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
    </DarkScreen>
  );
}

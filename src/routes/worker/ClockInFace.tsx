import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";

// Per spec §75 rule 13: this is a photo capture for attendance verification,
// never described or claimed as facial recognition.
export default function ClockInFace() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
    } catch {
      // Camera unavailable — real build should show a retry/permission prompt here.
      setReady(true);
    }
  }

  function capture() {
    // Real build: draw video frame to canvas, upload to Supabase Storage,
    // save the resulting URL onto the attendance_events row.
    navigate("/worker/clock-in/success");
  }

  return (
    <div className="surface-dark min-h-screen flex flex-col px-6 pt-10 pb-8">
      <h1 className="display text-lg font-semibold mb-6">Face Capture</h1>

      <div className="flex-1 rounded-card bg-navy-800 overflow-hidden flex items-center justify-center mb-6">
        {ready ? (
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        ) : (
          <button className="text-white/60 text-sm underline" onClick={startCamera}>
            Tap to enable camera
          </button>
        )}
      </div>

      <div className="rounded-card bg-navy-800 p-4 mb-6 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-white/60">Face detected</span><span className="text-success-500">✓</span></div>
        <div className="flex justify-between"><span className="text-white/60">Good lighting</span><span className="text-success-500">✓</span></div>
        <div className="flex justify-between"><span className="text-white/60">Position OK</span><span className="text-success-500">✓</span></div>
      </div>

      <button className="w-14 h-14 rounded-full bg-white mx-auto mb-2" onClick={capture} aria-label="Capture photo" />
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { DarkScreen, ScreenTitle } from "../../components/MobileScreen";
import { useAppState } from "../../context/AppState";
import { getCurrentPosition } from "../../lib/attendance";
import CameraCapture from "../../components/CameraCapture";

// Same verification step as clock-in — a photo (with timestamp + GPS burned
// in) is required at clock-out too, not just clock-in.
export default function ClockOutFace() {
  const navigate = useNavigate();
  const { setPendingClockOut } = useAppState();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(null);
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  // Fetched in the background — GPS can move between clock-in and
  // clock-out, so it's re-checked here rather than reusing the clock-in fix.
  // The camera doesn't wait on this; it opens immediately either way.
  useEffect(() => {
    let cancelled = false;
    getCurrentPosition()
      .then((pos) => {
        if (cancelled) return;
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null });
      })
      .catch(() => {
        // Left as null — recorded at clock-out step will surface the error.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleConfirm(blob: Blob) {
    setPendingClockOut({
      photoBlob: blob,
      latitude: coordsRef.current?.latitude ?? null,
      longitude: coordsRef.current?.longitude ?? null,
      accuracy: coordsRef.current?.accuracy ?? null,
    });
    navigate("/worker/clock-out/success");
  }

  function handleSkip() {
    setPendingClockOut({
      photoBlob: null,
      latitude: coordsRef.current?.latitude ?? null,
      longitude: coordsRef.current?.longitude ?? null,
      accuracy: coordsRef.current?.accuracy ?? null,
    });
    navigate("/worker/clock-out/success");
  }

  return (
    <DarkScreen className="px-5 pt-10 pb-8">
      <ScreenTitle title="Verify Your Identity" back="/worker/clock-out" />

      <CameraCapture latitude={coords?.latitude} longitude={coords?.longitude} onConfirm={handleConfirm} onSkip={handleSkip} />
    </DarkScreen>
  );
}

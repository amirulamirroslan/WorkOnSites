import { useNavigate } from "react-router-dom";
import { DarkScreen, ScreenTitle, StepTracker } from "../../components/MobileScreen";
import { useAppState } from "../../context/AppState";
import CameraCapture from "../../components/CameraCapture";

// Per spec §75 rule 13: this is a photo capture for attendance verification,
// never described or claimed as facial recognition.
export default function ClockInFace() {
  const navigate = useNavigate();
  const { pendingClockIn, setPendingClockIn } = useAppState();

  function handleConfirm(blob: Blob) {
    if (pendingClockIn) setPendingClockIn({ ...pendingClockIn, photoBlob: blob });
    navigate("/worker/clock-in/success");
  }

  function handleSkip() {
    if (pendingClockIn) setPendingClockIn({ ...pendingClockIn, photoBlob: null });
    navigate("/worker/clock-in/success");
  }

  return (
    <DarkScreen className="px-5 pt-10 pb-8">
      <ScreenTitle title="Verify Your Identity" back />
      <div className="mt-5">
        <StepTracker current={1} dark />
      </div>

      <CameraCapture
        latitude={pendingClockIn?.latitude}
        longitude={pendingClockIn?.longitude}
        onConfirm={handleConfirm}
        onSkip={handleSkip}
      />
    </DarkScreen>
  );
}

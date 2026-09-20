// Green confirmation badge for the clock-in / clock-out success screens:
// the disc pops in with a little overshoot, two soft rings burst outward,
// and the tick draws itself (see "Page + success motion" in styles/index.css).
export default function SuccessBadge({ size = 96 }: { size?: number }) {
  return (
    <div className="relative mx-auto mb-6" style={{ width: size, height: size }} aria-hidden>
      <span className="success-burst absolute inset-0 rounded-full bg-success-500/35" />
      <span className="success-burst success-burst--late absolute inset-0 rounded-full bg-success-500/20" />
      <div className="success-pop relative w-full h-full rounded-full bg-success-500 flex items-center justify-center shadow-[0_10px_30px_rgba(34,197,94,0.4)]">
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
          <path
            className="check-draw"
            d="M5 12.5l4.5 4.5L19 7.5"
            pathLength={1}
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

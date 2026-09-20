import { useAnimatedNumber } from "../lib/useAnimatedNumber";

export default function ProgressRing({ percent, size = 96 }: { percent: number; size?: number }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const shown = useAnimatedNumber(percent);
  const offset = circumference - (shown / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="shrink-0">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="#E3ECFB" strokeWidth="11" />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#1A6BFF"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="68" textAnchor="middle" fill="#0B1B3A" style={{ fontWeight: 700, fontSize: 26 }}>
        {Math.round(shown)}%
      </text>
    </svg>
  );
}

import { motion } from "framer-motion";
import { CountUp } from "./Motion";

export default function ProgressRing({ percent, size = 96 }: { percent: number; size?: number }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className="shrink-0">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="#EAE2FF" strokeWidth="11" />
      <motion.circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#6C5CE7"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - (percent / 100) * circumference }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="68" textAnchor="middle" fill="#170F33" style={{ fontWeight: 700, fontSize: 26 }}>
        <CountUp value={percent} suffix="%" />
      </text>
    </svg>
  );
}

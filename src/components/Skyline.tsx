// Stylised Kuala Lumpur skyline (twin towers + KL Tower) used as a soft
// backdrop on the splash/login screens and the owner dashboard banner.
export default function Skyline({
  className = "",
  fit = "meet",
  style,
}: {
  className?: string;
  fit?: "meet" | "slice";
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 400 220"
      preserveAspectRatio={`xMidYMax ${fit}`}
      className={className}
      style={style}
      aria-hidden
      fill="none"
    >
      <defs>
        <linearGradient id="sky-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6FA8FF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#1A4FB8" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="sky-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3F7BE8" stopOpacity="0.30" />
          <stop offset="1" stopColor="#123A7A" stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id="sky-glow" cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor="#3F8CFF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#3F8CFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="220" fill="url(#sky-glow)" />

      {/* back row of buildings */}
      <g fill="url(#sky-back)">
        <rect x="0" y="140" width="28" height="80" />
        <rect x="26" y="120" width="22" height="100" />
        <rect x="52" y="150" width="30" height="70" />
        <rect x="84" y="128" width="20" height="92" />
        <rect x="270" y="130" width="24" height="90" />
        <rect x="330" y="118" width="26" height="102" />
        <rect x="356" y="146" width="24" height="74" />
        <rect x="378" y="126" width="22" height="94" />
      </g>

      {/* twin towers */}
      <g fill="url(#sky-fill)">
        <path d="M137 220V96l5-16 4-24 5-30 5 30 4 24 5 16v124z" />
        <path d="M201 220V96l5-16 4-24 5-30 5 30 4 24 5 16v124z" />
        <rect x="167" y="118" width="34" height="8" />
      </g>
      <g stroke="#9CC4FF" strokeOpacity="0.35" strokeWidth="1">
        <path d="M151 4v22M215 4v22" />
      </g>

      {/* KL Tower */}
      <g fill="url(#sky-fill)">
        <rect x="302" y="70" width="5" height="150" />
        <ellipse cx="304.5" cy="84" rx="13" ry="8" />
        <rect x="303.5" y="30" width="2" height="40" />
      </g>

      {/* front row */}
      <g fill="url(#sky-back)">
        <rect x="100" y="170" width="30" height="50" />
        <rect x="236" y="160" width="28" height="60" />
        <rect x="312" y="176" width="24" height="44" />
      </g>
    </svg>
  );
}

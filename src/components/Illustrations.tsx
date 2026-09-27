// Original spot illustrations in the app's own aurora-violet palette.
// Flat, rounded, friendly shapes (no traced/borrowed artwork) used to give
// hero banners and empty states the warmth the reference design has instead
// of plain icon-in-a-circle placeholders.
import { useId } from "react";

function useGrad() {
  const uid = useId().replace(/:/g, "");
  return {
    violet: `il-violet-${uid}`,
    skin: `il-skin-${uid}`,
    cyan: `il-cyan-${uid}`,
    pink: `il-pink-${uid}`,
  };
}

/** Decorative floating blobs — drop behind any hero card for depth. */
export function BlobField({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <span className="absolute -top-6 -right-8 w-28 h-28 rounded-full bg-aurora-cyan/25 blur-2xl animate-floaty" />
      <span
        className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-aurora-pink/20 blur-2xl animate-floaty"
        style={{ animationDelay: "1.2s" }}
      />
      <span
        className="absolute top-1/3 left-1/2 w-16 h-16 rounded-full bg-aurora-amber/20 blur-xl animate-floaty"
        style={{ animationDelay: "0.6s" }}
      />
    </div>
  );
}

/** Person relaxing next to a big checkmark clipboard — "all caught up" empty state. */
export function EmptyTasksArt({ className = "" }: { className?: string }) {
  const g = useGrad();
  return (
    <svg viewBox="0 0 220 160" className={className} aria-hidden>
      <defs>
        <linearGradient id={g.violet} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A78BFA" />
          <stop offset="1" stopColor="#6C5CE7" />
        </linearGradient>
        <linearGradient id={g.skin} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD9B8" />
          <stop offset="1" stopColor="#F4B888" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="146" rx="72" ry="10" fill="#6C5CE7" opacity="0.08" />
      {/* clipboard */}
      <g transform="translate(112 20)">
        <rect x="0" y="10" width="70" height="94" rx="14" fill={`url(#${g.violet})`} />
        <rect x="10" y="0" width="50" height="18" rx="8" fill="#4A38D6" />
        <rect x="10" y="30" width="50" height="8" rx="4" fill="#fff" opacity="0.85" />
        <rect x="10" y="46" width="36" height="8" rx="4" fill="#fff" opacity="0.6" />
        <circle cx="35" cy="76" r="20" fill="#22D3EE" />
        <path d="M25 76l7 7 14-14" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      {/* seated person */}
      <g transform="translate(20 46)">
        <circle cx="34" cy="18" r="16" fill={`url(#${g.skin})`} />
        <path d="M18 14a16 14 0 0 1 32 0c0-10-7-18-16-18s-16 8-16 18Z" fill="#2B1A55" />
        <path d="M6 94c0-24 14-40 28-40s28 16 28 40" fill="#8B7BFF" />
        <path d="M6 94h56v10a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6Z" fill="#4A38D6" />
        <ellipse cx="0" cy="88" rx="10" ry="7" fill={`url(#${g.skin})`} />
        <ellipse cx="68" cy="88" rx="10" ry="7" fill={`url(#${g.skin})`} />
      </g>
    </svg>
  );
}

/** Small badge illustration for the clock-in hero — a location pin with soft rings. */
export function LocationPinArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="60" r="58" fill="#fff" opacity="0.08" />
      <circle cx="60" cy="60" r="40" fill="#fff" opacity="0.10" />
      <path
        d="M60 26c-13.3 0-24 10.7-24 24 0 18 24 44 24 44s24-26 24-44c0-13.3-10.7-24-24-24Z"
        fill="#fff"
        opacity="0.92"
      />
      <circle cx="60" cy="50" r="10" fill="#6C5CE7" />
    </svg>
  );
}

/** Person pointing at a warning triangle — header art for the Report screen. */
export function ReportIssueArt({ className = "" }: { className?: string }) {
  const g = useGrad();
  return (
    <svg viewBox="0 0 220 130" className={className} aria-hidden>
      <defs>
        <linearGradient id={g.pink} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F472B6" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="120" rx="80" ry="8" fill="#000" opacity="0.06" />
      <g transform="translate(118 14)">
        <path d="M40 0 78 70H2Z" rx="8" fill={`url(#${g.pink})`} />
        <rect x="36" y="26" width="8" height="24" rx="4" fill="#fff" />
        <circle cx="40" cy="58" r="5" fill="#fff" />
      </g>
      <g transform="translate(14 20)">
        <circle cx="34" cy="18" r="16" fill="#FFD9B8" />
        <path d="M18 14a16 15 0 0 1 32 0c0-11-7-19-16-19s-16 8-16 19Z" fill="#2B1A55" />
        <path d="M8 90c0-22 12-38 26-38s26 16 26 38" fill="#22D3EE" />
        <path d="M52 60 74 40" stroke="#22D3EE" strokeWidth="10" strokeLinecap="round" />
        <circle cx="78" cy="36" r="7" fill="#FFD9B8" />
      </g>
    </svg>
  );
}

/** Friendly waving bust used as a soft watermark behind the Profile header. */
export function ProfileWaveArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden>
      <circle cx="80" cy="80" r="80" fill="#fff" opacity="0.06" />
      <g transform="translate(40 34)">
        <circle cx="40" cy="26" r="22" fill="#FFD9B8" />
        <path d="M18 22a22 20 0 0 1 44 0c0-15-10-26-22-26S18 7 18 22Z" fill="#fff" opacity="0.65" />
        <path d="M4 118c0-30 16-52 36-52s36 22 36 52" fill="#fff" opacity="0.5" />
        <path d="M70 46c8 4 14 12 16 12s6-4 6-9" stroke="#fff" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6" />
      </g>
    </svg>
  );
}

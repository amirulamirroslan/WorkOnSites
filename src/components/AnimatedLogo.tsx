// The WorkOnSite mark with a slow, mostly-idle loop: a gloss sweep followed by
// two beacon rings pinging outward (see "Animated logo" in styles/index.css).
// Pure CSS transform/opacity — no JS timers, no re-renders.
export default function AnimatedLogo({
  size = 40,
  animated = true,
  glow = true,
  className = "",
}: {
  size?: number;
  animated?: boolean;
  glow?: boolean;
  className?: string;
}) {
  return (
    <span className={`logo-mark ${className}`} style={{ width: size, height: size }} aria-hidden>
      {animated && (
        <>
          <span className="logo-mark__halo" />
          <span className="logo-mark__halo logo-mark__halo--late" />
        </>
      )}
      <img
        src="/logo-256.png"
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="block w-full h-full select-none"
      />
      <span className={`logo-mark__face ${glow ? "logo-mark__face--glow" : ""}`}>
        {animated && <span className="logo-mark__shine" />}
      </span>
    </span>
  );
}

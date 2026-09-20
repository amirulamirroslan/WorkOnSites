import { ReactNode } from "react";
import Skyline from "./Skyline";

export function Wordmark({ size = "text-3xl" }: { size?: string }) {
  return (
    <h1 className={`display ${size} font-extrabold tracking-tight text-white`}>
      Work<span className="text-brand-light">O</span>nSite
    </h1>
  );
}

// Dark navy splash-style shell with the skyline backdrop — shared by
// Splash, Login and Register.
export default function AuthShell({
  children,
  skyline = "mid",
}: {
  children: ReactNode;
  skyline?: "mid" | "bottom" | "none";
}) {
  return (
    <div className="bg-navy-950 min-h-screen">
      <div className="mobile-bg text-white min-h-screen max-w-md mx-auto relative overflow-hidden flex flex-col">
        {skyline === "mid" && (
          <Skyline
            className="absolute inset-x-0 top-[32%] w-full h-[44%] pointer-events-none select-none"
            style={{ WebkitMaskImage: "linear-gradient(to bottom, #000 62%, transparent)", maskImage: "linear-gradient(to bottom, #000 62%, transparent)" }}
          />
        )}
        {skyline === "bottom" && (
          <Skyline className="absolute inset-x-0 bottom-0 w-full h-[42%] opacity-40 pointer-events-none select-none" />
        )}
        <div className="relative z-10 flex-1 flex flex-col px-8 pt-16 pb-10">{children}</div>
      </div>
    </div>
  );
}

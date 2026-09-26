import { ReactNode } from "react";
import Skyline from "./Skyline";

export function Wordmark({ size = "text-3xl" }: { size?: string }) {
  return (
    <h1 className={`display ${size} font-extrabold tracking-tight text-white`}>
      Work<span className="text-brand-light">O</span>nSite
    </h1>
  );
}

// Dark navy shell shared by Splash, Login, Register, Forgot/Set password.
// Phone: full-height column. Laptop: full-width navy screen, a skyline that
// spans the whole bottom edge, and the content centred in a column (or a
// glass panel for forms — `panel`).
export default function AuthShell({
  children,
  skyline = "mid",
  panel = false,
}: {
  children: ReactNode;
  skyline?: "mid" | "bottom" | "none";
  panel?: boolean;
}) {
  const tiles = (
    <>
      <Skyline className="w-full md:w-1/3 h-full" />
      <Skyline className="hidden md:block w-1/3 h-full -scale-x-100" />
      <Skyline className="hidden md:block w-1/3 h-full" />
    </>
  );

  return (
    <div className="mobile-bg text-white min-h-screen relative overflow-hidden flex flex-col">
      {skyline === "mid" && (
        <div className="skyline-fade absolute inset-x-0 top-[32%] h-[44%] md:top-auto md:bottom-0 md:h-[52%] flex items-end pointer-events-none select-none">
          {tiles}
        </div>
      )}
      {skyline === "bottom" && (
        <div className="absolute inset-x-0 bottom-0 h-[42%] md:h-[46%] flex items-end opacity-40 md:opacity-60 pointer-events-none select-none">
          {tiles}
        </div>
      )}

      {skyline === "none" && (
        <div className="hidden md:flex absolute inset-x-0 bottom-0 h-[46%] items-end opacity-50 pointer-events-none select-none">
          {tiles}
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col w-full max-w-md md:max-w-lg mx-auto">
        <div
          className={`flex-1 flex flex-col px-8 pt-16 pb-10 md:flex-none md:my-auto ${
            panel ? "md:glass-dark md:rounded-3xl md:px-10 md:py-10" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

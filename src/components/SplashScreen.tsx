import { useEffect, useState } from "react";
import logo from "@/assets/scaniq-leaf-logo.png";

// Splash is fully removed from the DOM after this. JS timer is a back-up;
// the CSS animation below ALSO hides the overlay even if timers are throttled
// (iOS Safari can throttle setTimeout during first paint after a fresh load).
const MAX_SPLASH_MS = 2200;

/**
 * Custom ScanIQ Pro splash screen. Shows once per page-load for ~2s, then
 * fades out via CSS (so it never blocks the app even if JS timers stall).
 * Uses pointer-events-none so users can always interact with the app below.
 */
export function SplashScreen() {
  const [alreadyShown] = useState(() =>
    typeof sessionStorage !== "undefined" && sessionStorage.getItem("scaniq.splashShown") === "1"
  );
  const [visible, setVisible] = useState(!alreadyShown);

  useEffect(() => {
    if (alreadyShown) return;
    try { sessionStorage.setItem("scaniq.splashShown", "1"); } catch {}
    const hideT = setTimeout(() => setVisible(false), MAX_SPLASH_MS);
    return () => clearTimeout(hideT);
  }, [alreadyShown]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background pointer-events-none"
      style={{
        animation: "scaniqSplashFade 2.2s ease-out forwards",
      }}
      onAnimationEnd={() => setVisible(false)}
    >
      <style>{`
        @keyframes scaniqSplashFade {
          0%, 70% { opacity: 1; }
          100% { opacity: 0; visibility: hidden; }
        }
      `}</style>

      {/* Soft radial glow — circular, no square artifacts */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,hsl(24_95%_60%/0.22)_0%,hsl(120_40%_25%/0.10)_45%,transparent_70%)] blur-2xl" />
      </div>

      <div className="relative flex flex-col items-center animate-[fade-in_0.6s_ease-out]">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,hsl(24_95%_60%/0.55)_0%,transparent_70%)] blur-2xl scale-125" />
          <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-[0_8px_28px_hsl(24_95%_55%/0.35)]">
            <img
              src={logo}
              alt="ScanIQ Pro"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-[0.18em] k-gradient-text">
          ScanIQ
        </h1>

        {/* Spinner */}
        <div className="mt-8 w-7 h-7 rounded-full border-2 border-white/10 border-t-[#F59E5B] animate-spin" />
      </div>
    </div>
  );
}

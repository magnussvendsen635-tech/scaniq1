import { useEffect, useState } from "react";
import logo from "@/assets/scaniq-leaf-logo.png";

/**
 * Custom Scaniq Pro splash screen. Shows once per page-load for ~1.8s,
 * then fades out. Respects the app's dark theme — does not override
 * the user's background preference.
 */
export function SplashScreen() {
  const alreadyShown = typeof sessionStorage !== "undefined" && sessionStorage.getItem("scaniq.splashShown") === "1";
  const [visible, setVisible] = useState(!alreadyShown);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (alreadyShown) return;
    try { sessionStorage.setItem("scaniq.splashShown", "1"); } catch {}
    const fadeT = setTimeout(() => setFading(true), 1500);
    const hideT = setTimeout(() => setVisible(false), 2000);
    return () => {
      clearTimeout(fadeT);
      clearTimeout(hideT);
    };
  }, [alreadyShown]);

  if (!visible) return null;

  return (
    <div
      className={
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 " +
        (fading ? "opacity-0" : "opacity-100")
      }
    >
      {/* Soft orange gradient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#F59E5B]/25 via-[#2D5A27]/15 to-transparent blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center animate-[fade-in_0.6s_ease-out]">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F59E5B] to-[#2D5A27] blur-2xl opacity-50 scale-110" />
          <img
            src={logo}
            alt="Scaniq Pro"
            className="relative w-24 h-24 rounded-full drop-shadow-[0_8px_24px_rgba(245,158,91,0.45)]"
          />
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-[0.18em] k-gradient-text">
          Scaniq
        </h1>


        {/* Spinner */}
        <div className="mt-8 w-7 h-7 rounded-full border-2 border-white/10 border-t-[#F59E5B] animate-spin" />
      </div>
    </div>
  );
}

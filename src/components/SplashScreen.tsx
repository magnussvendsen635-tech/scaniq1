import { useEffect, useState } from "react";
import logo from "@/assets/scaniq-leaf-logo.png";

/**
 * Custom ScanIQ Pro splash screen. Shows once per page-load for ~1.8s,
 * then fades out. Respects the app's dark theme — does not override
 * the user's background preference.
 */
export function SplashScreen() {
  const [alreadyShown] = useState(() =>
    typeof sessionStorage !== "undefined" && sessionStorage.getItem("scaniq.splashShown") === "1"
  );
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

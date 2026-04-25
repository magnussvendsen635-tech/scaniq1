import logo from "@/assets/kcally-logo.png";

export const Logo = ({ size = 40, withText = false }: { size?: number; withText?: boolean }) => (
  <div className="flex items-center gap-3">
    <div
      className="rounded-2xl bg-gradient-primary p-[2px] shadow-glow"
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center overflow-hidden">
        <img src={logo} alt="KCALLY logo" width={size} height={size} className="w-[88%] h-[88%] object-contain invert" />
      </div>
    </div>
    {withText && (
      <span className="text-xl font-semibold tracking-[0.2em] k-gradient-text">KCALLY</span>
    )}
  </div>
);

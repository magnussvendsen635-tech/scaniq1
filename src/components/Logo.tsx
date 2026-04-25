import logo from "@/assets/kcally-logo.png";

export const Logo = ({ size = 40, withText = false }: { size?: number; withText?: boolean }) => (
  <div className="flex items-center gap-3">
    <img
      src={logo}
      alt="KCALLY app icon"
      width={size}
      height={size}
      loading="lazy"
      className="rounded-[22%] shadow-glow"
      style={{ width: size, height: size }}
    />
    {withText && (
      <span className="text-xl font-semibold tracking-[0.2em] k-gradient-text">KCALLY</span>
    )}
  </div>
);

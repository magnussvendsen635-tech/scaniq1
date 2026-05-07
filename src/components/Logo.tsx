import logo from "@/assets/kcally-logo.png";

export const Logo = ({ size = 40, withText = false }: { size?: number; withText?: boolean }) => (
  <div className="flex items-center gap-3">
    <img
      src={logo}
      alt="Scaniq app icon"
      width={size}
      height={size}
      loading="lazy"
      className="drop-shadow-[0_4px_12px_hsl(var(--primary)/0.4)]"
      style={{ width: size, height: size }}
    />
    {withText && (
      <span className="text-xl font-semibold tracking-[0.2em] k-gradient-text">Scaniq</span>
    )}
  </div>
);

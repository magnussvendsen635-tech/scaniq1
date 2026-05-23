import logo from "@/assets/scaniq-leaf-logo.png";

export const Logo = ({ size = 40, withText = false }: { size?: number; withText?: boolean }) => (
  <div className="flex items-center gap-3">
    <img
      src={logo}
      alt="Scaniq Pro app icon"
      width={size}
      height={size}
      loading="lazy"
      className="rounded-full drop-shadow-[0_4px_18px_hsl(var(--primary)/0.45)]"
      style={{ width: size, height: size }}
    />
    {withText && (
      <span className="text-xl font-semibold tracking-[0.18em] k-gradient-text">ScanIQ</span>
    )}
  </div>
);

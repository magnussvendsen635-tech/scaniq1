import logo from "@/assets/scaniq-logo-new.png";

export const Logo = ({ size = 40, withText = false }: { size?: number; withText?: boolean }) => (
  <div className="flex items-center gap-3">
    <img
      src={logo}
      alt="ScanIQ app icon"
      width={size}
      height={size}
      loading="lazy"
      className="block shrink-0"
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        background: "transparent",
      }}
    />
    {withText && (
      <span className="text-xl font-semibold tracking-[0.18em] k-gradient-text">ScanIQ</span>
    )}
  </div>
);

import logo from "@/assets/scaniq-leaf-logo.png";

export const Logo = ({ size = 40, withText = false }: { size?: number; withText?: boolean }) => (
  <div className="flex items-center gap-3">
    <div
      className="flex items-center justify-center overflow-hidden rounded-full drop-shadow-[0_4px_18px_hsl(var(--primary)/0.45)] shrink-0"
      style={{
        width: size,
        height: size,
        aspectRatio: "1 / 1",
        borderRadius: 9999,
      }}
    >
      <img
        src={logo}
        alt="Scaniq app icon"
        width={size}
        height={size}
        loading="lazy"
        className="block"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: 9999,
        }}
      />
    </div>
    {withText && (
      <span className="text-xl font-semibold tracking-[0.18em] k-gradient-text">Scaniq</span>
    )}
  </div>
);

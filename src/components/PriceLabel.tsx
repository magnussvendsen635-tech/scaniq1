import { useTText } from "@/i18n/useT";

/**
 * Renders the App Store-localized price string.
 * Never hardcodes a currency: while StoreKit has not answered we show a
 * skeleton, and when no price is available (web preview / offline) we show a
 * neutral fallback instead of a misleading "$" amount.
 */
export function PriceLabel({
  value,
  ready,
  className = "text-3xl font-bold tracking-tight",
}: {
  value: string | null;
  ready: boolean;
  className?: string;
}) {
  const tt = useTText();

  if (value) return <span className={className}>{value}</span>;

  if (!ready) {
    return (
      <span
        aria-hidden
        className="inline-block h-7 w-20 rounded-md bg-muted animate-pulse align-middle"
      />
    );
  }

  return (
    <span className="text-sm font-medium text-muted-foreground">
      {tt("See price in App Store")}
    </span>
  );
}

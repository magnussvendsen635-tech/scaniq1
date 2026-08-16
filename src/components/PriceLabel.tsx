/**
 * Renders the App Store-localized price string (RevenueCat `product.priceString`).
 * Never hardcodes a currency or amount: until StoreKit answers we render a
 * neutral skeleton, so no placeholder text like "See price in App Store" can
 * ever replace the real localized price in a plan card.
 */
export function PriceLabel({
  value,
  className = "text-3xl font-bold tracking-tight",
}: {
  value: string | null;
  /** Kept for call-site compatibility; the skeleton is shown whenever no price exists. */
  ready?: boolean;
  className?: string;
}) {
  if (value) return <span className={className}>{value}</span>;

  return (
    <span
      aria-hidden
      className="inline-block h-7 w-20 rounded-md bg-muted animate-pulse align-middle"
    />
  );
}

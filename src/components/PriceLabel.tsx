/**
 * Renders the App Store-localized price string (RevenueCat `product.priceString`).
 * Never hardcodes a currency or amount: until StoreKit answers we render a
 * neutral skeleton, so no placeholder text like "See price in App Store" can
 * ever replace the real localized price in a plan card.
 */
export function PriceLabel({
  value,
  loading,
  className = "text-3xl font-bold tracking-tight",
}: {
  value: string | null;
  loading: boolean;
  className?: string;
}) {
  if (value) return <span className={className}>{value}</span>;

  return (
    <span
      role="status"
      aria-label={loading ? "Loading App Store price" : "App Store price unavailable"}
      className="inline-block h-7 w-20 rounded-md bg-muted animate-pulse align-middle"
    />
  );
}

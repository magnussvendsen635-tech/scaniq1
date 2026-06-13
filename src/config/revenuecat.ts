// RevenueCat configuration — public client SDK keys.
// These are designed to be exposed in the client bundle (analogous to a
// Stripe publishable key). Do NOT put RevenueCat *secret* keys here.
//
// Where to find these:
//   RevenueCat dashboard → Project settings → API keys → "App-specific keys"
//   Use the iOS public SDK key (starts with "appl_").
//
// After pasting your key below, native iOS purchases will work end-to-end.

export const RC_CONFIG = {
  /** iOS public SDK key (starts with "appl_..."). Empty = IAP disabled. */
  iosApiKey: "",
  /** Entitlement identifier configured in RevenueCat (e.g. "pro"). */
  entitlementId: "pro",
} as const;

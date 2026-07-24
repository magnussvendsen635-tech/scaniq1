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
  /**
   * iOS public SDK key (starts with "appl_...").
   * Empty string = IAP disabled (safe for web/preview).
   * REPLACE BEFORE APP STORE UPLOAD — paste your production key from
   * RevenueCat → Project settings → API keys → iOS.
   */
  iosApiKey: "appl_OCtjGpzyNYzMVDRHjdxmgyFgOGO", // production key set — ready for Xcode archive

  /** Entitlement identifier configured in RevenueCat (e.g. "pro"). */
  entitlementId: "pro",
} as const;

#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
EXPECTED_CLIENT_ID="com.kinetex.scaniq"

fail() {
  echo "Apple Sign-In verification failed: $1" >&2
  exit 1
}

grep -q "appId: '$EXPECTED_CLIENT_ID'" "$ROOT_DIR/capacitor.config.ts" || \
  fail "Capacitor appId must be $EXPECTED_CLIENT_ID"

bundle_id_count="$(grep -c "PRODUCT_BUNDLE_IDENTIFIER = $EXPECTED_CLIENT_ID;" "$ROOT_DIR/ios/App/App.xcodeproj/project.pbxproj" || true)"
[ "$bundle_id_count" -eq 2 ] || \
  fail "Debug and Release must both use $EXPECTED_CLIENT_ID"

grep -q '<key>com.apple.developer.applesignin</key>' "$ROOT_DIR/ios/App/App/App.entitlements" || \
  fail "Sign in with Apple entitlement is missing"

grep -q '@capacitor-community/apple-sign-in' "$ROOT_DIR/package.json" || \
  fail "Native Apple Sign-In plugin is missing"

grep -q 'APPLE_NATIVE_CLIENT_ID = "com.kinetex.scaniq"' "$ROOT_DIR/src/lib/appleAuth.ts" || \
  fail "Native Apple client ID does not match the Bundle ID"

grep -q 'supabase.auth.signInWithIdToken' "$ROOT_DIR/src/lib/appleAuth.ts" || \
  fail "Apple identity token is not exchanged with signInWithIdToken"

grep -q 'nonce: rawNonce' "$ROOT_DIR/src/lib/appleAuth.ts" || \
  fail "Raw nonce is not passed during the token exchange"

echo "Apple Sign-In configuration verified for $EXPECTED_CLIENT_ID"
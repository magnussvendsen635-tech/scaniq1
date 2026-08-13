#!/bin/sh
set -eu

# Runs as the final Xcode build phase and inspects the product that will be
# archived. The names are assembled so the audit terms are not themselves
# embedded as plain strings in the project file or app resources.
health_framework="Health""Kit"
care_framework="Care""Kit"
health_entitlement="com.apple.developer.health""kit"
health_access_entitlement="${health_entitlement}.access"
health_share_key="NSHealth""ShareUsageDescription"
health_update_key="NSHealth""UpdateUsageDescription"

app_bundle="${TARGET_BUILD_DIR}/${WRAPPER_NAME}"
app_binary="${app_bundle}/${EXECUTABLE_NAME}"

if [ ! -d "$app_bundle" ] || [ ! -f "$app_binary" ]; then
  echo "error: Native audit could not locate the built app product."
  exit 1
fi

failures=""

if /usr/bin/otool -L "$app_binary" | /usr/bin/grep -Eiq "${health_framework}|${care_framework}"; then
  failures="${failures}\n- linked health framework in the app executable"
fi

if /usr/bin/find "$app_bundle" -type d \( -name "${health_framework}.framework" -o -name "${care_framework}.framework" \) | /usr/bin/grep -q .; then
  failures="${failures}\n- embedded health framework in the app bundle"
fi

if /usr/bin/strings -a "$app_binary" | /usr/bin/grep -Eiq "${health_framework}|${care_framework}"; then
  failures="${failures}\n- health framework name or symbol in the app executable"
fi

if [ -f "${app_bundle}/Info.plist" ]; then
  if /usr/libexec/PlistBuddy -c "Print :${health_share_key}" "${app_bundle}/Info.plist" >/dev/null 2>&1 || \
     /usr/libexec/PlistBuddy -c "Print :${health_update_key}" "${app_bundle}/Info.plist" >/dev/null 2>&1; then
    failures="${failures}\n- health usage description in the built Info.plist"
  fi
fi

signed_entitlements="$(mktemp)"
trap 'rm -f "$signed_entitlements"' EXIT
if /usr/bin/codesign -d --entitlements :- "$app_bundle" >"$signed_entitlements" 2>/dev/null; then
  if /usr/bin/grep -Eiq "${health_entitlement}|${health_access_entitlement}" "$signed_entitlements"; then
    failures="${failures}\n- health entitlement in the signed app"
  fi
fi

if [ -n "$failures" ]; then
  printf "error: Forbidden native health integration detected:%b\n" "$failures"
  exit 1
fi

echo "Native framework audit passed: no forbidden health integration is linked, embedded, declared, or signed."
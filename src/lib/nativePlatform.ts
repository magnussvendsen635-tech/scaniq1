import { Capacitor } from "@capacitor/core";

/**
 * True whenever the app runs inside the native Capacitor shell (iOS/iPadOS).
 * Belt-and-braces: the Capacitor API, the injected global and the custom
 * capacitor:// scheme are all checked.
 */
export function isNativeShell(): boolean {
  try {
    if (Capacitor.isNativePlatform?.()) return true;
    if (Capacitor.getPlatform?.() !== "web") return true;
  } catch {
    /* web */
  }
  try {
    const w = window as any;
    if (w.Capacitor?.isNativePlatform?.()) return true;
    if (/^capacitor:/i.test(window.location.protocol)) return true;
    if (w.webkit?.messageHandlers?.bridge) return true;
  } catch {
    /* ignore */
  }
  return false;
}

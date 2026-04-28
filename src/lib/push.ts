// Push subscription helpers — VAPID/Web Push
import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY =
  "BHMSVjaFGPFNAs5ZrQiqzkW1QTORlizqVDkD7T84bcMBnwQxrPrb-1v5XmIhc2P_uLlfTXftRw_ZfKiogKpdCNo";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    // Don't register inside iframes (Lovable preview)
    if (window.self !== window.top) return null;
  } catch {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.error("[push] sw register failed", e);
    return null;
  }
}

export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;

  const reg = await registerServiceWorker();
  if (!reg) return false;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return false;

  const json = sub.toJSON();
  const endpoint = json.endpoint || sub.endpoint;
  const p256dh = json.keys?.p256dh || arrayBufferToBase64(sub.getKey("p256dh"));
  const authKey = json.keys?.auth || arrayBufferToBase64(sub.getKey("auth"));

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth: authKey,
        user_agent: navigator.userAgent,
      },
      { onConflict: "endpoint" }
    );
  if (error) {
    console.error("[push] save subscription failed", error);
    return false;
  }
  return true;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
}

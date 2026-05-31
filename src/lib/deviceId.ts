// Persistent per-device identifier stored in localStorage.
// Used for anti-fraud auditing on signup.
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  const KEY = "scaniq_device_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(KEY, id);
  }
  return id;
}

export async function getClientIp(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    if (!res.ok) return null;
    const j = await res.json();
    return j?.ip ?? null;
  } catch {
    return null;
  }
}

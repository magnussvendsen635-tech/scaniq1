import { Capacitor } from "@capacitor/core";

// Lightweight cross-platform health bridge.
// - iOS: @perfood/capacitor-healthkit
// - Android: capacitor-health-connect
// - Web: no-op stubs

export type HealthSnapshot = {
  steps?: number;
  caloriesBurned?: number;
  weightKg?: number;
  source: "healthkit" | "healthconnect" | "unavailable";
};

export function isHealthAvailable() {
  return Capacitor.isNativePlatform();
}

export function healthPlatform(): "ios" | "android" | "web" {
  const p = Capacitor.getPlatform();
  if (p === "ios") return "ios";
  if (p === "android") return "android";
  return "web";
}

export async function requestHealthPermissions(): Promise<boolean> {
  const platform = healthPlatform();
  try {
    if (platform === "ios") {
      const { CapacitorHealthkit } = await import("@perfood/capacitor-healthkit");
      await CapacitorHealthkit.requestAuthorization({
        all: [],
        read: ["steps", "activeEnergy", "weight"],
        write: [],
      });
      return true;
    }
    if (platform === "android") {
      const { HealthConnect } = await import("capacitor-health-connect");
      const res = await HealthConnect.requestHealthPermissions({
        read: ["Steps", "ActiveCaloriesBurned", "Weight"],
        write: [],
      });
      return !!res;
    }
    return false;
  } catch (e) {
    console.error("Health permission error", e);
    return false;
  }
}

export async function readTodayHealth(): Promise<HealthSnapshot> {
  const platform = healthPlatform();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();

  try {
    if (platform === "ios") {
      const { CapacitorHealthkit } = await import("@perfood/capacitor-healthkit");
      const stepsRes: any = await CapacitorHealthkit.queryHKitSampleType({
        sampleName: "stepCount",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 0,
      }).catch(() => null);
      const calRes: any = await CapacitorHealthkit.queryHKitSampleType({
        sampleName: "activeEnergyBurned",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 0,
      }).catch(() => null);
      const weightRes: any = await CapacitorHealthkit.queryHKitSampleType({
        sampleName: "weight",
        startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
        endDate: end.toISOString(),
        limit: 1,
      }).catch(() => null);

      const steps = (stepsRes?.resultData ?? []).reduce((a: number, b: any) => a + (b.value ?? 0), 0);
      const cal = (calRes?.resultData ?? []).reduce((a: number, b: any) => a + (b.value ?? 0), 0);
      const lastWeight = weightRes?.resultData?.[0]?.value;

      return {
        steps: Math.round(steps),
        caloriesBurned: Math.round(cal),
        weightKg: lastWeight ? Number(lastWeight) : undefined,
        source: "healthkit",
      };
    }

    if (platform === "android") {
      const { HealthConnect } = await import("capacitor-health-connect");
      const time: any = { startTime: start, endTime: end };
      const steps: any = await (HealthConnect as any).readRecords({ type: "Steps", timeRangeFilter: time }).catch(() => null);
      const cal: any = await (HealthConnect as any).readRecords({ type: "ActiveCaloriesBurned", timeRangeFilter: time }).catch(() => null);
      const weight: any = await (HealthConnect as any).readRecords({
        type: "Weight",
        timeRangeFilter: { startTime: new Date(Date.now() - 86400000 * 30), endTime: end },
      }).catch(() => null);

      const totalSteps = (steps?.records ?? []).reduce((a: number, b: any) => a + (b.count ?? 0), 0);
      const totalCal = (cal?.records ?? []).reduce((a: number, b: any) => a + (b.energy?.inKilocalories ?? 0), 0);
      const lastW = weight?.records?.[weight.records.length - 1]?.weight?.inKilograms;

      return {
        steps: Math.round(totalSteps),
        caloriesBurned: Math.round(totalCal),
        weightKg: lastW ? Number(lastW) : undefined,
        source: "healthconnect",
      };
    }

    return { source: "unavailable" };
  } catch (e) {
    console.error("Health read error", e);
    return { source: "unavailable" };
  }
}

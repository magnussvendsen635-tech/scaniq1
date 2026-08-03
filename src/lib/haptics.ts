import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

const native = () => Capacitor.isNativePlatform();

export const hapticLight = () => {
  if (!native()) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};

export const hapticMedium = () => {
  if (!native()) return;
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
};

export const hapticSuccess = () => {
  if (!native()) return;
  Haptics.notification({ type: NotificationType.Success }).catch(() => {});
};

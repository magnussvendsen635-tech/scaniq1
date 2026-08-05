# Verify iOS permission descriptions (Info.plist)

## Current state

The iOS permission descriptions in `ios/App/App/Info.plist` are already present and accurate:

- `NSCameraUsageDescription`  
  "ScanIQ needs camera access to scan your food and read nutrition labels."
- `NSPhotoLibraryUsageDescription`  
  "ScanIQ needs photo access so you can pick meal photos from your library."
- `NSPhotoLibraryAddUsageDescription`  
  "ScanIQ can save scanned meal photos to your library."

HealthKit is **not** used in the app: the only remaining HealthKit mention is in `src/pages/Disclosures.tsx`, where it is explicitly stated that the app does **not** use HealthKit. Therefore no `NSHealthShareUsageDescription` or `NSHealthUpdateUsageDescription` keys are needed.

The app uses Capacitor Local Notifications (`src/lib/notifications.ts`), but iOS does **not** require an Info.plist usage description for local notifications, so no extra keys are needed there either.

## Proposed action

No code changes are required for App Review on this point. The camera and photo-library descriptions explain exactly why the permissions are requested, and HealthKit is not part of the app.

If you later decide to add Apple Health integration, we would need to add:
- `NSHealthShareUsageDescription` — explaining why we read weight/activity.
- `NSHealthUpdateUsageDescription` — explaining why we write nutrition/meals.

Otherwise, the current Info.plist is already compliant.

# ScanIQ — iOS build guide

Følg trinene i rækkefølge. Alt skal køres **lokalt på din Mac**, ikke i Lovable.

---

## 0. Før du starter

- macOS med **Xcode 15+** installeret
- **Node 18+** og **npm** installeret
- En **Apple Developer**-konto ($99/år) tilføjet i Xcode → Settings → Accounts
- **RevenueCat**-konto med et iOS-projekt oprettet (til production-nøglen)

---

## 1. Hent projektet lokalt

I Lovable: klik **GitHub → Connect** (hvis ikke gjort) → push projektet.
Så på din Mac:

```bash
git clone <dit-github-repo>
cd <projekt-mappe>
npm install
```

---

## 2. Sæt RevenueCat production-nøglen

Åbn `src/config/revenuecat.ts` og udskift den tomme streng:

```ts
iosApiKey: "appl_XXXXXXXXXXXXXXXXXXXXXXXXXX", // din production-nøgle
```

Nøglen findes i RevenueCat dashboard → **Project settings → API keys → iOS**.
Commit ændringen.

---

## 3. Byg web-assets og tilføj iOS-platform

```bash
npm run build
npx cap add ios
npx cap sync ios
```

Det opretter mappen `ios/` med et Xcode-projekt.

---

## 4. Kopiér app-ikonet ind i Xcode

`resources/icon.png` (1024×1024) er allerede genereret.
Nem vej: brug `@capacitor/assets` til at generere alle størrelser automatisk:

```bash
npm install --save-dev @capacitor/assets
npx capacitor-assets generate --ios --iconBackgroundColor '#FF4D00'
```

Eller manuelt: åbn `ios/App/App/Assets.xcassets/AppIcon.appiconset` i Xcode
og træk `resources/icon.png` ind på "App Store" slottet.

---

## 5. Tilføj Info.plist-strings (KRÆVET af Apple)

Åbn `ios/App/App/Info.plist` og tilføj disse nøgler inde i `<dict>`:

```xml
<key>NSCameraUsageDescription</key>
<string>ScanIQ needs camera access to scan your food and read nutrition labels.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>ScanIQ needs photo access so you can pick meal photos from your library.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>ScanIQ can save scanned meal photos to your library.</string>

<key>NSHealthShareUsageDescription</key>
<string>ScanIQ reads weight and activity from Apple Health to personalise your daily goals.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>ScanIQ writes meals and nutrition data to Apple Health so you can track it there.</string>

<key>NSUserTrackingUsageDescription</key>
<string>ScanIQ uses this to improve product recognition. You can decline.</string>
```

---

## 6. Signing i Xcode

Åbn projektet:

```bash
npx cap open ios
```

I Xcode:

1. Vælg **App**-target → fanen **Signing & Capabilities**
2. Sæt **Team** til din Apple Developer-konto
3. Bekræft **Bundle Identifier = `site.scaniq.app`**
4. Slå **Automatically manage signing** til
5. Klik **+ Capability** → tilføj **Sign in with Apple** og **In-App Purchase**

---

## 7. Kør på simulator eller device

- Simulator: vælg fx *iPhone 15 Pro* øverst → tryk ▶️
- Fysisk device: sæt din iPhone i USB → vælg den → ▶️
  (Første gang: gå ind på iPhone → Settings → General → VPN & Device Management → tillid din udvikler-cert)

---

## 8. Upload til TestFlight

1. I Xcode: **Product → Archive**
2. Når arkivet er klar: **Distribute App → App Store Connect → Upload**
3. Log på [App Store Connect](https://appstoreconnect.apple.com)
4. Opret ny app med Bundle ID `site.scaniq.app`
5. Under **In-App Purchases** → opret produkt `com.scaniq.pro.monthly` ($19/md, auto-renewable)
6. Udfyld **App Privacy**-formularen
7. Upload screenshots (6.7", 6.5", 5.5")
8. Send til review

---

## Efter git pull i fremtiden

Hver gang du henter nye ændringer fra Lovable/GitHub:

```bash
git pull
npm install
npm run build
npx cap sync ios
```

Så åbn Xcode igen og kør.

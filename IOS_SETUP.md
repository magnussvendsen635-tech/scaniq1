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

I Lovable: klik **Plus (+) → GitHub → Connect project** (hvis ikke gjort) → push projektet.
Dit GitHub-repo hedder **scaniq1**.

Så på din Mac:

```bash
cd ~
git clone https://github.com/DIN_BRUGER/scaniq1.git
cd scaniq1
npm install
```

> Erstat `DIN_BRUGER` med dit GitHub-brugernavn eller organisation. Hvis du er i en organisation, brug `https://github.com/DIN_ORG/scaniq1.git`.
>
> **Vigtigt:** Alle kommandoer nedenfor skal køres inde i `scaniq1`-mappen. Hvis du får fejlen `fatal: not a git repository`, betyder det, at du står i den forkerte mappe — kør `cd ~/scaniq1` først.

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

> **Vigtigt:** Bundle Identifier skal stå præcis som `site.scaniq.app` i **TARGETS → App**, ikke kun under **PROJECT**.
> Hvis Xcode viser noget som `scaniQ-Calorie-Tracker-com.kinetex.scaniq`, er det forkert og skal ændres manuelt til `site.scaniq.app`.

### Hvis Xcode stadig siger “No profiles found”

Fejlen betyder normalt, at Xcode prøver at lave signing til den forkerte Bundle Identifier eller ikke kan få Apple til at lave en provisioning profile.

Tjek dette i rækkefølge:

1. Klik på **App** under **TARGETS** i venstre side.
2. Gå til **Signing & Capabilities**.
3. Vælg fanen **All** eller **Release**.
4. Sæt **Bundle Identifier** til præcis:

```text
site.scaniq.app
```

5. Sæt **Team** til din betalte Apple Developer-konto.
6. Slå **Automatically manage signing** til.
7. Vælg en rigtig destination øverst i Xcode:
   - en fysisk iPhone, eller
   - en iPhone Simulator

Undgå at bygge direkte til **Any iOS Device**, mens signing fejlsøges.

Hvis Xcode stadig viser den gamle identifier, så luk Xcode og kør lokalt på din Mac:

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Derefter skal du igen kontrollere **TARGETS → App → Signing & Capabilities → Bundle Identifier**.

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

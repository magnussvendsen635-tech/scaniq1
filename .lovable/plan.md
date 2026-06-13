
Du har valgt "alt på én gang". Det er fire store stykker arbejde — her er præcis hvad jeg bygger, i den rækkefølge der giver mening teknisk. Jeg leverer det samlet og forklarer hvad du selv skal gøre udenfor koden (App Store Connect, RevenueCat-konto).

---

## 1) Apple StoreKit via RevenueCat

**Hvad jeg gør i koden:**
- Tilføjer `@revenuecat/purchases-capacitor` + `cordova-plugin-purchase` peer deps.
- Skriver `useIAP.ts` om til at bruge RevenueCat's `Purchases` SDK: `configure`, `getOfferings`, `purchasePackage`, `restorePurchases`, listener på `customerInfo`.
- Premium-entitlement hedder `pro`. Når `customerInfo.entitlements.active.pro` er sat → kald ny edge function `iap-sync` der opdaterer `subscriptions` + `profiles.is_premium` server-side.
- Tilføjer `RC_API_KEY_IOS` som secret (du indtaster den når jeg spørger).
- `Premium.tsx` opdateres: viser kun ét betalt produkt ($19/md). "Basic" beskrives som den gratis plan (ingen IAP, ingen knap).
- `capacitor.config.ts` får RevenueCat-plugin entry.

**Hvad du selv skal gøre (jeg kan ikke gøre det for dig):**
1. Opret app i App Store Connect, lav auto-renewable subscription `com.scaniq.pro.monthly` til $19.
2. Opret gratis RevenueCat-konto, koble App Store Connect på, lav entitlement `pro` og offering med månedspakken.
3. Giv mig RevenueCat iOS API-nøglen → jeg gemmer den som secret.

---

## 2) Bekræftelses-email ved køb

- Ny app email-template `purchase-confirmation.tsx` (brand-stilet, viser plan, pris, fornyelsesdato, "managed by Apple").
- Edge function `iap-sync` kalder `send-transactional-email` med `templateName: 'purchase-confirmation'` og `idempotencyKey: iap_<transactionId>` så dubletter ikke sendes ved retries.
- Basic-tier er gratis → ingen købsmail der. (Hvis du vil have en "velkommen til Basic"-mail ved signup er det en separat opgave.)
- Kræver email-domæne sat op. Tjekker status; hvis ikke sat op, åbner jeg setup-dialogen.

---

## 3) Sikkerhedshærdning

- **Data encryption**: Database og Storage er allerede krypteret at rest (AES-256) og in transit (TLS) af Lovable Cloud — ingen kodeændring nødvendig, jeg dokumenterer det.
- **Authentication**: Aktiverer HIBP leaked-password check via `configure_auth`. Sessions bruger allerede httpOnly refresh tokens med auto-rotation.
- **Admin protection**: Bruger eksisterende `user_roles` + `has_role()`/`is_admin()`. Migration: INSERT `('magnussvendsen635@gmail.com'->user_id, 'admin')`. Alle admin-edge-functions (`admin-stats`, `admin-user-action`, ny `admin-financials`) validerer via `is_admin()` RPC server-side. `Admin.tsx` route guard tjekker via RPC, ikke email.
- **Rate limiting**: Backend har ikke en standard primitiv. Jeg implementerer ad-hoc i-memory limiter i en ny edge function `auth-rate-limit` (kaldes pre-login/signup fra klient): 5 forsøg/15min pr. IP+email. Bemærk: dette er best-effort, ikke produktionsgrad — en rigtig løsning kræver Redis/Upstash. Vil du have det sådan?
- **Input validation**: Zod-schemas på alle edge functions der modtager bruger-input (`iap-sync`, `admin-financials`, eksisterende discount-redeem hvis findes). XSS i React er allerede beskyttet (ingen `dangerouslySetInnerHTML` i koden). Tilføjer `trim()`, længdegrænser, format-checks.

---

## 4) Financials & Analytics dashboard

Ny tab i `Admin.tsx` + ny edge function `admin-financials` (admin-only, validerer via `is_admin()`):

- **Revenue Overview**: total revenue (sum af completed transactions fra Apple via `subscriptions` + tracked priser), count Basic-brugere (is_premium=false) vs Premium ($19).
- **Discount tracking**: tabel der joiner `discount_codes` med faktiske bruger-redemptions. Kræver at jeg tilføjer en `discount_redemptions` tabel (eller kolonne på `subscriptions`) — Apple IAP understøtter ikke promo-koder på vores side direkte, så koder bliver app-interne credits/rabatter. Jeg tilføjer tabellen.
- **Customer insights**: liste over alle transactions: email, tier, beløb, dato, anvendt kode.
- **Daily signups chart**: bruger eksisterende `admin-stats` daily series, tilføjer ny "signups_daily" serie.

---

## Tekniske detaljer

- Ny edge function: `iap-sync` (verify_jwt=true, validerer RevenueCat-webhook signature ELLER kaldes fra klient med customerInfo).
- Ny edge function: `admin-financials` (verify_jwt=true, is_admin gate).
- Ny edge function: `auth-rate-limit` (verify_jwt=false).
- Ny tabel: `discount_redemptions(id, code_id, user_id, subscription_id, amount_saved, created_at)` med RLS (admin select, service_role all).
- Ny template: `purchase-confirmation.tsx` registreret i `registry.ts`.
- Migration: insert admin-rolle for din email.
- Secret: `RC_API_KEY_IOS` (bedes om når vi når dertil).

---

## Spørgsmål før jeg starter

1. **Rate limiting**: Er ad-hoc in-memory limiter OK, eller skal jeg springe det over indtil vi har Redis? (in-memory nulstilles ved hver function cold start, så det stopper kun naive angreb).
2. **RevenueCat-konto**: Har du allerede en, eller skal jeg pause efter koden er skrevet så du kan oprette den og give mig nøglen?
3. **Discount-koder**: Skal koder give in-app rabat (vi sporer det selv), eller bruges Apples Offer Codes (helt anderledes flow)? Jeg antager in-app.

Svar på de tre, så bygger jeg det hele.

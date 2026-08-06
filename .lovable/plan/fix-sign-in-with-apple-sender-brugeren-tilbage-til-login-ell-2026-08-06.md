# Fix: Sign in with Apple sender brugeren tilbage til login (eller loader i det uendelige)

## Hvad der sker i dag

Efter et gennemgang af login-siden, Apple-hjælperen og app-ruterne er der tre steder, hvor flowet kan ende på login-skærmen eller i en evig spinner:

1. **Web-redirect bruges som fallback inde i app'en.** Hvis Apple-plugin'et ikke er tilgængeligt i den native build (eller platform-tjekket fejler ét sekund), falder knappen tilbage til browser-OAuth-flowet. Det kan ikke returnere en session inde i app'ens webview — brugeren lander tilbage på login.
2. **Navigation sker før sessionen er hydreret.** Efter Apple-tokenet er byttet, navigeres der straks til `/app`. Er auth-state ikke opdateret endnu, sender rute-vagten brugeren tilbage til forsiden/login. Er brugeren ikke onboardet, skal der desuden sendes til onboarding, ikke `/app`.
3. **Ingen timeout på Apple-arket.** Hvis Apple-sheetet eller token-udvekslingen hænger, bliver knappen i "loading" for altid — ingen fejl, ingen vej ud.

## Hvad jeg laver

**Apple-hjælperen (`src/lib/appleAuth.ts`)**
- Tjek at Apple-plugin'et faktisk er registreret i den native build, før flowet starter; er det ikke, gives en konkret fejl i stedet for en tavs fallback.
- Læg en samlet timeout (ca. 45 sek.) om Apple-arket og token-udvekslingen, så et hængende kald altid ender i en fejl.
- Vent på sessionen via auth-state-lytteren (med fallback-polling) i stedet for kun fast polling, så vi ikke navigerer for tidligt.

**Login-siden (`src/pages/Auth.tsx`)**
- På native må Apple-knappen aldrig falde tilbage til web-redirect — fejler den native vej, vises fejlboksen med "Try again".
- Naviger først når `session` fra auth-konteksten faktisk findes (effekt der reagerer på session), og send til onboarding, hvis brugeren ikke er onboardet.
- Nulstil altid "loading"-tilstanden, uanset udfald.
- Erstat den blanke skærm under auth-loading med en synlig spinner, så det ikke ligner en død side.

**Diagnostik**
- Log de nye tilfælde (plugin mangler, timeout) i den eksisterende Apple-debugside, så en fejlet reviewer-session kan aflæses direkte i app'en.

## Verificering

- Kør igennem web-login-siden med Playwright for at bekræfte, at siden renderer, at Apple-fejlboksen med "Try again" vises korrekt, og at der ikke opstår redirect-loop mellem `/auth`, `/` og `/onboarding`.
- Den native Apple-sheet kan kun testes på enhed/simulator — jeg beskriver den korte testrækkefølge til dig efter implementeringen.

## Bemærk (uden for koden)

Fejlen kan også skyldes konfiguration: Apple-provideren i backenden skal have **Client ID = `site.scaniq.app`** (bundle-id'et), ellers afvises den native token med en audience-fejl, og brugeren ryger tilbage til login. Det tjekker vi, hvis koden alene ikke løser det.

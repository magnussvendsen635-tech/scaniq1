Mål: Sikre, at ScanIQ bruger kryptering og stærke adgangskontroller, lukke de nuværende sikkerhedsadvarsler, og offentliggøre en trust/sikkerhedsside for brugerne.

Nuværende status (verificeret):
- Data sendes krypteret (HTTPS/TLS) og ligger krypteret i hvile hos Lovable Cloud backend.
- RLS (Row-Level Security) er aktiveret på brugertabeller, så brugere normalt kun ser egne data.
- Kodeord hashes — appen ser aldrig kodeord i klar tekst.
- Der er ingen kritiske (error) sikkerhedsfund i øjeblikket.
- Supabase-linteren rapporterer 23 advarsler, især om SECURITY DEFINER-funktioner, der kan kaldes af anonyme eller almindelige brugere uden at være nødvendigt.
- Der findes allerede en /privacy-side, men ingen dedikeret /security- eller trust-side.

Plan:

1. Hærd databaseadgangen
   - Gennemgå alle SECURITY DEFINER-funktioner og fjern `EXECUTE` for `anon`/`public` overalt, hvor funktionen ikke er tiltænkt offentlige kald.
   - Sikre, at `authenticated` kun kan kalde de funktioner, de har brug for (f.eks. `has_role`, `is_admin`, `check_and_increment_ai_quota`), og at service-/admin-funktioner kun er åbne for `service_role`.
   - Revidere RLS-policies og GRANTs på tabeller for at sikre, at ingen brugere kan læse/skrive andres data.
   - Sikre, at `user_roles` kun kan læses af `authenticated` og `service_role` (ikke `anon`).

2. Hærd app-sikkerheden
   - Tilføje sikkerheds-headere i Vite/Edge Function-responses (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
   - Implementere automatisk udløb af inaktive sessioner (f.eks. 7 dage på web, 30 dage på mobil — efter aftale).
   - Tilføje login-aktivitetslog: registrer seneste login-tidspunkt og IP, og vis en "ny enhed"-advarsel/besked ved usædvanlige logins.
   - Sikre, at adgangskodeændringer kræver bekræftelse af nuværende kodeord.
   - Overveje rate limiting på login/forsøg (håndteres primært af backend, men appen kan vise brugervenlige fejl).

3. Opret offentlig /security-side (trust-side)
   - Ny side: /security med SEO, oversat via eksisterende i18n-system.
   - Indhold skal forklare på almindeligt sprog:
     - Kryptering i transit og i hvile.
     - RLS: kun brugeren selv kan se sine måltider, vægt, billeder osv.
     - Adgangskontrol: hashed passwords, Google/Apple OAuth, validering af email.
     - Hvor data opbevares (Lovable Cloud backend / EU).
     - Underleverandører: Apple App Store (betaling via Apple som merchant of record), Google Gemini (AI-analyse via Lovable AI Gateway).
     - Dataopbevaring: brugerdata slettes ved kontosletning, betalingsdata opbevares efter lovkrav.
     - Brugerrettigheder (GDPR): indsigt, rettelse, sletning, eksport.
     - Kontakt: scaniqapp1@gmail.com.
   - Link til siden fra /privacy, /settings, /terms og landing/footer.
   - Brug appens eksisterende designsystem og komponenter — ingen ny palette.

4. Dokumentation og verifikation
   - Opdatere sikkerheds-memory med, hvad der er bevidst valgt (f.eks. offentlige price-sider, anonyme sider uden RLS).
   - Efter rettelser: køre Supabase-linter og sikkerhedsscan igen for at bekræfte, at advarslerne er væk.
   - Teste login, signup, password reset, konto-sletning og AI-scan-kvoten end-to-end.

Krav til brugeren:
- Bekræft, om sessioner skal udløbe efter 7 dage (web) / 30 dage (mobil), eller andre værdier.
- Bekræft emailadresse til sikkerhedskontakt (pt. scaniqapp1@gmail.com) og om den skal stå på /security.
- Beslutning: skal vi tilføje "ny enhed"-beskeder som push/email, eller blot vise en note i appen?

Efter plan-godkendelse: Jeg starter med database-hærdningen og /security-siden, derefter app-hærdning og verifikation.
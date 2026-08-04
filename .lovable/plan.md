Mål: Forbinde ScanIQ-projektet til GitHub, så kodeændringer automatisk synkroniseres til et GitHub-repository.

Nuværende status (verificeret):
- Projektet er p.t. hostet på Lovable's interne git-lagring (origin) og en S3-backup (secondary).
- Ingen GitHub-remote er konfigureret endnu.
- Lovable har indbygget to-vejs synkronisering med GitHub (Plus-menu → GitHub → Connect project).

Plan:

1. Forbind GitHub-konto i Lovable
   - Åbn Lovable-editoren (projektet du er i nu).
   - Klik på Plus (+)-menuen nederst til venstre i chat-input.
   - Vælg GitHub → Connect project.
   - Godkend Lovable GitHub App'en på din GitHub-konto.
   - Vælg den GitHub-konto/organisation, hvor repository'et skal oprettes.
   - Klik "Create Repository" i Lovable for at oprette et nyt repo med al nuværende kode.

2. Bekræft synkronisering
   - Når repo'et er oprettet, vil Lovable automatisk pushe den nuværende kode til GitHub.
   - Efterfølgende ændringer i Lovable synkroniseres automatisk til GitHub.
   - Ændringer pusher til GitHub (fra Lovable) eller puller til Lovable (hvis du pusher fra Xcode/VS Code) uden manuelle trin.

3. Valgfrit: Lokal udvikling / Xcode
   - Hvis du vil bygge i Xcode eller redigere kode lokalt, kan du klone repo'et:
     `git clone <github-repo-url>`
   - Pushe ændringer fra din lokale maskine syncer tilbage til Lovable.
   - Bemærk: iOS-specifikke filer (Xcode-projekt, Capacitor-config) ligger allerede i projektet og vil følge med.

4. Verifikation
   - Tjek at repo'et findes på GitHub med den forventede projektstruktur (src, ios, supabase, osv.).
   - Bekræft, at seneste commits matcher de ændringer, du har lavet i Lovable.

Krav til brugeren:
- Du skal være logget ind på GitHub i browseren og have tilladelse til at oprette repositories i den valgte konto/organisation.
- Hvis du ønsker et bestemt reponavn, så sig til — ellers bruger Lovable projektnavnet som standard.

Efter plan-godkendelse: Jeg guider dig trin-for-trin i UI'et, eller du kan selv køre GitHub-connect-flowet fra Plus-menuen.

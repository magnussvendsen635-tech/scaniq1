Fejlen på billedet skyldes, at Xcode stadig bygger med Bundle Identifier:

`scaniQ-Calorie-Tracker-com.kinetex.scaniq`

Men projektets Capacitor-konfiguration er sat til:

`site.scaniq.app`

Derfor kan Apple ikke finde eller generere en provisioning profile til den identifier, Xcode prøver at bruge.

Plan:

1. Bekræft at webprojektets `capacitor.config.ts` allerede bruger `site.scaniq.app`.
2. Opdater iOS-guiden, så den meget tydeligt siger, at Xcode Bundle Identifier manuelt skal ændres til præcis `site.scaniq.app` efter `npx cap add ios`.
3. Tilføj en fejlfindingssektion til `IOS_SETUP.md` for netop denne Xcode-fejl:
   - Hvis Xcode viser `scaniQ-Calorie-Tracker-com.kinetex.scaniq`, skal den ændres.
   - Vælg `App` target, ikke kun Project.
   - Gå til `Signing & Capabilities`.
   - Sæt Bundle Identifier til `site.scaniq.app`.
   - Vælg dit Apple Developer Team.
   - Vælg en rigtig iPhone eller simulator, ikke kun `Any iOS Device`.
4. Tilføj de lokale kommandoer du skal køre bagefter på din Mac:

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Vigtigt: Jeg kan rette projektfiler og guiden her i Lovable, men jeg kan ikke ændre det Xcode allerede har genereret på din Mac, før du laver `git pull` og enten syncer eller manuelt ændrer Bundle Identifier i Xcode.
# Fjern HealthKit/CareKit og synliggør sundhedskilder

## Implementering
- Gennemgå produktions-iOS-targetet, Swift Package Manager, installerede Capacitor-plugins, build phases, entitlements og Info.plist for direkte og transitive HealthKit/CareKit-referencer.
- Fjern alle resterende HealthKit/CareKit-tekststrenge fra de webfiler, der pakkes ind i den native app, så de heller ikke kan udløse en binær/indholdsscanning.
- Tilføj en tydelig sektion med titlen **Health Information & Sources** direkte i Settings med tre store, klikbare officielle links og en kort forklaring af, hvad hver kilde understøtter.
- Opdatér referencesiden med separate officielle kilder til Mifflin-St Jeor, WHO og FAO/WHO/UNU Human Energy Requirements.

## Verifikation
- Byg webappen og synkronisér den til iOS-projektets indlejrede `public`-mappe.
- Scan hele det synkroniserede iOS-projekt og alle installerede native afhængigheder igen efter de forbudte strenge.
- Kontrollér den synlige Settings-side og links i browseren.
- Forsøg arkiv/binærkontrol lokalt. Miljøet er Linux uden Xcode, så hvis `.xcarchive` ikke kan produceres her, leveres en automatisk kontrolkommando/script, der stopper den næste macOS-build, hvis det færdige arkiv linker eller indeholder HealthKit/CareKit.

# Lokaliserede App Store-priser i stedet for hardcodede USD-priser

## Problem
Prisen initialiseres i dag som `"$19"` / `"$179"` i `useIAP`. På web (og indtil StoreKit svarer på native) vises derfor altid dollarpriser, uanset brugerens App Store-region. Først når RevenueCat `getOfferings()` returnerer, overskrives labels med `product.priceString`.

## Hvad der ændres
Kun visning af pris — produkter, produkt-ID'er og RevenueCat-opsætning røres ikke.

1. **Ingen hardcodede valutabeløb.** Startværdien bliver `null` i stedet for `"$19"`/`"$179"`.
2. **StoreKit er eneste kilde.** Når offerings er hentet, bruges `product.priceString` (allerede formateret af Apple i brugerens App Store-valuta og -region).
3. **Fallback ved manglende pris** (web-preview, offline, RevenueCat ikke tilgængelig): vis en diskret placeholder — kort skeleton mens der loades, derefter tekst i stil med "Se pris i App Store" i stedet for et forkert dollarbeløb.
4. **Årlig besparelse** (hvis den vises) beregnes ud fra de numeriske `product.price`-værdier fra StoreKit, ikke ud fra faste tal.

## Berørte filer
- `src/hooks/useIAP.ts` — labels bliver `string | null`; eksponer også numerisk pris + `currencyCode` fra pakkerne, så tekster kan bygges korrekt.
- `src/pages/Pricing.tsx` — render skeleton/fallback når label mangler.
- `src/pages/Premium.tsx` — samme behandling for begge prisblokke.

## Bemærkning
Priser kan kun hentes rigtigt i den native iOS-app. I web-previewet findes StoreKit ikke, så der vil altid vises fallback-teksten — det er forventet og korrekt frem for et misvisende "$19".
